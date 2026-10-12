@echo off
REM Lance le frontend Taurge sans Docker. Double-clique sur ce fichier,
REM ou execute-le depuis une invite de commande ouverte dans ce dossier.
REM A lancer dans un AUTRE terminal que le backend (les deux tournent
REM en meme temps).

if not exist node_modules (
    echo Installation des dependances npm...
    npm install
)

set NEXT_PUBLIC_API_URL=http://localhost:8000

echo.
echo Demarrage du frontend sur http://localhost:3000
echo (Ctrl+C pour arreter)
echo.

npm run dev
