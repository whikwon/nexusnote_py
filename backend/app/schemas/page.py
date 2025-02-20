
from pydantic import BaseModel

from app.models.block import Block


class Page(BaseModel):
    file_id: str
    page_number: int
    blocks: list[Block]
