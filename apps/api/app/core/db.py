from sqlmodel import SQLModel, Session, create_engine

from app.core.config import settings

# SQLite refuse par défaut qu'une connexion soit utilisée depuis un
# thread différent de celui qui l'a créée — or FastAPI exécute les
# routes synchrones dans un pool de threads. check_same_thread=False
# est sûr ici car SQLAlchemy gère lui-même l'accès concurrent via son
# pool de connexions.
connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def init_db() -> None:
    """Crée les tables si elles n'existent pas encore."""
    SQLModel.metadata.create_all(engine)
    if settings.database_url.startswith("sqlite"):
        from sqlalchemy import text
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE ocr_blocks ADD COLUMN bubble_type VARCHAR DEFAULT 'B'"))
                conn.commit()
            except Exception:
                pass


def get_session():
    with Session(engine) as session:
        yield session
