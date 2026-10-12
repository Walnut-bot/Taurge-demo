import os
from pathlib import Path


class LocalStorageProvider:
    """Stocke les fichiers sur le disque local du conteneur/serveur.

    Suffisant pour le développement et le MVP-0 avec un seul serveur.
    Ne PAS utiliser tel quel si l'application tourne un jour sur
    plusieurs instances serveur simultanées (les fichiers ne seraient
    visibles que par l'instance qui les a reçus) — c'est justement pour
    ce cas-là qu'on gardera l'interface StorageProvider et qu'on
    écrira un S3Provider plus tard.
    """

    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _full_path(self, key: str) -> Path:
        # Empêche toute tentative de sortir du dossier de stockage
        # (path traversal) via un nom de fichier malveillant du type
        # "../../etc/passwd".
        full = (self.base_path / key).resolve()
        if not str(full).startswith(str(self.base_path.resolve())):
            raise ValueError("Clé de stockage invalide.")
        return full

    def save(self, key: str, content: bytes) -> None:
        path = self._full_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            f.write(content)

    def read(self, key: str) -> bytes:
        with open(self._full_path(key), "rb") as f:
            return f.read()

    def delete(self, key: str) -> None:
        path = self._full_path(key)
        if path.exists():
            os.remove(path)
