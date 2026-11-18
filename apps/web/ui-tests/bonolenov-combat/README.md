# Revue visuelle de Bonolenov

Depuis `apps/web`, lancer `node scripts/check-bonolenov-combat.mjs`.
Le script ouvre Chrome sans interface, vérifie les coordonnées du rig et
l'absence d'erreurs WebGL, puis capture les deux orientations des phases de
danse, de port de lance, d'estoc, de déplacement et des neuf normales.

La référence et la distinction entre observation et adaptation sont détaillées
dans [BONOLENOV_COMBAT.md](../../src/lib/fighting/BONOLENOV_COMBAT.md).

La page se trouve à `/ui-tests/bonolenov-combat/`. Son API de revue est
`window.bonolenovCombat.show({ phase, frame, facing, slot })`.
Les phases sont `idle`, `dance`, `ready`, `spear`, `step`, `pivot`, `normal`.
Les frames de préparation proviennent du moteur réel ; les frames de coups
échantillonnent explicitement les données de la technique sélectionnée.

`BONOLENOV_COMBAT_OUTPUT` choisit le dossier de capture, par défaut
`/tmp/clash-bonolenov-combat`. `BONOLENOV_COMBAT_FILM=1` ajoute les images d'une
séquence de démonstration. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permet de fournir
un autre chemin de navigateur.

`body-music.wav` est rendu avec le synthétiseur de production. Le rapport
vérifie la présence du chant sur les mouvements, le silence au repos et les
niveaux de sortie. `window.bonolenovCombat.renderAudio(shots, fps)` permet de
rejouer le même échantillonnage sonore hors ligne.
