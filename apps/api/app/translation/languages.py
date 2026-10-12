"""deep-translator (Google Translate) attend certains codes un peu
différents de nos codes internes. Cette table fait le lien.
"""

LANG_CODE_MAP: dict[str, str] = {
    "zh": "zh-CN",
}


def get_provider_lang(lang: str) -> str:
    return LANG_CODE_MAP.get(lang, lang)
