# Anticipation et défense contre les projectiles

L’IA native classe les manifestations actuellement perçues par temps avant collision,
avec leurs vitesses, dimensions et les volumes du corps. Les trajectoires qui passent
hors du corps sont ignorées. Un mouvement aérien est projeté jusqu’à l’atterrissage ;
la préparation du saut, les deux gravités et la récupération au sol restent réelles.
Les joueurs et sièges recevant des commandes explicites gardent leurs commandes.

L’observation conserve les délais ordinaires de 10 ou 14 frames. Ensuite, l’IA préfère
passer sous un tir haut, vérifie un saut complet, ou garde si le départ serait trop
tardif. Une rafale mixte peut être gardée accroupi pour laisser passer sa partie haute.
Les hauteurs de garde restent applicables. Une trajectoire montante, guidée ou de
retour ne promet pas une esquive certaine à partir d’une simple vitesse horizontale.

Les balles d’un même adversaire partagent une observation bornée : 16 identifiants
au maximum et 12 frames entre manifestations. Les interruptions plus longues,
changements de manche et pertes de disponibilité effacent ou interrompent la réponse.
Une courte lacune ne relance pas le délai de réaction ni le compteur de garde. Une
nouvelle attaque de l’IA ne remplace pas la défense en cours. Aucun reset de parade,
invulnérabilité, annulation d’attaque ou soin n’est accordé. Le chip damage reste celui
de la garde ordinaire. Les informations d’In, En, Gyo et des sens restent filtrées ;
ni projectile futur ni cible cachée ni commande en attente n’est consulté.

Les tests couvrent les 40 personnages et les deux orientations contre 20 tirs hauts
et 20 tirs à hauteurs mélangées, le finisher réel de 40 tirs à 120/60/30/20 Hz avec
l’IA complète, la rafale physique de Benjamin et un vrai saut au-dessus d’une carte.
Les empreintes des replays et la reprise depuis un snapshot en pleine rafale sont
vérifiées. Le ruleset passe à `clash-combat-39` pour ces nouvelles décisions d’IA.

`node apps/web/scripts/check-fighting-projectile-defence.mjs` vérifie la scène réelle
sur ordinateur et mobile. Captures et rapport : `/tmp/black-whale-projectile-defence`
(`PROJECTILE_DEFENCE_OUTPUT` permet de choisir un autre dossier).
