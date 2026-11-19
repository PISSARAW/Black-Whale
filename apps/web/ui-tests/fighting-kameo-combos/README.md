# Kaméos dans les combos

`pnpm --filter @black-whale/web test:kameo-combos-ui` lance les six exercices
par les boutons de l’Académie et utilise le moteur, les commandes, les modèles et
la scène de production. Le banc vérifie centre / coin, les deux orientations,
les effets de soutien, trois ou douze contacts réels, le français et l’anglais,
puis un appel tactile pendant le hitstop dans un écran de 390 px.

`KAMEO_COMBO_OUTPUT` choisit le dossier du rapport JSON et des captures
(par défaut `/tmp/black-whale-kameo-combos`). Ces essais vérifient le comportement
et le rendu ; ils ne mesurent pas les performances GPU.

Les quarante combattants ont chacun six exercices. Le banc Chrome mesure 4 480
situations : appel à 0, 10, 30 ou 60 frames actives après la première touche,
garde ou léger du défenseur, puis quatre retards de la dernière frappe avec
Luzurus. Chaque cas est joué au centre et au coin. Les délais ignorent le hitstop ;
les frames de contact et de reprise incluent toutes les frames de simulation.

`timings.json` sépare le combo physique garanti (`comboGuaranteed`), le soutien
reçu avant sa fin (`supportInCombo`) et leur réussite conjointe (`guaranteed`).
Il donne la première frame où le défenseur peut agir, l’entrée de sa riposte,
son éventuel contact et ses dégâts. Une riposte autorisée peut manquer ou être
évitée. Le banc lance aussi 100 exercices depuis l’interface, dont Luzurus pour
chaque combattant aux deux positions, avec captures de la scène de production.
Le dossier par défaut est maintenant `output/kameo-roster/chrome`.
