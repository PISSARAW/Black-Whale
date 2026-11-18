# Kaméos dans les combos

`pnpm --filter @black-whale/web test:kameo-combos-ui` lance les six exercices
par les boutons de l’Académie et utilise le moteur, les commandes, les modèles et
la scène de production. Le banc vérifie centre / coin, les deux orientations,
les effets de soutien, trois ou douze contacts réels, le français et l’anglais,
puis un appel tactile pendant le hitstop dans un écran de 390 px.

`KAMEO_COMBO_OUTPUT` choisit le dossier du rapport JSON et des captures
(par défaut `/tmp/black-whale-kameo-combos`). Ces essais vérifient le comportement
et le rendu ; ils ne mesurent pas les performances GPU.
