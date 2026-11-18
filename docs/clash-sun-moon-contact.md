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

## Charge complète au contact — ruleset 75

Deux commandes explicites permettent de choisir le Soleil ou la Lune sur un
objet réel ou une copie existante. Le Soleil utilise la main gauche, y compris
livre fermé avec signet ; la Lune exige la main droite libre. La marque apparaît
au premier contact. La charge complète demande **300 pas à 60 Hz**, soit cinq
secondes simulées, borne haute des trois à cinq secondes indiquées au chapitre 351.

La main, le Nen, la page et la position relative du support doivent rester
compatibles avec le contact pendant toute la charge. Un déplacement qui rompt
le contact, une blessure interruptive, une prise de contrôle, la perte de la page
ou le On arrêtent la charge. Le joueur peut aussi relâcher volontairement.
La marque conserve la charge déjà atteinte ; recommencer un contact court ne
cumule pas plusieurs courtes durées pour obtenir les cinq secondes continues.

La durée acquise module le souffle et ses dégâts lors du véritable contact entre
les marques. Les valeurs numériques de puissance, de rayon, d’aura et la
progression partielle restent des réglages de duel. Une charge complète ne
fournit ni contact à distance ni mort automatique d’un adversaire.

Les deux joueurs utilisent les mêmes commandes dans le panneau, le PvP et les
replays. L’IA peut commencer un contact sur de la matière existante pendant une
ouverture connue ; elle ne garantit pas que l’adversaire attendra cinq secondes.
Le bras du corps articulé partagé tient la pose de contact. Les emplacements
précis des marques, les fragments explosifs et les commandes composées des
marionnettes restent ouverts. Le On reste présent.

Les 26 tests de charge couvrent la durée à quatre fréquences d’appel, les mains,
les interruptions, l’arrêt volontaire, la puissance et l’IA. Cinq tests de
frontière couvrent les replays complets de P1 et P2, leur vue privée et le
protocole. Le contrôle navigateur exerce les deux marques pour chaque joueur
aux largeurs 1100, 390 et 320 pixels, avec arrêt partiel puis charge complète.

## Frappes natives — ruleset 76

Les coups natifs de Sun and Moon vérifient maintenant la main requise avant
l’admission et à nouveau au moment du marquage. Le catalogue de coups annonce
la même disponibilité. Un téléphone tenu dans cette main ou un avant-bras
manquant interdit la technique sans dépense d’aura. Une blessure acquise après
l’admission empêche aussi l’application de la marque à l’impact.

Le Soleil principal conserve la main gauche, même livre fermé avec signet ;
la Lune secondaire utilise la main droite une fois le livre fermé. Tenir un
objet dans l’autre main n’interdit pas automatiquement le geste. Les changements
de page restent distincts de ces frappes. Le On est conservé.

Dix-huit tests vérifient les deux joueurs, les deux frappes, la disponibilité
publique, le téléphone matériel, les avant-bras et le contrôle à l’impact.
La séquence Soleil, fermeture du livre puis Lune reste jouable dans le moteur.
Les emplacements précis des marques et les combinaisons des marionnettes restent
à compléter ; cette passe ne certifie pas l’ensemble des quarante arsenaux à 100 %.

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
