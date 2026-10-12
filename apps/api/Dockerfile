FROM python:3.12-slim

WORKDIR /app

# Tesseract + packs de langue pour l'OCR (voir docs/AI_ARCHITECTURE
# quand il existera : ce choix est documenté comme provider MVP-0,
# remplaçable plus tard sans toucher au reste du code).
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    tesseract-ocr-jpn \
    tesseract-ocr-kor \
    tesseract-ocr-chi-sim \
    tesseract-ocr-chi-tra \
    tesseract-ocr-spa \
    tesseract-ocr-por \
    tesseract-ocr-deu \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
