@echo off
setlocal enabledelayedexpansion
title Taurge - Demarrage Unifie

echo ========================================================
echo       TAURGE - Localisation Manga/Manhwa/Webtoon
echo ========================================================
echo.

set ROOT_DIR=%~dp0
set API_DIR=%ROOT_DIR%apps\api
set WEB_DIR=%ROOT_DIR%apps\web

echo [1/3] Verification des pre-requis...
py -3.12 -V >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python 3.12 est requis via le launcher 'py -3.12'.
    echo Merci de vous assurer que Python 3.12 est installe.
    pause
    exit /b 1
)

node -v >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js est requis et introuvable dans le PATH.
    pause
    exit /b 1
)

echo Pre-requis detectes : Python 3.12 et Node.js.
echo.

echo [2/3] Lancement de l'API FastAPI (Port 8000)...
start "Taurge - Backend API (FastAPI)" cmd /k "cd /d ""%API_DIR%"" && run_windows.bat"

echo En attente de demarrage de l'API (4 secondes)...
timeout /t 4 /nobreak >nul

echo [3/3] Lancement du Frontend Web (Port 3000)...
start "Taurge - Frontend Web (Next.js)" cmd /k "cd /d ""%WEB_DIR%"" && run_windows.bat"

echo En attente de demarrage du frontend (5 secondes)...
timeout /t 5 /nobreak >nul

echo.
echo Ouverture de Taurge dans votre navigateur par defaut...
start http://localhost:3000

echo.
echo ========================================================
echo Taurge est lance avec succes !
echo - Frontend : http://localhost:3000
echo - API Docs : http://localhost:8000/docs
echo.
echo Laissez les deux fenetres terminal ouvertes pendant l'utilisation.
echo ========================================================
echo.
pause
