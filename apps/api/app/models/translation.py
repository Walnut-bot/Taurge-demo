import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Translation(SQLModel, table=True):
    __tablename__ = "translations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ocr_block_id: uuid.UUID = Field(
        foreign_key="ocr_blocks.id", index=True, unique=True
    )
    translated_text: str
    provider: str
    edited_by_user: bool = False
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
