from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from odmantic import AIOEngine

from app import schemas
from app.api import deps
from app.crud import concept as crud_concept

router = APIRouter(prefix="/concept", tags=["concept"])


@router.post("/create", response_model=schemas.ConceptBase)
async def create_concept(
    *,
    engine: AIOEngine = Depends(deps.engine_generator),
    concept_in: schemas.ConceptCreate,
) -> Any:
    # Check for duplicate concept name
    duplicate = await crud_concept.get_by_name(engine, concept_in.name)
    if duplicate:
        raise HTTPException(
            status_code=400, detail="Concept with this name already exists"
        )

    concept = await crud_concept.concept.create(engine, obj_in=concept_in)
    return concept


@router.post("/delete", response_model=schemas.Msg)
async def delete_concept(
    *,
    engine: AIOEngine = Depends(deps.engine_generator),
    id: str = Body(..., embed=True),
) -> Any:
    await crud_concept.delete(engine, id=id)
    return {"msg": "Concept deleted successfully."}


@router.post("/update", response_model=schemas.ConceptBase)
async def update_concept(
    *,
    engine: AIOEngine = Depends(deps.engine_generator),
    concept_in: schemas.ConceptUpdate,
) -> Any:
    # Check for duplicate concept name
    duplicate = await crud_concept.get_by_name(engine, concept_in.name)
    if duplicate and duplicate.id != concept_in.id:
        raise HTTPException(
            status_code=400, detail="Another concept with this name already exists."
        )
    db_obj = await crud_concept.get(engine, concept_in.id)
    concept = await crud_concept.update(engine, db_obj=db_obj, obj_in=concept_in)
    return concept


@router.get("/all", response_model=list[schemas.ConceptBase])
async def get_all_concepts(
    *, engine: AIOEngine = Depends(deps.engine_generator)
) -> Any:
    # Get all concepts from the database by calling a new crud function.
    concepts = await crud_concept.get_multi(engine)
    return concepts
