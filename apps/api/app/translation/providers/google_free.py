"""Provider Google Translate gratuit (sans clé API, via deep-translator).

Meilleure qualité qu'Argos Translate sur beaucoup de paires de langues,
mais peut être temporairement limité par Google sans prévenir ("too
many requests"). Pas de retry/délai ici : c'est le rôle du
CompositeTranslationProvider (voir composite.py) de basculer sur Argos
Translate en cas d'échec, texte par texte — plus simple et plus rapide
qu'attendre avec des tentatives répétées.
"""

from deep_translator import GoogleTranslator

from app.translation.languages import get_provider_lang


class GoogleFreeTranslationProvider:
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text.strip():
            return ""
        translator = GoogleTranslator(
            source=get_provider_lang(source_lang),
            target=get_provider_lang(target_lang),
        )
        return translator.translate(text)

    def translate_batch(
        self, texts: list[str], source_lang: str, target_lang: str
    ) -> list[str]:
        return [self.translate(t, source_lang, target_lang) for t in texts]
