import os


class Settings:
    """Configuration centralisée. Lue depuis les variables d'environnement.

    Rien de codé en dur ici — même pour le MVP-0, on ne veut pas devoir
    changer le code pour changer d'environnement (local / prod).
    """

    # SQLite par défaut : un simple fichier, aucun serveur à installer
    # ni à faire tourner. Pour utiliser PostgreSQL plus tard (prod,
    # ou via Docker), il suffit de définir la variable d'environnement
    # DATABASE_URL (ex. "postgresql://taurge:taurge@localhost:5432/taurge").
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./taurge.db")
    environment: str = os.getenv("ENVIRONMENT", "development")

    # Sur Windows, Tesseract n'est pas toujours sur le PATH. On verifie la variable
    # d'environnement, sinon le chemin standard d'installation.
    tesseract_cmd: str | None = os.getenv(
        "TESSERACT_CMD",
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
        else None,
    )

    # ATTENTION : cette valeur par défaut n'est là que pour le
    # développement local. En production, SECRET_KEY doit être définie
    # via une vraie variable d'environnement secrète.
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-change-me")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 jours

    storage_path: str = os.getenv("STORAGE_PATH", "/app/storage_data")
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))


settings = Settings()
