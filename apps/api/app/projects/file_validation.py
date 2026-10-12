"""Validation du type de fichier par son contenu réel, pas par son
extension. Une extension ".png" ne prouve rien — on vérifie les
premiers octets du fichier (magic bytes).

Formats acceptés au MVP-0 : PDF et images (PNG, JPG, WEBP). ZIP/CBZ
arrivent au MVP-1 (nécessitent aussi une protection anti zip-bomb, à ne
pas faire à moitié).
"""

SIGNATURES: dict[str, bytes] = {
    "pdf": b"%PDF",
    "png": b"\x89PNG\r\n\x1a\n",
    "jpg": b"\xff\xd8\xff",
}

# WEBP a un en-tête un peu particulier : "RIFF" puis 4 octets de
# taille, puis "WEBP".
WEBP_RIFF = b"RIFF"
WEBP_MARKER = b"WEBP"


def detect_file_type(content: bytes) -> str | None:
    """Retourne 'pdf', 'png', 'jpg', 'webp' ou None si non reconnu."""
    for file_type, signature in SIGNATURES.items():
        if content.startswith(signature):
            return file_type
    if content[:4] == WEBP_RIFF and content[8:12] == WEBP_MARKER:
        return "webp"
    return None
