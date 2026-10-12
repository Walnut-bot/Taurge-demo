# Taurge - Spécifications de la Base de Données

## 1. Schéma Relationnel

Le système utilise SQLModel (compatible SQLAlchemy Core & PostgreSQL/SQLite) avec clés primaires UUID.

### Modèles Principaux

```sql
-- Utilisateurs & Authentification
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    role VARCHAR DEFAULT 'USER', -- 'USER', 'ADMIN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Espaces de travail
CREATE TABLE workspaces (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projets de localisation
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL, -- manga, manhwa, manhua, webtoon, comic
    source_lang VARCHAR NOT NULL,
    target_lang VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fichiers sources importés (PDF, ZIP, CBZ, Images)
CREATE TABLE source_files (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    original_filename VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path VARCHAR NOT NULL,
    page_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pages individuelles
CREATE TABLE pages (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source_file_id UUID REFERENCES source_files(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    width INT,
    height INT,
    original_path VARCHAR NOT NULL,
    cleaned_path VARCHAR,
    cleaned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocs détectés par OCR
CREATE TABLE ocr_blocks (
    id UUID PRIMARY KEY,
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    bbox_x FLOAT NOT NULL,
    bbox_y FLOAT NOT NULL,
    bbox_w FLOAT NOT NULL,
    bbox_h FLOAT NOT NULL,
    confidence FLOAT NOT NULL,
    orientation VARCHAR DEFAULT 'horizontal', -- 'horizontal', 'vertical'
    provider VARCHAR DEFAULT 'tesseract',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traductions associées aux blocs OCR
CREATE TABLE translations (
    id UUID PRIMARY KEY,
    ocr_block_id UUID UNIQUE REFERENCES ocr_blocks(id) ON DELETE CASCADE,
    translated_text TEXT NOT NULL,
    provider VARCHAR DEFAULT 'google',
    edited_by_user BOOLEAN DEFAULT FALSE,
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mémoire de traduction & Glossaire
CREATE TABLE glossary_entries (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR NOT NULL, -- character, location, term, sfx
    source_term VARCHAR NOT NULL,
    target_term VARCHAR NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suivi des traitements (Jobs asynchrones)
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    job_type VARCHAR NOT NULL, -- PDF_EXTRACTION, OCR, TRANSLATION, CLEANING, EXPORT
    status VARCHAR NOT NULL, -- QUEUED, RUNNING, COMPLETED, FAILED
    progress INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Suivi de consommation et facturation
CREATE TABLE usage_events (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    metric VARCHAR NOT NULL, -- ocr_pages, translated_chars, inpaint_images
    quantity INT NOT NULL,
    cost_units FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
