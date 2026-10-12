from app.translation.providers.composite import CompositeTranslationProvider

# Un seul point de câblage : changer de provider de traduction plus
# tard se fait ici, nulle part ailleurs. Le composite essaie Google
# Translate (meilleure qualité) puis bascule sur Argos Translate
# (local, fiable) si besoin — voir providers/composite.py.
translation_provider = CompositeTranslationProvider()


def get_translation_provider() -> CompositeTranslationProvider:
    return translation_provider
