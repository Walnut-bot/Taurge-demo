import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class SourceFile(SQLModel, table=True):
    __tablename__ = "source_files"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True)
    storage_key: str
    original_filename: str
    file_type: str  # pdf, png, jpg, jpeg, webp
    size_bytes: int
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
