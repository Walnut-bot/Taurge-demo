# Taurge - Master Architecture Document

## 1. Vision & Principes Directeurs
Taurge est un **workspace SaaS professionnel de localisation assistée par IA pour le contenu illustré** (Manga, Manhwa, Manhua, Webtoon, Comics).

Principes fondamentaux :
1. **L'humain a le contrôle absolu** : L'IA propose, l'humain valide ou corrige.
2. **Non-destructivité des sources** : Les originaux et les calques de modifications restent isolés et préservés.
3. **Architecture découplée & provider-agnostique** : Possibilité d'interchanger OCR (Tesseract -> PaddleOCR / Google Vision), Traduction (Google Translate / Argos / DeepL / LLM) et Inpainting/Cleaning.
4. **Traitement asynchrone pour les opérations lourdes** : Découpage des chapitres/volumes en pages et jobs d'arrière-plan.
5. **Portabilité et conformité** : L'utilisateur apporte ses fichiers autorisés ; exports complets sans dépendance propriétaire.

---

## 2. Architecture Globale du Système

```
+-------------------------------------------------------------------+
|                        FRONTEND (Next.js)                         |
|   - Workspace interactif (Canvas, sélection de blocs, zoom/pan)   |
|   - Dashboard de projets, Wizard d'import & pipelines             |
|   - Authentification, rôles & billing                             |
+---------------------------------+---------------------------------+
                                  | REST / WebSockets
                                  v
+-------------------------------------------------------------------+
|                       BACKEND (FastAPI API)                       |
|   - Auth & RBAC (JWT, bcrypt, rôles par workspace/projet)         |
|   - Project & Page Management (métadonnées, hiérarchie)           |
|   - Storage Service (Abstraction locale / S3 / Cloudflare R2)     |
|   - Pipeline Dispatcher (Extraction PDF, OCR, Traduction, Clean)  |
|   - Export Engine (Reconstruction ZIP, CBZ, PDF)                  |
|   - Billing & Webhooks (FedaPay, Flutterwave, Stripe)              |
+-------------------+-------------------------------+---------------+
                    |                               |
                    v                               v
        +-----------------------+       +-----------------------+
        |  PostgreSQL / SQLite  |       |  Object Storage /     |
        |  (SQLModel/SQLAlchemy)|       |  Storage Data Local   |
        +-----------------------+       +-----------------------+
```

---

## 3. Découpage Modulaire des Services Backend

1. **Auth Service** : Enregistrement, login JWT, RBAC multi-niveaux.
2. **Project & File Service** : Ingestion sécurisée de fichiers volumineux (chunking, streaming), extraction des pages (PyMuPDF).
3. **OCR Engine** : Interface `OCRProvider` (Tesseract / PaddleOCR / Vision API) avec coordonnées normalisées et boîte englobante (`bbox_x, bbox_y, bbox_w, bbox_h`).
4. **Translation Service** : Interface `TranslationProvider` (Google Translate, Argos, LLM contextuel avec glossaire et mémoire de traduction).
5. **Inpainting / Cleaning Service** : Masquage automatique selon boîtes de texte et inpainting OpenCV Telea/Navier-Stokes ou modèle de diffusion.
6. **Export Service** : Génération des archives ZIP, PDF et formats finaux.
7. **Billing & Metering** : Suivi des crédits consommés (pages OCR, caractères traduits, inpainting) et webhooks de paiement.

---

## 4. Stratégie de Stockage

Arborescence logique du stockage objet :
```
storage/
├── originals/          # Fichiers bruts déposés par l'utilisateur
├── pages/              # Pages extraites haute définition
│   ├── original/
│   ├── thumbnails/
│   └── cleaned/        # Images avec texte effacé (inpainting)
├── exports/            # Archives et documents finaux générés
└── temp/               # Traitements temporaires éphémères
```

Les accès aux fichiers se font via des URLs signées ou des streams authentifiés.

---

## 5. File d'attente et Résilience des Jobs

- Chaque tâche lourde (OCR d'un volume entier, inpainting d'un chapitre) génère un enregistrement `Job` avec statut (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`).
- Progression traçable par page : si la page 45 échoue, le système peut relancer individuellement cette page sans recalculer les pages 1 à 44.
