FROM python:3.12-slim

# Installation des dépendances système nécessaires pour Tesseract et Pillow/OpenCV
RUN apt-get update && apt-get install -y \
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
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# Copie des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copie du code source
COPY . .
# Port d'écoute standard
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
