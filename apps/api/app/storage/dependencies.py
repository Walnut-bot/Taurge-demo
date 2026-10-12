from app.core.config import settings
from app.storage.providers.local import LocalStorageProvider

# Un seul point de câblage : si on change de provider un jour, c'est la
# seule ligne à modifier.
storage_provider = LocalStorageProvider(base_path=settings.storage_path)


def get_storage_provider() -> LocalStorageProvider:
    return storage_provider
