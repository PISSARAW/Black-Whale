# Corps d’origine et conscience transférée d’Halkenburg

Le ruleset **clash-combat-67** remplace le retour automatique après cent vingt
frames par un lien persistant entre la conscience choisie et le corps touché.
Le groupe aléatoire inclut désormais Halkenburg lui-même, application révélée
dans les chapitres 403–404. Son corps d’origine ou celui du partisan choisi
s’endort ; les corps, leurs blessures et leur identité physique restent distincts.
Le **On est conservé**.

## Application jouable

La cohorte réelle, ses marques, son consentement et sa volonté commune restent
requis. Le membre choisi doit toujours être présent et disponible au contact.
Le corps d’origine endormi quitte les actions volontaires ; celui du partisan
choisi quitte aussi le groupe disponible. La victime ne récupère pas ses
commandes après un délai arbitraire. La capture d’un autre corps déjà engagé
dans un échange n’est pas extrapolée en une cascade de consciences.

Les commandes de déplacement appartiennent au camp de la conscience transférée,
même lorsque le corps d’Halkenburg dort. Elles passent par les vraies entrées
du panneau et du réseau. Le corps touché marche dans la simulation ordinaire,
avec ses collisions, blessures et entraves. Ce déplacement ne lui donne pas
le Hatsu de la victime. L’arsenal personnel du nouvel occupant reste à intégrer.

Grimmel ne cause plus de dégâts, de recul, de knockdown ni de points de frappe.
La garde et les défenses de Nen ne deviennent pas un bouclier contre cet échange.
Une projection de Hanzo ne remplace pas le corps physique atteint.
La démonstration existante attend maintenant une vraie décision au temps,
avec la cible vivante ; elle ne transforme plus la flèche en coup mortel.
Les coûts numériques d’aura et de PV restent des réglages du duel.

Le lien et le sommeil ne disparaissent pas pendant le hitstop ou au passage
d’une manche. Le même corps de partisan est conservé. La vue privée ne révèle
pas la conscience tirée au sort à l’adversaire ; les identités des échanges
restent canoniques dans la vue P2 et dans les replays.
Un échange accompli est distingué d’un compteur maintenu pour le suivi Dolphin ;
cette vérification ne certifie pas tous les prérequis d’un emprunt de Grimmel.

## Travail encore nécessaire

Cette livraison est une première partie du modèle. Les alternances de sommeil,
la priorité de conscience, les conséquences des morts réelles, le contrôle
complet de l’occupant et l’armure collective restent ouverts. Elle ne certifie
ni tout Halkenburg ni les quarante arsenaux à 100 %.

Références : chapitres 382 et 403–404 ; [récapitulatif du chapitre 404](https://hunterxhunter.fandom.com/wiki/Chapter_404).

## Vérification

Les 1 731 tests d’intégration passent, ainsi que les 3 167 contrôles de combat,
les 24 contrôles du dépôt et les neuf vérifications de bundles compilés.
Les douze parcours UI suivent le tir, la prise de contrôle et les déplacements
pour P1/P2, un partisan ou Halkenburg choisi, à 1100, 390 et 320 pixels.
Ils vérifient aussi l’absence de dégâts et de retour après deux secondes.
Les replays et la prédiction P2 passent par les vraies entrées d’exécution.
Typage : zéro erreur et zéro avertissement ; lint et limite brute de 500 lignes
des fichiers modifiés validés. Le build de production termine ; son plus gros
module client pèse 494 363 octets, sous le plafond de 500 000 octets.
