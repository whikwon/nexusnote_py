from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class Annotation(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    file_id: str
    page_number: int
    comment: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # frontend 정보 관리가 어떻게 되는지 확인해서 정의하기, rect로 반환해주려나?
