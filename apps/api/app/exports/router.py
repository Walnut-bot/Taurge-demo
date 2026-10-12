import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlmodel import Session

from app.auth.dependencies import get_current_user
from app.core.db import get_session
from app.models.export import Export
from app.models.project import Project
from app.models.user import User
from app.storage.dependencies import get_storage_provider
from app.storage.provider import StorageProvider

router = APIRouter(prefix="/exports", tags=["exports"])


def _safe_filename(name: str) -> str:
    # Évite tout caractère qui poserait problème dans un en-tête HTTP
    # ou un nom de fichier (espaces compris, remplacés par "_").
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", name).strip("_")
    return cleaned or "export"


@router.get("/{export_id}/download")
def download_export(
    export_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    storage: StorageProvider = Depends(get_storage_provider),
):
    export = session.get(Export, export_id)
    if not export:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Export introuvable."
        )
    project = session.get(Project, export.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Export introuvable."
        )

    content = storage.read(export.storage_key)
    filename = f"{_safe_filename(project.name)}_export.{export.format}"

    media_types = {
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "zip": "application/zip",
    }
    media_type = media_types.get(export.format.lower(), "application/octet-stream")

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
