from typing import Protocol


class StorageProvider(Protocol):
    """Interface de stockage. Un seul provider concret l'implémente au
    MVP-0 (stockage local sur disque). Le jour où on passe à un
    stockage S3-compatible (Cloudflare R2, Supabase Storage...), on
    écrit un nouveau provider qui respecte cette même interface — rien
    d'autre dans l'app ne change.
    """

    def save(self, key: str, content: bytes) -> None:
        """Enregistre le contenu sous la clé donnée."""
        ...

    def read(self, key: str) -> bytes:
        """Relit le contenu stocké sous cette clé."""
        ...

    def delete(self, key: str) -> None:
        """Supprime le contenu stocké sous cette clé."""
        ...
