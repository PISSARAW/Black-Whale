# Introductions de combat

Depuis `apps/web`, lancer `node scripts/check-fighting-introduction.mjs`.
La fixture utilise les composants et la scène WebGL de production. Elle vérifie
les deux entrées, le départ automatique, la pause, le passage au clavier et au
tactile, les réglages complet/bref/désactivé, l'anglais et les petits écrans.
Captures et rapport : `/tmp/black-whale-introduction-ui`.

`direction.html` expose aussi un échantillonnage manuel de la scène de production
pour comparer les poses et les mouvements de caméra d'Hisoka, Benjamin, Feitan,
Biscuit, Bonolenov et Illumi, puis contrôler le cadrage P2 à 390 et 320 px.
`direction.json` conserve les positions réelles des caméras et les rotations des
bras, lues après rendu dans le rig de production.
