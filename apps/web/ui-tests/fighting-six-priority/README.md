# Six personnages prioritaires

La fixture utilise les commandes publiques du moteur pour Biohazard, le pantin
de Black Voice, le remplacement de Halkenburg, le prêt de Dolphin, la suture de
Machi et la sortie partielle de Luini. Le contrôle
`node apps/web/scripts/check-six-priority.mjs` produit les captures et le rapport
dans `output/clash-six-priority`.

La passe suivante s'exerce avec `node apps/web/scripts/check-six-priority.mjs --multi-combat` :
modèles mémorisés de Bonolenov, choix de la prochaine forme et cadavre physique contrôlé par Illumi.
Les captures restent dans `output/clash-six-priority/`.

Le lot suivant se contrôle avec `node apps/web/scripts/check-six-priority.mjs --four-combat` :
parapluie matériel ouvert de Feitan, couteau tenu de Leorio et apparence d'Hisoka
sur le corps d'Illumi. Les trois scénarios sont capturés en 1280 et 390 pixels ;
`four-report.json` conserve les identités, les objets effectivement rendus et les
erreurs navigateur éventuelles.
