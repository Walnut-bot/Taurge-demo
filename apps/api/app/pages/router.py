import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlmodel import Session, select

from app.auth.dependencies import get_current_user
from app.core.db import get_session
from app.models.cleaned_page import CleanedPage
from app.models.page import Page
from app.models.project import Project
from app.models.user import User
from app.storage.dependencies import get_storage_provider
from app.storage.provider import StorageProvider

router = APIRouter(prefix="/pages", tags=["pages"])

MEDIA_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
}


def _guess_media_type(storage_key: str) -> str:
    ext = storage_key.rsplit(".", 1)[-1].lower()
    return MEDIA_TYPES.get(ext, "application/octet-stream")


@router.get("/{page_id}/image")
def get_page_image(
    page_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    storage: StorageProvider = Depends(get_storage_provider),
):
    page = session.get(Page, page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Page introuvable."
        )
    project = session.get(Project, page.project_id)
    if not project or project.owner_id != current_user.id:
        # Toujours 404, jamais 403 : on ne révèle pas qu'une page
        # appartenant à quelqu'un d'autre existe.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Page introuvable."
        )
    content = storage.read(page.storage_key)
    return Response(content=content, media_type=_guess_media_type(page.storage_key))


@router.get("/{page_id}/cleaned-image")
def get_cleaned_page_image(
    page_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    storage: StorageProvider = Depends(get_storage_provider),
):
    page = session.get(Page, page_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Page introuvable."
        )
    project = session.get(Project, page.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Page introuvable."
        )

    cleaned = session.exec(
        select(CleanedPage).where(CleanedPage.page_id == page.id)
    ).first()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cette page n'a pas encore été nettoyée.",
        )

    content = storage.read(cleaned.storage_key)
    return Response(content=content, media_type="image/png")
