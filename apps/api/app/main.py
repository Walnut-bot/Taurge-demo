from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.exports.router import router as exports_router
from app.ocr_blocks.router import router as ocr_blocks_router
from app.pages.router import router as pages_router
from app.projects.router import router as projects_router
from app.projects.glossary_router import router as glossary_router
from app.translations.router import router as translations_router
from app.core.config import settings
from app.core.db import init_db

app = FastAPI(title="Taurge API", version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(glossary_router)
app.include_router(pages_router)
app.include_router(translations_router)
app.include_router(exports_router)
app.include_router(ocr_blocks_router)

# CORS ouvert en local uniquement. À restreindre avant toute mise en
# production réelle (liste blanche du domaine du frontend).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    """Point de contrôle simple : confirme que l'API tourne et connaît
    sa configuration. Ne vérifie pas encore la connexion DB — ce sera
    ajouté au Jalon 2 avec le premier vrai accès à PostgreSQL.
    """
    return {
        "status": "ok",
        "service": "taurge-api",
        "environment": settings.environment,
    }
