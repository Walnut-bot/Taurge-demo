import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class OCRBlock(SQLModel, table=True):
    __tablename__ = "ocr_blocks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    page_id: uuid.UUID = Field(foreign_key="pages.id", index=True)
    text: str
    bbox_x: int
    bbox_y: int
    bbox_w: int
    bbox_h: int
    confidence: float
    provider: str
    bubble_type: str = Field(default="B")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
