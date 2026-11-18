# Sun and Moon — mains et contact matériel

## Ruleset 73

Le Soleil demande la main gauche ; la Lune demande la main droite. Le marquage
contextuel du décor vérifie cette main au départ puis à chaque pas de préparation.
Le livre ouvert, un téléphone réellement tenu, un avant-bras manquant ou une autre
occupation matérielle peuvent empêcher le geste. La polarité choisie au départ
reste attachée à cette préparation : ouvrir le livre pendant une Lune ne produit
pas un Soleil de remplacement. La page et le Nen doivent toujours être disponibles.

Deux objets marqués doivent se toucher horizontalement **et** verticalement pour
exploser. Le centre de l’explosion suit la zone de contact des deux volumes. Le
souffle intersecte les volumes corporels réels, y compris le corps laissé par la
projection d’Hanzo ; un contact en hauteur ne crée plus une explosion au sol.
Les protections et la résolution habituelle des décès restent appliquées.

Les 18 pas de préparation, les coûts, les dégâts, le rayon et la tolérance de
collision sont des réglages de duel. Ils ne représentent pas la charge maximale
canonique de trois à cinq secondes. Cette charge, les emplacements précis des
marques et les applications composées avec les marionnettes restent à compléter.
Cette correction ne constitue donc pas une certification de l’arsenal à 100 %.
**Le On reste présent.**

## Persistance matérielle — ruleset 74

Les marques inexplosées maintiennent la copie même lorsque son support a perdu
ses points de vie. Les morceaux déjà détachés gardent ainsi leur durée de Nen ;
le support détruit ne redevient pas un outil utilisable. Le véritable contact
Soleil/Lune consomme les deux marques avant la destruction et libère cette
protection : la matière suit alors de nouveau les limites de Gallery Fake.

Un renouvellement de manche conserve les objets marqués avec leur identité,
leur position, leurs dégâts et leur âge matériel. Le résolveur du décor reste
présent pour ces objets même sans interactions génériques du décor. Cette
persistance ne fournit aucune nouvelle tête détachée ou commande de marionnette.
Les emplacements précis, les fragments explosifs et la charge maximale restent
à compléter ; le On est conservé.

`sunMoonMaterialLifetime.test.ts` ajoute douze cas couvrant les deux joueurs,
les dégâts ordinaires, la fin des pages, la limite de 24 heures, la consommation
par une explosion réelle et le passage à la manche suivante.

## Références et vérification

Le [chapitre 351](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-351/chapter/10532)
introduit les deux mains et les marques opposées ; le
[chapitre 356](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-356/chapter/10537)
montre les applications avec les marionnettes. Le maintien des copies marquées
après désactivation de Gallery Fake est révélé au
[chapitre 354](https://hunterxhunter.fandom.com/wiki/Chapter_354).

`sunMoonObjectConditions.test.ts` exerce les gestes réels pour les deux joueurs,
le téléphone matériel, l’interruption par blessure et par ouverture du livre,
la séparation verticale, le contact des bords et les dégâts d’un souffle aérien.
Les tests existants du décor et des conditions matérielles complètent ce contrôle.
