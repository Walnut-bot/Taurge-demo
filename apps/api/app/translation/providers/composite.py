"""Combine les deux providers : Google Translate en premier choix
(meilleure qualité sur la plupart des paires de langues), avec un
repli automatique sur Argos Translate (local, sans limite de débit)
si Google échoue — texte par texte, pas pour la page entière.

Ça veut dire que sur une page de 5 bulles, si Google traduit bien les
3 premières puis se fait limiter, les 2 dernières utilisent Argos au
lieu de faire échouer toute la traduction de la page.
"""

from app.translation.providers.argos import ArgosTranslateProvider
from app.translation.providers.google_free import GoogleFreeTranslationProvider


class CompositeTranslationProvider:
    def __init__(self) -> None:
        self._primary = GoogleFreeTranslationProvider()
        self._fallback = ArgosTranslateProvider()

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text.strip():
            return ""
        try:
            return self._primary.translate(text, source_lang, target_lang)
        except Exception:
            return self._fallback.translate(text, source_lang, target_lang)

    def translate_batch(
        self, texts: list[str], source_lang: str, target_lang: str
    ) -> list[str]:
        return [self.translate(t, source_lang, target_lang) for t in texts]
