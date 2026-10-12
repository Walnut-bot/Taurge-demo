import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Export(SQLModel, table=True):
    __tablename__ = "exports"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True)
    format: str  # zip au MVP-0 ; pdf prévu plus tard
    storage_key: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
