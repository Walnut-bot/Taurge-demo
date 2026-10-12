# Taurge - Roadmap & Scope MVP

## 1. Périmètre Actuel (MVP 1 Test)

### Ce qui est déjà opérationnel :
- [x] Inscription et authentification avec token JWT.
- [x] Création d'un projet avec sélection des langues source / cible et type de contenu.
- [x] Importation de fichiers (PDF, Images individuelles).
- [x] Extraction automatique des pages depuis un PDF (PyMuPDF).
- [x] Exécution de l'OCR (Tesseract OCR multilingue).
- [x] Traduction automatique (Google Translate + repli local Argos Translate).
- [x] Édition et correction manuelle du texte détecté et du texte traduit.
- [x] Nettoyage automatique des bulles (Inpainting via OpenCV).
- [x] Visualisation des pages (originale vs nettoyée) et des blocs englobants.
- [x] Export de projet en archive ZIP + métadonnées JSON.

---

## 2. Roadmap d'implémentation par Phases

### Phase 1 : Consolidation & Interface du Workspace (Jalon Immédiat)
- Intégration du composant visuel de lettering (Canvas Fabric.js / Konva ou SVG interactif).
- Rendu du texte traduit directement positionné sur l'image nettoyée.
- Sélection des styles typographiques (dialogue, narration, chuchotement, cri).

### Phase 2 : Glossaire & Mémoire de Traduction
- Détection et injection automatique des termes verrouillés dans le prompt de traduction.
- Gestion des fiches personnages, lieux et techniques.
- Alertes de cohérence de nom (Quality Control IA).

### Phase 3 : Gestion Avancée des Fichiers & Performance
- Upload fragmenté (chunked upload / resumable) pour les volumes de plusieurs centaines de Mo.
- Génération de miniatures (thumbnails) pour soulager le navigateur.
- Export direct au format PDF assemblé en plus du format ZIP.

### Phase 4 : Monétisation & Facturation Locale
- Passerelle de paiement FedaPay (MTN Moov Mobile Money, Cartes locales) & Flutterwave.
- Webhooks idempotents et gestion des abonnements (Free, Creator, Studio).
- Compteur de consommation (Usage Ledger).
