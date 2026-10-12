import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class GlossaryEntry(SQLModel, table=True):
    __tablename__ = "glossary_entries"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    project_id: uuid.UUID = Field(foreign_key="projects.id", index=True)
    category: str = Field(default="character")  # character, location, term, sfx
    source_term: str = Field(index=True)
    target_term: str
    is_locked: bool = Field(default=True)
    notes: Optional[str] = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
