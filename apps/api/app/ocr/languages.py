"""Tesseract utilise ses propres codes de langue (ISO 639-2, pas 639-1).
Cette table fait le lien avec les codes utilisés ailleurs dans l'app.

Les packs de langue correspondants doivent être installés dans l'image
Docker (voir Dockerfile) pour que la détection fonctionne réellement —
sinon Tesseract erreur au lieu de simplement mal détecter.
"""

LANG_CODE_MAP: dict[str, str] = {
    "ja": "jpn",
    "ko": "kor",
    "zh": "chi_sim",
    "en": "eng",
    "es": "spa",
    "pt": "por",
    "fr": "fra",
    "de": "deu",
}

DEFAULT_LANG = "eng"


def get_tesseract_lang(source_lang: str) -> str:
    return LANG_CODE_MAP.get(source_lang, DEFAULT_LANG)
