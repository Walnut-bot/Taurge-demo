import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session

from app.auth.dependencies import get_current_user
from app.core.db import get_session
from app.models.ocr_block import OCRBlock
from app.models.page import Page
from app.models.project import Project
from app.models.translation import Translation
from app.models.user import User
from app.projects.schemas import TranslationResponse

router = APIRouter(prefix="/translations", tags=["translations"])


class TranslationUpdate(BaseModel):
    translated_text: str


@router.patch("/{translation_id}", response_model=TranslationResponse)
def update_translation(
    translation_id: uuid.UUID,
    payload: TranslationUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    translation = session.get(Translation, translation_id)
    block = (
        session.get(OCRBlock, translation.ocr_block_id) if translation else None
    )
    page = session.get(Page, block.page_id) if block else None
    project = session.get(Project, page.project_id) if page else None

    if not translation or not project or project.owner_id != current_user.id:
        # Toujours 404, jamais 403 : on ne révèle pas qu'une traduction
        # appartenant à quelqu'un d'autre existe.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Traduction introuvable."
        )

    translation.translated_text = payload.translated_text
    translation.edited_by_user = True
    translation.updated_at = datetime.now(timezone.utc)
    session.add(translation)
    session.commit()
    session.refresh(translation)

    return TranslationResponse(**translation.model_dump(mode="json"))
