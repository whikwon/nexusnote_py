from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.models.concept import Concept
from app.models.link import Link
from app.schemas.concept import ConceptCreate, ConceptUpdate


class CRUDConcept(CRUDBase[Concept, ConceptCreate, ConceptUpdate]):
    async def get_by_name(self, engine: AIOEngine, name: str) -> Concept | None:
        # Check if a concept with the given name already exists
        return await engine.find_one(Concept, Concept.name == name)

    async def delete(self, engine: AIOEngine, id: str) -> Concept:
        concept = await super().delete(engine, id=id)

        # Cleanup: delete all Link documents that reference this concept.
        await engine.remove(Link, {"concept_ids": {"$in": [id]}})
        return concept

    # New method: get all Link documents that reference the given concept.
    async def get_links(self, engine: AIOEngine, concept_id: str) -> list[Link]:
        return await engine.find(Link, {"concept_ids": {"$in": [concept_id]}})

    # New method: get linked concepts by querying Link documents.
    async def get_linked_concept_ids(
        self, engine: AIOEngine, concept_id: str
    ) -> list[Concept]:
        links = await self.get_links(engine, concept_id=concept_id)
        linked_ids = set()
        for link in links:
            # Collect all linked concept_ids except the current one.
            for cid in link.concept_ids:
                if cid != concept_id:
                    linked_ids.add(cid)
        return linked_ids

    async def get(
        self, engine: AIOEngine, id: str, populate_connections: bool = True
    ) -> Concept:
        instance = await super().get(engine, id)
        if instance and populate_connections:
            linked = await self.get_linked_concept_ids(engine, concept_id=id)
            # Dynamically attach the linked concepts as a new attribute.
            instance.linked_concept_ids = linked
        return instance

    async def get_multi(
        self, engine: AIOEngine, *queries, populate_connections: bool = True
    ) -> list[Concept]:
        instances = await super().get_multi(engine, *queries)
        if populate_connections:
            for inst in instances:
                linked = await self.get_linked_concept_ids(engine, concept_id=inst.id)
                inst.linked_concept_ids = linked
        return instances


concept = CRUDConcept(Concept)
