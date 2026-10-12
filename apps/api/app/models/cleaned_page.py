import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class CleanedPage(SQLModel, table=True):
    """Résultat du nettoyage (inpainting) d'une page. Une seule ligne
    par page : un nouveau nettoyage écrase le précédent (storage_key
    et created_at mis à jour), mais l'image ORIGINALE de la page
    (Page.storage_key) n'est jamais touchée — c'est toujours elle qui
    sert de point de départ pour un nouveau nettoyage.
    """

    __tablename__ = "cleaned_pages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    page_id: uuid.UUID = Field(foreign_key="pages.id", index=True, unique=True)
    storage_key: str
    method: str = "auto_inpaint"
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
