import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Page(SQLModel, table=True):
    __tablename__ = "pages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True)
    source_file_id: uuid.UUID = Field(foreign_key="source_files.id", index=True)
    page_number: int
    storage_key: str
    width: int | None = None
    height: int | None = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
