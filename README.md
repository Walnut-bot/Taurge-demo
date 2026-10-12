# Taurge — Version sans Docker (par défaut)

Workspace de localisation IA de contenu illustré (manga, manhwa, manhua,
webtoon, comic). Voir `docs/` pour le scope MVP, l'architecture complète
et la roadmap.

## 🎉 Docker n'est plus nécessaire pour développer en local
Suite aux soucis répétés avec Docker (lenteur, bugs réseau), le projet
tourne maintenant nativement :
- **PostgreSQL remplacé par SQLite** par défaut : un simple fichier
  (`taurge.db`), aucun serveur à installer ni faire tourner. PostgreSQL
  reste utilisable plus tard (prod) en définissant `DATABASE_URL`.
- **Scripts à double-clic** (`run_windows.bat`) qui installent et
  démarrent tout automatiquement, sans ligne de commande Docker.

## Installation (une seule fois)
1. **Python 3.12** — python.org/downloads (cocher "Add python.exe to
   PATH" à l'installation)
2. **Node.js LTS** — nodejs.org
3. **Tesseract-OCR** — github.com/UB-Mannheim/tesseract/wiki
   (cocher français, anglais, japonais, coréen, chinois, espagnol,
   portugais, allemand dans "Additional language data" à l'installation)

## Démarrer le projet (à chaque fois)
1. Double-clique sur `apps\api\run_windows.bat` → attends
   "Application startup complete"
2. Dans un **autre** dossier/fenêtre, double-clique sur
   `apps\web\run_windows.bat`
3. Ouvre http://localhost:3000

Les deux fenêtres noires doivent rester ouvertes tant que tu utilises
l'app. Ferme-les (Ctrl+C) quand tu as fini.

## Si Tesseract n'est pas trouvé automatiquement
Ouvre `apps\api\run_windows.bat` avec le Bloc-notes, et décommente
(enlève le `REM` devant) la ligne :
```
set TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```
en ajustant le chemin si tu as installé Tesseract ailleurs.

## Mac/Linux (sans .bat)
```bash
# Backend
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (autre terminal)
cd apps/web
npm install
npm run dev
```

## Docker reste disponible si besoin
`docker-compose.yml` est toujours là pour plus tard (déploiement,
environnement d'équipe). Pas la priorité tant que le développement
solo est plus simple sans.

## Structure du repo
Voir `docs/REPO_STRUCTURE.md`.

## Fonctionnalités actuelles
Compte → projet → upload (PDF/image) → extraction des pages → OCR
(Tesseract) → traduction (Google Translate + repli local Argos
Translate) → correction manuelle (texte OCR et traduction) →
nettoyage automatique (inpainting) → export (ZIP + JSON).

Voir `docs/ROADMAP.md` pour la suite possible (lettering visuel,
glossaire...).
