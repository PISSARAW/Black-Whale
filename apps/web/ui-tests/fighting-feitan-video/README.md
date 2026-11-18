# Feitan — vidéo de comparaison

`node apps/web/scripts/render-feitan-combat.mjs` produit une vidéo de 24 secondes,
1280 × 720, à 30 images/s, depuis le moteur et le rendu de production.

Les quatre premières secondes montrent les déplacements. De 4 à 14 secondes,
des commandes dirigées présentent les attaques, avec une prise dédiée au
déploiement du parapluie et à la pointe dissimulée entre 8 et 11 secondes.
Les dix dernières secondes laissent l’IA piloter Feitan.
Hisoka sert de partenaire de sparring. Les deux combattants commencent chaque
prise avec 600 PV pour prolonger les échanges ; les règles d’attaque et les
vitesses restent celles du jeu. Aucun son n’est enregistré.

La simulation avance de deux frames à 60 Hz par image exportée ; le temps de
calcul n’accélère ni ne ralentit le film. `output/clash-feitan-video/` contient
le MP4, neuf captures et un rapport des attaques, contacts, bonds, dashes et
frames de parapluie ouvert. Le script exige une ouverture visible et une attaque
derrière la toile. `FEITAN_VIDEO_OUTPUT` permet de choisir un autre dossier.
Chrome et ffmpeg sont requis.
