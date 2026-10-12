import io

import pytesseract
from PIL import Image

from app.core.config import settings
from app.ocr.provider import OCRBlockData

# Sur Windows, l'exécutable Tesseract n'est pas toujours sur le PATH
# même après installation. TESSERACT_CMD permet de pointer dessus
# explicitement (voir .env.example ou les scripts run_windows.bat).
import os

tess_path = settings.tesseract_cmd or r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(tess_path):
    pytesseract.pytesseract.tesseract_cmd = tess_path
elif settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


class TesseractOCRProvider:
    """Implémentation OCRProvider basée sur Tesseract (open-source,
    aucune clé API, aucun coût par appel — adapté à un démarrage solo).

    Regroupe les mots détectés par "block" Tesseract (son unité la plus
    proche d'une bulle de dialogue isolée visuellement). Ce n'est pas
    parfait sur du contenu illustré dense — un moteur spécialisé
    manga/BD pourra remplacer ce provider plus tard sans changer le
    reste de l'app.
    """

    def detect_text(self, image_bytes: bytes, lang: str) -> list[OCRBlockData]:
        image = Image.open(io.BytesIO(image_bytes))
        data = pytesseract.image_to_data(
            image, lang=lang, output_type=pytesseract.Output.DICT
        )

        blocks: dict[int, dict] = {}
        for i in range(len(data["text"])):
            text = data["text"][i].strip()
            confidence = float(data["conf"][i])
            if not text or confidence < 0:
                continue

            block_num = data["block_num"][i]
            left, top = data["left"][i], data["top"][i]
            right, bottom = left + data["width"][i], top + data["height"][i]

            if block_num not in blocks:
                blocks[block_num] = {
                    "words": [],
                    "confidences": [],
                    "min_x": left,
                    "min_y": top,
                    "max_x": right,
                    "max_y": bottom,
                }
            b = blocks[block_num]
            b["words"].append(text)
            b["confidences"].append(confidence)
            b["min_x"] = min(b["min_x"], left)
            b["min_y"] = min(b["min_y"], top)
            b["max_x"] = max(b["max_x"], right)
            b["max_y"] = max(b["max_y"], bottom)

        results = []
        for b in blocks.values():
            results.append(
                OCRBlockData(
                    text=" ".join(b["words"]),
                    bbox_x=b["min_x"],
                    bbox_y=b["min_y"],
                    bbox_w=b["max_x"] - b["min_x"],
                    bbox_h=b["max_y"] - b["min_y"],
                    # Tesseract donne une confiance 0-100, on
                    # normalise à 0-1 comme le reste de l'app.
                    confidence=sum(b["confidences"]) / len(b["confidences"]) / 100,
                )
            )
        return results
