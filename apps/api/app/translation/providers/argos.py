"""Traduction via Argos Translate : moteur neuronal open-source qui
tourne EN LOCAL dans le conteneur, sans clé API et sans aucune limite
de débit (puisqu'il n'y a pas d'appel à un service tiers à chaque
traduction — seulement au tout premier usage d'une paire de langues,
pour télécharger son modèle une fois).

Compromis assumé par rapport à Google Translate : la qualité peut être
légèrement en retrait sur certaines paires de langues, et le modèle
pour une paire absente du catalogue direct passe par un pivot anglais
(ex. japonais -> anglais -> français) ce qui peut perdre un peu de
nuance. C'est un compromis raisonnable pour un MVP-0 qui doit d'abord
être FIABLE.
"""

import threading

import argostranslate.package
import argostranslate.translate

_install_lock = threading.Lock()
_installed_pairs: set[tuple[str, str]] = set()
_index_updated = False


def _pair_already_on_disk(from_code: str, to_code: str) -> bool:
    # Vérifie les modèles réellement présents sur le disque (persistés
    # via le volume Docker), SANS appel réseau. Indispensable : en dev,
    # --reload redémarre le processus Python à chaque modification de
    # code, ce qui viderait un simple cache en mémoire et redéclencherait
    # un téléchargement (et un appel réseau qui peut échouer) à chaque
    # fois, même quand le modèle est déjà installé.
    installed = argostranslate.package.get_installed_packages()
    return any(p.from_code == from_code and p.to_code == to_code for p in installed)


def _install_pair_if_available(from_code: str, to_code: str) -> bool:
    available = argostranslate.package.get_available_packages()
    match = next(
        (p for p in available if p.from_code == from_code and p.to_code == to_code),
        None,
    )
    if not match:
        return False
    path = match.download()
    argostranslate.package.install_from_path(path)
    return True


def _ensure_models_installed(source_lang: str, target_lang: str) -> None:
    global _index_updated
    key = (source_lang, target_lang)

    with _install_lock:
        if key in _installed_pairs:
            return

        # 1. Vérification locale d'abord (rapide, pas de réseau).
        if _pair_already_on_disk(
            source_lang, target_lang
        ) or _pair_already_on_disk(source_lang, "en") and _pair_already_on_disk(
            "en", target_lang
        ):
            _installed_pairs.add(key)
            return

        # 2. Rien sur le disque : on télécharge (réseau nécessaire).
        if not _index_updated:
            argostranslate.package.update_package_index()
            _index_updated = True

        direct_ok = _install_pair_if_available(source_lang, target_lang)
        if not direct_ok and source_lang != "en" and target_lang != "en":
            # Pas de paire directe : on installe un pivot par l'anglais.
            # argostranslate.translate.translate() sait automatiquement
            # chaîner les modèles installés (X -> en -> Y) tant que les
            # deux maillons sont présents.
            _install_pair_if_available(source_lang, "en")
            _install_pair_if_available("en", target_lang)

        _installed_pairs.add(key)


class ArgosTranslateProvider:
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text.strip():
            return ""
        _ensure_models_installed(source_lang, target_lang)
        return argostranslate.translate.translate(text, source_lang, target_lang)

    def translate_batch(
        self, texts: list[str], source_lang: str, target_lang: str
    ) -> list[str]:
        if not texts:
            return []
        _ensure_models_installed(source_lang, target_lang)
        # Inférence locale : pas besoin de délai entre les appels,
        # contrairement à un service tiers à débit limité.
        return [
            argostranslate.translate.translate(t, source_lang, target_lang)
            if t.strip()
            else ""
            for t in texts
        ]
