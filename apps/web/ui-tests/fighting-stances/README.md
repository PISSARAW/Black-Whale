# Poses de repos de Clash

Depuis `apps/web` :

```sh
node scripts/check-fighting-stances.mjs
```

Le script ouvre la scène dans Chrome sans interface, vérifie les 40 combattants
dans les deux orientations et à quatre instants du cycle de repos, puis écrit
120 captures (face, droite, gauche) et `report.json` dans `/tmp/clash-stances`.
`STANCES_OUTPUT` change le dossier et `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` le
chemin de Chrome. Le pied le plus bas doit conserver sa hauteur pendant le cycle.

La page peut aussi être ouverte via Vite à `/ui-tests/fighting-stances/`.
`window.stanceGallery.show(id, facing, { seconds, view })` sélectionne le personnage ;
`view` vaut `combat` ou `front`. La caméra et l'éclairage sont fixes pour rendre
les comparaisons possibles. Le modèle, les équipements et les poses passent par
les mêmes fonctions que le jeu.

Les références, les scènes choisies et les limites de leur vérification se
trouvent dans [STANCE_REFERENCES.md](../../src/lib/fighting/STANCE_REFERENCES.md).
Les captures vérifient le rendu du rig ; elles ne remplacent pas la comparaison
visuelle avec les planches du manga.
