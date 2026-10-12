# TAURGE — MVP-0 (Scope ultra-réduit)

## Objectif
Un utilisateur seul peut : importer un chapitre → obtenir une traduction
exploitable → l'exporter. Rien d'autre. C'est la seule chose qui doit
fonctionner à 100% avant qu'on ajoute quoi que ce soit.

## Ce qui EST dans le MVP-0

1. **Auth minimale** : inscription/connexion par email + mot de passe.
   Pas d'OAuth, pas de vérification email au round 1 (à ajouter juste après).
2. **Un seul projet actif à la fois** (pas de dashboard multi-projets
   sophistiqué — une liste simple suffit).
3. **Upload** : images (PNG/JPG/WEBP) et PDF uniquement. ZIP/CBZ arrivent
   en MVP-1. Pas de resumable/chunk upload au round 1 — on limite la
   taille de fichier (ex. 50 Mo) pour éviter le problème plutôt que de
   le résoudre tout de suite.
4. **Conversion PDF → pages** : extraction en images.
5. **OCR** : un seul provider (à choisir — voir AI_ARCHITECTURE),
   détection texte + bounding box. Pas de distinction bulle/narration/SFX
   au round 1 : tout est traité pareil.
6. **Traduction IA** : un seul provider, traduction page par page avec le
   texte des bulles précédentes de la même page comme contexte. Pas de
   mémoire de traduction, pas de glossaire, pas d'adaptation par
   personnage au round 1.
7. **Éditeur minimal** : liste des pages, et pour chaque page, une liste
   de blocs texte (original + traduction éditable en texte brut). Pas de
   canvas visuel avec repositionnement au round 1 — on affiche l'image
   et le texte à côté, pas incrusté dedans.
8. **Export** : PDF ou ZIP contenant les images originales + un fichier
   texte/JSON avec les traductions par page. Pas de lettering (texte
   incrusté dans l'image) au round 1.

## Ce qui N'EST PAS dans le MVP-0 (volontairement repoussé)

- Cleaning / inpainting
- Lettering visuel (texte positionné sur l'image)
- Mémoire de traduction, glossaire, personnages
- Collaboration, rôles, commentaires
- Billing, plans, quotas
- Admin panel
- Versioning avancé
- Notifications
- Multi-provider IA avec fallback automatique (on code l'interface, mais
  un seul provider branché dessus)

## Pourquoi ce découpage
Chaque brique retirée ci-dessus est un projet en soi. Les ajouter plus
tard est un travail d'extension sur une base qui fonctionne déjà — pas
une réécriture — à condition de respecter les interfaces définies dans
ARCHITECTURE.md dès le départ (OCRProvider, TranslationProvider, etc.).

## Définition de "terminé" pour le MVP-0
- Je peux créer un compte, importer un vrai chapitre (PDF de ~20 pages),
  lancer l'OCR, lancer la traduction, corriger manuellement au moins un
  bloc, et exporter un résultat que je peux ouvrir et lire.
- Aucune étape ne plante silencieusement : une erreur est affichée, pas
  masquée.
- Le code est dans un repo Git avec un README qui explique comment le
  lancer en local.
