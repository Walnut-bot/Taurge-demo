from typing import Protocol


class TranslationProvider(Protocol):
    """Interface de traduction. Un seul provider concret au MVP-0.

    Pas de contexte (chapitre, personnage, glossaire) à ce stade — voir
    docs/MVP_SCOPE.md. La traduction contextuelle est prévue pour plus
    tard (Phase 3 du cahier des charges complet), une fois que cette
    version simple aura prouvé que le pipeline entier fonctionne.
    """

    def translate(self, text: str, source_lang: str, target_lang: str) -> str: ...

    def translate_batch(
        self, texts: list[str], source_lang: str, target_lang: str
    ) -> list[str]:
        """Traduit plusieurs textes en une seule fois. À privilégier dès
        qu'il y a plus d'un texte à traduire : ça évite de multiplier
        les requêtes réseau et de se faire limiter par le fournisseur
        (rate limiting).
        """
        ...
