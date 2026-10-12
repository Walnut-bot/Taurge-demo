import io
import json
import uuid
import zipfile
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlmodel import Session, select

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont
from app.auth.dependencies import get_current_user
from app.core.config import settings
from app.core.db import get_session
from app.models.cleaned_page import CleanedPage
from app.models.export import Export
from app.models.ocr_block import OCRBlock
from app.models.page import Page
from app.models.project import Project
from app.models.source_file import SourceFile
from app.models.user import User
from app.models.glossary import GlossaryEntry
from app.ocr.dependencies import get_ocr_provider
from app.ocr.languages import get_tesseract_lang
from app.ocr.provider import OCRProvider
from app.projects.cleaning import clean_image
from app.projects.extraction import extract_pages_from_pdf, get_image_dimensions
from app.projects.file_validation import detect_file_type
from app.projects.schemas import (
    ExportResponse,
    OCRBlockResponse,
    PageResponse,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    SourceFileResponse,
    TranslationResponse,
)
from app.storage.dependencies import get_storage_provider
from app.storage.provider import StorageProvider
from app.translation.dependencies import get_translation_provider
from app.translation.provider import TranslationProvider
from app.models.translation import Translation

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_owned_project(
    project_id: uuid.UUID, current_user: User, session: Session
) -> Project:
    project = session.get(Project, project_id)
    if not project or project.owner_id != current_user.id:
        # Volontairement 404 (et non 403) : on ne révèle même pas
        # l'existence d'un projet qui n'appartient pas à l'utilisateur.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Projet introuvable."
        )
    return project


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    project = Project(owner_id=current_user.id, **payload.model_dump())
    session.add(project)
    session.commit()
    session.refresh(project)
    return ProjectResponse(**project.model_dump(mode="json"))


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    projects = session.exec(
        select(Project).where(Project.owner_id == current_user.id)
    ).all()
    return [ProjectResponse(**p.model_dump(mode="json")) for p in projects]


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    project = _get_owned_project(project_id, current_user, session)
    files = session.exec(
        select(SourceFile).where(SourceFile.project_id == project.id)
    ).all()
    pages = session.exec(
        select(Page)
        .where(Page.project_id == project.id)
        .order_by(Page.source_file_id, Page.page_number)
    ).all()

    page_responses = []
    for page in pages:
        blocks = session.exec(
            select(OCRBlock).where(OCRBlock.page_id == page.id)
        ).all()
        block_responses = []
        for b in blocks:
            translation = session.exec(
                select(Translation).where(Translation.ocr_block_id == b.id)
            ).first()
            block_responses.append(
                OCRBlockResponse(
                    **b.model_dump(mode="json"),
                    translation=(
                        TranslationResponse(**translation.model_dump(mode="json"))
                        if translation
                        else None
                    ),
                )
            )
        cleaned = session.exec(
            select(CleanedPage).where(CleanedPage.page_id == page.id)
        ).first()

        page_responses.append(
            PageResponse(
                **page.model_dump(mode="json"),
                ocr_blocks=block_responses,
                cleaned_at=cleaned.created_at if cleaned else None,
            )
        )

    exports = session.exec(
        select(Export)
        .where(Export.project_id == project.id)
        .order_by(Export.created_at.desc())
    ).all()

    return ProjectDetailResponse(
        **project.model_dump(mode="json"),
        files=[SourceFileResponse(**f.model_dump(mode="json")) for f in files],
        pages=page_responses,
        exports=[ExportResponse(**e.model_dump(mode="json")) for e in exports],
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    project = _get_owned_project(project_id, current_user, session)
    session.delete(project)
    session.commit()
    return None


@router.post(
    "/{project_id}/upload",
    response_model=SourceFileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    project_id: uuid.UUID,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    storage: StorageProvider = Depends(get_storage_provider),
):
    project = _get_owned_project(project_id, current_user, session)

    content = await file.read()

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Fichier trop volumineux (max {settings.max_upload_size_mb} Mo).",
        )

    file_type = detect_file_type(content)
    if not file_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non reconnu ou non supporté "
            "(PDF, PNG, JPG, WEBP uniquement au MVP-0).",
        )

    source_file = SourceFile(
        project_id=project.id,
        storage_key="",  # complété juste après avoir l'id
        original_filename=file.filename or "sans_nom",
        file_type=file_type,
        size_bytes=len(content),
    )
    storage_key = f"originals/{project.id}/{source_file.id}.{file_type}"
    source_file.storage_key = storage_key

    storage.save(storage_key, content)

    session.add(source_file)
    session.commit()
    session.refresh(source_file)

    return SourceFileResponse(**source_file.model_dump(mode="json"))


def _get_owned_file(
    project_id: uuid.UUID,
    file_id: uuid.UUID,
    current_user: User,
    session: Session,
) -> SourceFile:
    _get_owned_project(project_id, current_user, session)  # vérifie l'accès
    source_file = session.get(SourceFile, file_id)
    if not source_file or source_file.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Fichier introuvable."
        )
    return source_file


@router.post(
    "/{project_id}/files/{file_id}/extract",
    response_model=list[PageResponse],
    status_code=status.HTTP_201_CREATED,
)
def extract_pages(
    project_id: uuid.UUID,
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    storage: StorageProvider = Depends(get_storage_provider),
):
    source_file = _get_owned_file(project_id, file_id, current_user, session)

    already_extracted = session.exec(
        select(Page).where(Page.source_file_id == source_file.id)
    ).first()
    if already_extracted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce fichier a déjà été extrait en pages.",
        )

    content = storage.read(source_file.storage_key)
    created_pages: list[Page] = []

    if source_file.file_type == "pdf":
        for index, (png_bytes, width, height) in enumerate(
            extract_pages_from_pdf(content), start=1
        ):
            page = Page(
                project_id=project_id,
                source_file_id=source_file.id,
                page_number=index,
                storage_key="",
                width=width,
                height=height,
            )
            storage_key = f"pages/{project_id}/{page.id}.png"
            page.storage_key = storage_key
            storage.save(storage_key, png_bytes)
            session.add(page)
            created_pages.append(page)
    else:
        # Image déjà uploadée : une seule "page", on réutilise le
        # fichier original tel quel plutôt que de le dupliquer.
        width, height = get_image_dimensions(content)
        page = Page(
            project_id=project_id,
            source_file_id=source_file.id,
            page_number=1,
            storage_key=source_file.storage_key,
            width=width,
            height=height,
        )
        session.add(page)
        created_pages.append(page)

    session.commit()
    for page in created_pages:
        session.refresh(page)

    return [PageResponse(**p.model_dump(mode="json")) for p in created_pages]


def _get_owned_page(
    project_id: uuid.UUID,
    page_id: uuid.UUID,
    current_user: User,
    session: Session,
) -> Page:
    _get_owned_project(project_id, current_user, session)  # vérifie l'accès
    page = session.get(Page, page_id)
    if not page or page.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Page introuvable."
        )
    return page


@router.post(
    "/{project_id}/pages/{page_id}/ocr",
    response_model=list[OCRBlockResponse],
    status_code=status.HTTP_201_CREATED,
)
def run_ocr(
    project_id: uuid.UUID,
    page_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    storage: StorageProvider = Depends(get_storage_provider),
    ocr: OCRProvider = Depends(get_ocr_provider),
):
    project = _get_owned_project(project_id, current_user, session)
    page = _get_owned_page(project_id, page_id, current_user, session)

    already_done = session.exec(
        select(OCRBlock).where(OCRBlock.page_id == page.id)
    ).first()
    if already_done:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'OCR a déjà été lancé sur cette page.",
        )

    image_bytes = storage.read(page.storage_key)
    tesseract_lang = get_tesseract_lang(project.source_lang)

    try:
        detected = ocr.detect_text(image_bytes, tesseract_lang)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Échec de l'OCR : {exc}",
        )

    created_blocks = []
    for block_data in detected:
        block = OCRBlock(
            page_id=page.id,
            text=block_data.text,
            bbox_x=block_data.bbox_x,
            bbox_y=block_data.bbox_y,
            bbox_w=block_data.bbox_w,
            bbox_h=block_data.bbox_h,
            confidence=block_data.confidence,
            provider="tesseract",
        )
        session.add(block)
        created_blocks.append(block)

    session.commit()
    for block in created_blocks:
        session.refresh(block)

    return [OCRBlockResponse(**b.model_dump(mode="json")) for b in created_blocks]


@router.post(
    "/{project_id}/pages/{page_id}/translate",
    response_model=list[TranslationResponse],
    status_code=status.HTTP_201_CREATED,
)
def translate_page(
    project_id: uuid.UUID,
    page_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    translator: TranslationProvider = Depends(get_translation_provider),
):
    project = _get_owned_project(project_id, current_user, session)
    page = _get_owned_page(project_id, page_id, current_user, session)

    blocks = session.exec(
        select(OCRBlock).where(OCRBlock.page_id == page.id)
    ).all()
    if not blocks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun texte détecté sur cette page — lance d'abord l'OCR.",
        )

    # Ne traduit que les blocs qui n'ont pas encore de traduction :
    # relancer cet endpoint après un ajout de blocs ne retraduit pas
    # tout depuis zéro.
    already_translated_ids = {
        t.ocr_block_id
        for t in session.exec(
            select(Translation).where(
                Translation.ocr_block_id.in_([b.id for b in blocks])
            )
        ).all()
    }
    blocks_to_translate = [b for b in blocks if b.id not in already_translated_ids]

    if not blocks_to_translate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tous les blocs de cette page sont déjà traduits.",
        )

    texts_to_translate = [b.text for b in blocks_to_translate]
    try:
        translated_texts = translator.translate_batch(
            texts_to_translate, project.source_lang, project.target_lang
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Échec de la traduction : {exc}",
        )

    # Récupération de la mémoire de traduction et du glossaire du projet
    glossary_entries = session.exec(
        select(GlossaryEntry).where(GlossaryEntry.project_id == project.id)
    ).all()

    created_translations = []
    for block, translated_text in zip(blocks_to_translate, translated_texts):
        final_text = translated_text

        # Remplacement / verrouillage des termes définis dans le glossaire
        for g in glossary_entries:
            if g.is_locked and g.source_term.lower() in block.text.lower():
                # Remplacement insensible à la casse si le terme source ou une variante est présente
                import re
                pattern = re.compile(re.escape(g.source_term), re.IGNORECASE)
                if pattern.search(block.text):
                    # Si la traduction automatique a mal rendu le nom, on injecte le terme cible verrouillé
                    final_text = re.sub(re.escape(g.source_term), g.target_term, final_text, flags=re.IGNORECASE)

        translation = Translation(
            ocr_block_id=block.id,
            translated_text=final_text,
            provider="argos",
        )
        session.add(translation)
        created_translations.append(translation)

    session.commit()
    for t in created_translations:
        session.refresh(t)

    return [TranslationResponse(**t.model_dump(mode="json")) for t in created_translations]


@router.post(
    "/{project_id}/export",
    response_model=ExportResponse,
    status_code=status.HTTP_201_CREATED,
)
def export_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    storage: StorageProvider = Depends(get_storage_provider),
):
    project = _get_owned_project(project_id, current_user, session)

    pages = session.exec(
        select(Page)
        .where(Page.project_id == project.id)
        .order_by(Page.source_file_id, Page.page_number)
    ).all()
    if not pages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune page à exporter — importe et extrais au moins "
            "un fichier avant d'exporter.",
        )

    # Détection du type de fichier source initial
    source_file = session.exec(
        select(SourceFile).where(SourceFile.project_id == project.id).order_by(SourceFile.created_at)
    ).first()
    is_pdf = source_file and source_file.file_type.lower() == "pdf"

    def _render_page_with_text(page_obj: Page) -> bytes:
        # Prendre l'image nettoyée si elle existe, sinon l'originale
        cleaned_rec = session.exec(
            select(CleanedPage).where(CleanedPage.page_id == page_obj.id)
        ).first()
        raw_bytes = storage.read(cleaned_rec.storage_key if cleaned_rec else page_obj.storage_key)
        
        # Dessiner le texte traduit sur les bulles
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        draw = ImageDraw.Draw(image)

        blocks_on_page = session.exec(
            select(OCRBlock).where(OCRBlock.page_id == page_obj.id)
        ).all()

        for b in blocks_on_page:
            trans = session.exec(
                select(Translation).where(Translation.ocr_block_id == b.id)
            ).first()
            if trans and trans.translated_text:
                text = trans.translated_text.strip()
                # Calcul de taille de police proportionnelle à la bulle
                font_size = max(11, int(b.bbox_h / 4))
                try:
                    font = ImageFont.truetype("arial.ttf", font_size)
                except Exception:
                    font = ImageFont.load_default()

                # Découpage du texte pour respecter la largeur de la bulle
                words = text.split()
                lines = []
                cur = ""
                for w in words:
                    test_line = f"{cur} {w}".strip()
                    bbox = draw.textbbox((0, 0), test_line, font=font)
                    if (bbox[2] - bbox[0]) <= max(40, b.bbox_w - 6):
                        cur = test_line
                    else:
                        if cur:
                            lines.append(cur)
                        cur = w
                if cur:
                    lines.append(cur)

                line_h = font_size + 4
                total_h = len(lines) * line_h
                start_y = max(b.bbox_y, b.bbox_y + (b.bbox_h - total_h) // 2)

                for idx, line in enumerate(lines):
                    l_bbox = draw.textbbox((0, 0), line, font=font)
                    line_w = l_bbox[2] - l_bbox[0]
                    start_x = b.bbox_x + (b.bbox_w - line_w) // 2
                    draw.text((start_x, start_y + idx * line_h), line, fill=(10, 10, 10), font=font)

        out_io = io.BytesIO()
        image.save(out_io, format="PNG")
        return out_io.getvalue()

    if is_pdf:
        # Assemblage direct d'un PDF complet avec texte traduit et bulles nettoyées
        pdf_doc = fitz.open()
        for page in pages:
            page_png = _render_page_with_text(page)
            img_doc = fitz.open(stream=page_png, filetype="png")
            rect = img_doc[0].rect
            pdf_page = pdf_doc.new_page(width=rect.width, height=rect.height)
            pdf_page.insert_image(rect, stream=page_png)
            img_doc.close()

        pdf_bytes = pdf_doc.tobytes()
        pdf_doc.close()

        export = Export(project_id=project.id, format="pdf", storage_key="")
        storage_key = f"exports/{project.id}/{export.id}.pdf"
        export.storage_key = storage_key
        storage.save(storage_key, pdf_bytes)
    else:
        # Export ZIP avec les pages rendues et nettoyées
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for display_number, page in enumerate(pages, start=1):
                page_png = _render_page_with_text(page)
                zf.writestr(f"page_{display_number:03d}.png", page_png)

        export = Export(project_id=project.id, format="zip", storage_key="")
        storage_key = f"exports/{project.id}/{export.id}.zip"
        export.storage_key = storage_key
        storage.save(storage_key, zip_buffer.getvalue())

    session.add(export)
    session.commit()
    session.refresh(export)

    return ExportResponse(**export.model_dump(mode="json"))


@router.post(
    "/{project_id}/pages/{page_id}/clean",
    response_model=PageResponse,
    status_code=status.HTTP_201_CREATED,
)
def clean_page(
    project_id: uuid.UUID,
    page_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    storage: StorageProvider = Depends(get_storage_provider),
):
    """Relancer ce endpoint sur une page déjà nettoyée régénère le
    nettoyage depuis l'image ORIGINALE (jamais depuis une version déjà
    nettoyée) et remplace le résultat précédent — utile après avoir
    corrigé des blocs OCR mal positionnés.
    """
    project = _get_owned_project(project_id, current_user, session)
    page = _get_owned_page(project_id, page_id, current_user, session)

    blocks = session.exec(
        select(OCRBlock).where(OCRBlock.page_id == page.id)
    ).all()
    if not blocks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun texte détecté sur cette page — lance d'abord l'OCR.",
        )

    original_bytes = storage.read(page.storage_key)
    bboxes = [(b.bbox_x, b.bbox_y, b.bbox_w, b.bbox_h) for b in blocks]

    try:
        cleaned_bytes = clean_image(original_bytes, bboxes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Échec du nettoyage : {exc}",
        )

    storage_key = f"cleaned/{project_id}/{page.id}.png"
    storage.save(storage_key, cleaned_bytes)

    cleaned_page = session.exec(
        select(CleanedPage).where(CleanedPage.page_id == page.id)
    ).first()
    if cleaned_page:
        cleaned_page.storage_key = storage_key
        cleaned_page.created_at = datetime.now(timezone.utc)
    else:
        cleaned_page = CleanedPage(page_id=page.id, storage_key=storage_key)
    session.add(cleaned_page)
    session.commit()
    session.refresh(cleaned_page)
    session.refresh(page)

    blocks_response = []
    for b in blocks:
        translation = session.exec(
            select(Translation).where(Translation.ocr_block_id == b.id)
        ).first()
        blocks_response.append(
            OCRBlockResponse(
                **b.model_dump(mode="json"),
                translation=(
                    TranslationResponse(**translation.model_dump(mode="json"))
                    if translation
                    else None
                ),
            )
        )

    return PageResponse(
        **page.model_dump(mode="json"),
        ocr_blocks=blocks_response,
        cleaned_at=cleaned_page.created_at,
    )
