from dataclasses import dataclass
from typing import Protocol


@dataclass
class OCRBlockData:
    text: str
    bbox_x: int
    bbox_y: int
    bbox_w: int
    bbox_h: int
    confidence: float


class OCRProvider(Protocol):
    """Interface OCR. Un seul provider concret (Tesseract) au MVP-0.

    Passer à un autre moteur (Google Vision, PaddleOCR...) plus tard ne
    demandera qu'un nouveau provider respectant cette interface — rien
    d'autre dans l'app n'a besoin de changer.
    """

    def detect_text(self, image_bytes: bytes, lang: str) -> list[OCRBlockData]:
        """Détecte le texte dans une image. `lang` est le code de langue
        propre au provider (voir LANG_CODE_MAP)."""
        ...
