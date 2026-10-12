import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    name: str
    source_lang: str
    target_lang: str
    content_type: str  # manga, manhwa, manhua, webtoon, comic, autre
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
