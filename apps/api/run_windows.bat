@echo off
REM Lance le backend Taurge sans Docker. Double-clique sur ce fichier,
REM ou execute-le depuis une invite de commande ouverte dans ce dossier.
REM
REM IMPORTANT : utilise specifiquement Python 3.12 via le "py launcher"
REM de Windows, meme si une version plus recente (3.13, 3.14...) est
REM aussi installee sur la machine. Certaines librairies du projet
REM (PyMuPDF, OpenCV, Argos Translate) n'ont pas encore de version
REM prete a l'emploi pour les Python tres recents, ce qui fait planter
REM l'installation. Python 3.12 doit etre installe au prealable
REM (python.org/downloads, chercher "Python 3.12" specifiquement, pas
REM le gros bouton de telechargement qui donne la derniere version).

if not exist venv (
    echo Creation de l'environnement Python virtuel avec Python 3.12...
    py -3.12 -m venv venv
    if errorlevel 1 (
        echo.
        echo ERREUR : Python 3.12 introuvable via "py -3.12".
        echo Installe-le depuis python.org/downloads ^(page des versions,
        echo chercher 3.12.x specifiquement^), puis relance ce script.
        echo.
        pause
        exit /b 1
    )
)

call venv\Scripts\activate.bat

echo Installation/mise a jour des dependances...
pip install -r requirements.txt

REM Si Tesseract n'est pas trouve automatiquement, decommente la ligne
REM suivante et ajuste le chemin selon ton installation :
REM set TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

set DATABASE_URL=sqlite:///./taurge.db
set STORAGE_PATH=./storage_data
set ENVIRONMENT=development

echo.
echo Demarrage de l'API sur http://localhost:8000
echo Documentation : http://localhost:8000/docs
echo (Ctrl+C pour arreter)
echo.

uvicorn app.main:app --reload
