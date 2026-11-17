# Étape 8 · équipes et arènes

`/fighting/teams` approfondit le format local existant : trois stocks successifs
par camp et un relais temporaire par équipe et par set. Un seul corps de chaque
camp combat à un instant donné. Les facultés, préparations, coûts et frappes
restent ceux du moteur ordinaire ; aucune nouvelle capacité de Nen n’est ajoutée.

## Préparer et lire une équipe

La sélection propose les quarante personnages, interdit les doublons d’un même
camp et permet de réordonner les trois entrées. La composition, le terrain et
l’option de couverts peuvent être conservés dans ce navigateur. Cette sauvegarde
contient uniquement des identifiants et options : ni corps de combat, aura,
capacité copiée, équipement acquis ou progression compétitive.

La sélection rappelle l’équipement personnel et, lorsque les couverts sont
activés, l’application de terrain et ses conditions. Activer le décor fournit
uniquement deux caisses physiques initiales. Cela ne fournit ni animal, graine,
partisan, chambre préparée, territoire particulier ou cible consentante.

Pendant le combat, chaque camp affiche ses stocks, le corps en scène, les PV et
l’aura de chaque membre. Les réserves ne récupèrent rien hors scène. Le panneau
annonce aussi le corps qui entrera après une élimination, avec les ressources
qui seront réellement conservées. Le survivant garde PV et aura ; la frontière
de manche existante remet les manifestations et préparations en état et conserve
les coûts persistants qu’elle suit déjà. Le relais conserve le corps entier à
l’aller et au retour : il ne guérit pas et ne recharge pas un remplaçant.

## Entrée, intervention et retour

L’interface et `requestTeamAssist` partagent `teams/availability.ts`. Les refus
sont explicites : manche inactive, relais consommé, allié déjà en scène, réserve
éliminée, mauvais bord, corps occupé ou engagement restant à résoudre. Une
indisponibilité liée au Nen reste générique et ne décrit pas un pouvoir caché.
Les boutons ne prédisent que les conditions publiques de composition et de bord.
Un engagement caché ne devient pas un radar passif : son éventuel refus se
constate au moment d’une demande réelle.

Le corps doit être libre et au sol, à son bord. Les contrôles préexistants de
liens, contrats, projections, blessures et préparations restent appliqués. Les
engagements de décor sont également vérifiés : préparation payée, fil ou gomme
attachée, objet conservé dans Blinky, marques, copies, créatures contrôlées et
ancrages personnels. Une marque reste attachée à son propriétaire lorsque le
support a été réellement aspiré par Blinky ; changer de combattant ne la prête
pas à l’allié. Les feux existants sans propriétaire attribué retiennent les deux
corps tant que leur horloge active sur le terrain n’a pas été résolue.

Une information déjà perçue et la durée de vie déjà dépensée par Kurapika ne sont
pas des manifestations actives. Elles restent sur leur véritable corps, sans être
transférées à la réserve. Emperor Time actif continue d’interdire la sortie.
Les autres états différents du repos restent refusés de manière conservatrice.

L’allié marche vers l’adversaire, tente son léger ordinaire puis revient à pied.
Approche, tentative et retour sont affichés. Collisions, coûts, garde, portée,
interruption et vulnérabilité sont ceux du vrai duel. Un allié engagé ou entravé
reste en scène ; aucun délai ne force sa disparition. Sa mort élimine son stock,
après résolution de Cat’s Name si nécessaire, sans éliminer artificiellement son
leader en réserve. Le panneau attend cette résolution avant d’afficher le stock
comme éliminé. Les signataires de Moonlight restent les identités d’origine.

`teams/runtime.ts` garde les propriétaires des commandes en attente. Une commande
prévue pour un leader ne devient pas la frappe de son remplaçant. Pause, sortie et
nouvelle manche vident la file. Les commandes attendent une vraie frame de
simulation et les lots de trois frames produisent le même état que trois pas.

## Terrain physique du set

Les caisses neutres réelles conservent position, dégâts et présence entre les
combattants d’un set. Une caisse détruite ou aspirée ne réapparaît pas à l’entrée
suivante. Le placement initial des corps est ajusté par les collisions physiques
si une caisse déplacée occupe leur point d’entrée.

La frontière de manche ordinaire réinitialise les états de Nen du décor ; cette
règle de format est annoncée avant de jouer. La conservation physique ne prête
ni marque, fil, stockage, copie ou préparation au combattant suivant. Les duels
ordinaires gardent leur réinitialisation de terrain existante. Un nouveau set
retrouve le terrain initial.

Les dégâts de décor doivent être strictement positifs et finis. Une valeur nulle,
négative ou non finie ne peut plus soigner ou corrompre une caisse. Les frappes,
projectiles et capacités de terrain restent les applications existantes ; une
cible ou une préparation absente ne devient pas disponible grâce à l’équipe.

## Périmètre moteur

Le relais reste local et distinct d’une assistance simultanée à plusieurs corps.
Ces assistances exigeraient des cibles multiples, propriétaires indépendants,
collisions et perceptions par corps ainsi que des contrats adaptés. Ce lot
sécurise les interventions successives effectivement jouables. Les équipes ne
sont pas enregistrées par les replays à deux corps, la carrière ou le PvP.

## Vérifications

`teams/teams.test.ts` couvre les quarante entrées, les engagements de terrain
réellement produits, le stockage d’une caisse marquée, les coûts persistants,
la destruction conservée après une victoire physique, l’ordre sauvegardé et les
commandes à propriétaire stable. Les suites existantes d’équipes, d’arène et de
Nen restent les contrôles de régression.

## Résultats du 17 novembre 2026

La copie préparée du commit passe **156 tests ciblés** : 62 tests du lot,
49 tests existants d’équipes, 16 d’arène et les 29 tests solo de l’étape 7.
Ils incluent une véritable résolution de Cat’s Name, sans éliminer son stock
avant le verdict. Le contrôle navigateur passe les neuf vues FR/EN à 320,
390 et 1280 px, l’ordre sauvegardé, le relais au clavier, la destruction réelle,
une victoire et l’entrée suivante. Le contrôle existant de la phase 9 passe
également, avec son relais animé et ses essais de relecture et de classement.

La version de production répond en HTTP 200, charge la formation sauvegardée,
permet l’approche au clavier et le relais réel puis la pause à 390 et 320 px,
sans erreur JavaScript. Ces essais utilisent le rendu de secours : ni GPU ni
manette Xbox physique ne sont qualifiés par ce lot.

Les 17 tâches de typage globales passent. La dernière vérification web trouve
zéro erreur et les quatre avertissements préexistants d’Infiltration. Le lint des
fichiers du lot et les 23 tests du cliquet et des contrôles documentaires passent.
La compilation Node de production passe ; le plus gros bloc client mesure
425 029 octets, sous la limite inchangée de 500 000.

La suite globale n’est pas verte. `pnpm test` s’arrête sur le test de Voconte ;
la reprise avec `turbo test --continue=always` termine les autres tâches et
relève deux attentes anciennes de quatre usages pour ses trois actions, dans
`ability-modules` et `canon-compiler`. L’application web compte 10 571 réussites
et 7 835 échecs, principalement dans les hooks de Nen et les matrices de combos,
ainsi que des références de commandes et des tests de présentation hors du lot.
Les dix-neuf échecs de la neuvième série de combos et les deux attentes de Voconte
sont reproduits sur une copie du HEAD sans aucun changement de l’étape 8.

Le lint global de la première qualification relève cinq erreurs préexistantes : quatre consoles dans trois
scripts de capacités/cinématiques et une complexité excessive dans
`interactWithPreparation`. Il conserve aussi cinq avertissements de types hors
du lot. Aucune exemption ni limite de qualité n’est élargie par cette étape.

Le lot est repris sur `c8ffdd746` après le commit des cinématiques : les 156 tests
ciblés, les neuf vues navigateur et la compilation de production passent encore.
Le panneau ne prédit pas la présence d’un engagement de Nen caché ; ce point est
couvert par une régression comparant deux états publics identiques.
