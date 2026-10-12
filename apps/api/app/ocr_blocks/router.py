import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.auth.dependencies import get_current_user
from app.core.db import get_session
from app.models.ocr_block import OCRBlock
from app.models.page import Page
from app.models.project import Project
from app.models.translation import Translation
from app.models.user import User
from app.projects.schemas import OCRBlockResponse, TranslationResponse
from app.translation.dependencies import get_translation_provider
from app.translation.provider import TranslationProvider

router = APIRouter(prefix="/ocr-blocks", tags=["ocr-blocks"])


from typing import Optional


class OCRBlockUpdate(BaseModel):
    text: Optional[str] = None
    bbox_x: Optional[int] = None
    bbox_y: Optional[int] = None
    bbox_w: Optional[int] = None
    bbox_h: Optional[int] = None
    bubble_type: Optional[str] = None


def _get_owned_block(
    block_id: uuid.UUID, current_user: User, session: Session
) -> tuple[OCRBlock, Project]:
    block = session.get(OCRBlock, block_id)
    page = session.get(Page, block.page_id) if block else None
    project = session.get(Project, page.project_id) if page else None
    if not block or not page or not project or project.owner_id != current_user.id:
        # Toujours 404, jamais 403 : on ne révèle pas qu'un bloc
        # appartenant à quelqu'un d'autre existe.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bloc introuvable."
        )
    return block, project


@router.patch("/{block_id}", response_model=OCRBlockResponse)
def update_ocr_block(
    block_id: uuid.UUID,
    payload: OCRBlockUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Corrige le texte détecté par l'OCR. Ne retraduit pas tout seul —
    la traduction existante (si il y en a une) reste affichée telle
    quelle jusqu'à ce que l'utilisateur clique "Retraduire", pour ne
    jamais écraser silencieusement une traduction déjà corrigée à la
    main.
    """
    block, _ = _get_owned_block(block_id, current_user, session)
    if payload.text is not None:
        block.text = payload.text
    if payload.bbox_x is not None:
        block.bbox_x = payload.bbox_x
    if payload.bbox_y is not None:
        block.bbox_y = payload.bbox_y
    if payload.bbox_w is not None:
        block.bbox_w = payload.bbox_w
    if payload.bbox_h is not None:
        block.bbox_h = payload.bbox_h
    if payload.bubble_type is not None:
        block.bubble_type = payload.bubble_type
    session.add(block)
    session.commit()
    session.refresh(block)

    translation = session.exec(
        select(Translation).where(Translation.ocr_block_id == block.id)
    ).first()

    return OCRBlockResponse(
        **block.model_dump(mode="json"),
        translation=(
            TranslationResponse(**translation.model_dump(mode="json"))
            if translation
            else None
        ),
    )


@router.post("/{block_id}/retranslate", response_model=TranslationResponse)
def retranslate_block(
    block_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    translator: TranslationProvider = Depends(get_translation_provider),
):
    """Retraduit un seul bloc à partir de son texte actuel — à utiliser
    après avoir corrigé le texte OCR, pour obtenir une traduction basée
    sur le bon texte source. Écrase la traduction existante, y compris
    si elle avait été corrigée manuellement : à utiliser en connaissance
    de cause.
    """
    block, project = _get_owned_block(block_id, current_user, session)

    try:
        translated_text = translator.translate(
            block.text, project.source_lang, project.target_lang
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Échec de la traduction : {exc}",
        )

    translation = session.exec(
        select(Translation).where(Translation.ocr_block_id == block.id)
    ).first()

    if translation:
        translation.translated_text = translated_text
        translation.edited_by_user = False
        translation.updated_at = datetime.now(timezone.utc)
    else:
        translation = Translation(
            ocr_block_id=block.id,
            translated_text=translated_text,
            provider="argos",
        )

    session.add(translation)
    session.commit()
    session.refresh(translation)

    return TranslationResponse(**translation.model_dump(mode="json"))


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ocr_block(
    block_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    block, _ = _get_owned_block(block_id, current_user, session)
    session.delete(block)
    session.commit()
    return None
