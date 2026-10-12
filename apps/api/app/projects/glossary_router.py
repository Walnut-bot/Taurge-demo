import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.auth.dependencies import get_current_user
from app.core.db import get_session
from app.models.glossary import GlossaryEntry
from app.models.project import Project
from app.models.user import User

router = APIRouter(prefix="/projects/{project_id}/glossary", tags=["glossary"])


class GlossaryEntryCreate(BaseModel):
    category: str = "character"  # character, location, term, sfx
    source_term: str
    target_term: str
    is_locked: bool = True
    notes: Optional[str] = None


class GlossaryEntryResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    category: str
    source_term: str
    target_term: str
    is_locked: bool
    notes: Optional[str]


def _get_project(project_id: uuid.UUID, user: User, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Projet introuvable."
        )
    return project


@router.get("", response_model=list[GlossaryEntryResponse])
def list_glossary_entries(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _get_project(project_id, current_user, session)
    entries = session.exec(
        select(GlossaryEntry).where(GlossaryEntry.project_id == project_id)
    ).all()
    return [GlossaryEntryResponse(**e.model_dump(mode="json")) for e in entries]


@router.post("", response_model=GlossaryEntryResponse, status_code=status.HTTP_201_CREATED)
def create_glossary_entry(
    project_id: uuid.UUID,
    payload: GlossaryEntryCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _get_project(project_id, current_user, session)
    entry = GlossaryEntry(
        project_id=project_id,
        category=payload.category,
        source_term=payload.source_term.strip(),
        target_term=payload.target_term.strip(),
        is_locked=payload.is_locked,
        notes=payload.notes,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return GlossaryEntryResponse(**entry.model_dump(mode="json"))


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_glossary_entry(
    project_id: uuid.UUID,
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    _get_project(project_id, current_user, session)
    entry = session.get(GlossaryEntry, entry_id)
    if not entry or entry.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entrée introuvable."
        )
    session.delete(entry)
    session.commit()
    return None
