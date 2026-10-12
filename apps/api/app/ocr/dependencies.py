from app.ocr.providers.tesseract import TesseractOCRProvider

# Un seul point de câblage : changer de provider OCR plus tard se fait
# ici, nulle part ailleurs.
ocr_provider = TesseractOCRProvider()


def get_ocr_provider() -> TesseractOCRProvider:
    return ocr_provider
