"""Extraction des pages : convertit un PDF en une image par page, ou
récupère les dimensions d'une image déjà uploadée telle quelle.

PyMuPDF (fitz) rend chaque page en PNG sans dépendance système externe
(pas besoin de Poppler installé sur la machine), ce qui simplifie
beaucoup le déploiement pour un solo dev.
"""

import io

import fitz  # PyMuPDF
from PIL import Image

# ~150 DPI : suffisant pour l'OCR et la lecture à l'écran, sans exploser
# la taille de stockage. Configurable plus tard si besoin de qualité
# supérieure pour l'export final.
RENDER_DPI = 150


def extract_pages_from_pdf(content: bytes) -> list[tuple[bytes, int, int]]:
    """Retourne une liste de (image_png_bytes, width, height), une par
    page du PDF, dans l'ordre.
    """
    zoom = RENDER_DPI / 72
    matrix = fitz.Matrix(zoom, zoom)

    doc = fitz.open(stream=content, filetype="pdf")
    try:
        pages = []
        for page in doc:
            pix = page.get_pixmap(matrix=matrix)
            pages.append((pix.tobytes("png"), pix.width, pix.height))
        return pages
    finally:
        doc.close()


def get_image_dimensions(content: bytes) -> tuple[int, int]:
    """Lit la largeur/hauteur d'une image déjà uploadée (PNG/JPG/WEBP)."""
    with Image.open(io.BytesIO(content)) as img:
        return img.size
