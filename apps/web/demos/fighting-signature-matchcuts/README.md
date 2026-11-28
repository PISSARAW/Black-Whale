# Combos signatures — montage vertical

40 combattants, une route signature existante par combattant, quatre temps par
route : 64 secondes, 150 BPM, 1080 × 1920, 30 images/s. Les commandes, préparations,
contacts et effets sont issus du simulateur du jeu ; aucun coup n'est inventé.
L'ordre glouton rapproche les poses articulaires de sortie et d'entrée, en
pénalisant les changements d'orientation et de hauteur. Même arène et même
réglage de caméra pour limiter les changements de cadrage. Un bref flash marque
les coupes. La musique synthétisée et les sons de contacts sont exportés ensemble.

Il s'agit d'une première version : le score compare les poses d'attaque authored,
pas les silhouettes projetées par la caméra ni tous les accessoires. Les raccords
ne sont donc pas garantis au pixel près. Les routes longues sont accélérées pour
tenir quatre temps ; ce montage n'est pas un tutoriel montrant chaque image.
Le rapport conserve les routes incomplètes et le script d'export refuse de les
valider. Tous les combattants sont inclus une fois, y compris les techniques qui
nécessitent une préparation, un tir reçu ou une riposte.

Depuis la racine du dépôt :

```sh
node apps/web/scripts/render-signature-matchcuts.mjs --inspect
node apps/web/scripts/render-signature-matchcuts.mjs
```

Sortie : `output/fighting-signature-matchcuts/Black-Whale-Clash-Signature-Matchcuts.mp4`.
`--only=hisoka,feitan,chrollo` permet un extrait ; `--stills=0,48,96` choisit des
images. `COMBO_EDIT_OUTPUT` change le dossier de sortie. Chrome, FFmpeg, Python
avec NumPy et les dépendances du dépôt doivent être installés. La page de démo
peut aussi être ouverte depuis Vite à `/demos/fighting-signature-matchcuts/`.

Validation sans serveur local :

```sh
TSX_TSCONFIG_PATH=apps/web/tsconfig.json node --import tsx --test apps/web/demos/fighting-signature-matchcuts/film.test.ts
```
