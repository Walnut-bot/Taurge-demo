"""Cleaning automatique : efface le texte détecté par l'OCR et
reconstruit le fond à cet endroit (inpainting).

Méthode : OpenCV (algorithme de Telea), pas de modèle IA — rapide,
sans dépendance réseau, fonctionne bien sur des fonds simples ou
légèrement texturés. Sur des trames complexes (hachures fines,
dégradés détaillés), le résultat peut rester visible ; un modèle
d'inpainting plus avancé pourra améliorer ça plus tard sans changer
l'interface de cette fonction.
"""

import cv2
import numpy as np

# Marge ajoutée autour de chaque bounding box OCR, en pixels, pour
# couvrir les débords d'anti-aliasing du texte détecté.
MASK_PADDING = 3


def clean_image(image_bytes: bytes, blocks: list[tuple[int, int, int, int]]) -> bytes:
    """blocks : liste de (x, y, w, h). Retourne une image PNG (bytes)
    avec le texte de ces zones effacé et le fond reconstruit.
    """
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Image illisible — format non supporté par OpenCV.")

    height, width = image.shape[:2]
    mask = np.zeros((height, width), dtype=np.uint8)

    for x, y, w, h in blocks:
        x0 = max(0, x - MASK_PADDING)
        y0 = max(0, y - MASK_PADDING)
        x1 = min(width, x + w + MASK_PADDING)
        y1 = min(height, y + h + MASK_PADDING)
        mask[y0:y1, x0:x1] = 255

    cleaned = cv2.inpaint(image, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

    success, encoded = cv2.imencode(".png", cleaned)
    if not success:
        raise ValueError("Échec de l'encodage de l'image nettoyée.")
    return encoded.tobytes()
