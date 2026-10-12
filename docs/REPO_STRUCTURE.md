# TAURGE — Arborescence du repo (MVP-0)

```
taurge/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── dashboard/
│   │   │   └── projects/
│   │   │       └── [id]/
│   │   │           ├── page.tsx       # liste des pages du projet
│   │   │           └── editor/        # édition texte OCR/traduction
│   │   ├── components/
│   │   ├── lib/                # client API, hooks
│   │   └── package.json
│   │
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── main.py
│       │   ├── auth/
│       │   ├── projects/
│       │   ├── pages/
│       │   ├── ocr/
│       │   │   ├── provider.py         # interface OCRProvider
│       │   │   └── providers/
│       │   │       └── <provider_choisi>.py
│       │   ├── translation/
│       │   │   ├── provider.py         # interface TranslationProvider
│       │   │   └── providers/
│       │   │       └── <provider_choisi>.py
│       │   ├── jobs/
│       │   ├── storage/                # abstraction stockage objet
│       │   ├── models/                 # SQLModel
│       │   └── core/                   # config, sécurité, dépendances
│       ├── tests/
│       ├── alembic/                    # migrations DB
│       └── pyproject.toml
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── MVP_SCOPE.md
│   ├── DATABASE.md
│   ├── ROADMAP.md
│   └── REPO_STRUCTURE.md
│
├── docker-compose.yml           # postgres + api + web en local
├── .github/workflows/ci.yml     # lint + tests
└── README.md
```

Pas de monorepo tooling complexe (Turborepo, Nx...) au round 1 — deux
dossiers `apps/web` et `apps/api` suffisent tant qu'il n'y a pas de code
partagé entre les deux à factoriser.
