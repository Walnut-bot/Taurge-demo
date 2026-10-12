from datetime import datetime

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    source_lang: str
    target_lang: str
    content_type: str


class SourceFileResponse(BaseModel):
    id: str
    original_filename: str
    file_type: str
    size_bytes: int
    created_at: datetime


class TranslationResponse(BaseModel):
    id: str
    translated_text: str
    provider: str
    edited_by_user: bool


class OCRBlockResponse(BaseModel):
    id: str
    text: str
    bbox_x: int
    bbox_y: int
    bbox_w: int
    bbox_h: int
    confidence: float
    provider: str
    bubble_type: str = "B"
    translation: TranslationResponse | None = None


class PageResponse(BaseModel):
    id: str
    source_file_id: str
    page_number: int
    width: int | None
    height: int | None
    created_at: datetime
    ocr_blocks: list[OCRBlockResponse] = []
    cleaned_at: datetime | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    source_lang: str
    target_lang: str
    content_type: str
    created_at: datetime


class ExportResponse(BaseModel):
    id: str
    format: str
    created_at: datetime


class ProjectDetailResponse(ProjectResponse):
    files: list[SourceFileResponse] = []
    pages: list[PageResponse] = []
    exports: list[ExportResponse] = []
