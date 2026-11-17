# Qualification du solo

`pnpm --filter @black-whale/web test:solo-ui` monte les composants de production
et leur contrôleur. Seul le temps est manuel : chaque avance passe par le vrai
moteur, les frappes et les objectifs. Aucun PV, verdict ou résultat n’est forcé.

Le script joue le parcours de lecture, recharge sa sauvegarde entre rencontres,
vérifie la pause, les titres, les sélecteurs des quatre modes et la mise en page
FR/EN à 320, 390 et 1280 pixels. Chromium désactive la 3D : ce test vérifie le
parcours de secours, pas le rendu GPU ou une manette Xbox physique.
