# Capacités d’arène

`pnpm --filter @black-whale/web test:arena-ui` vérifie les commandes O/P,
les deux boutons tactiles, la poussée des caisses, l’aspiration/restitution et
l’absence de débordement horizontal à 1100, 390 et 320 px.
Les captures et `report.json` sont écrits dans `/tmp/black-whale-arena-ui`.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permet de choisir un navigateur installé.
