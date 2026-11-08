# Planque secrète Heil-Ly — fidélisation des chapitres 398, 399 et 407

La planque secrète de Morena Prudo et de la famille Heil-Ly reçoit le même traitement d'excellence que la salle de réception royale (`royalSalon`), la chambre funéraire (`burialChamber`) et la salle des fêtes (`banquet`) : relecture méthodique des cases de Yoshihiro Togashi, fidélisation architecturale et volumétrique, et modélisation détaillée attachée à la visite 3D du Black Whale.

Sources éditoriales : Yoshihiro Togashi / Shueisha, tome 38 (chapitres 398 et 399) et tome 39 (chapitres 407 à 410).

## 1. Salle de traitement / d'exécution (`tier-2-heilly-secret-hideout-processing`)

D'après le chapitre 398 (_Recherche_, p. 158–167) :

- **Faïence blanche intégrale** : soubassement carrelé en blanc stérile (`TILE_WHITE`), plinthes et joints fins de carreaux sanitaires étanches.
- **Barrière de Nen murale** : bandeau d'aura et circuits de glyphes protecteurs pourpres / violets luminescents (`0xa855f7` / `0xc084fc`) courant le long du périmètre mural et des angles verticaux, restituant la barrière étanche aux sons et aux émissions d'aura constatée par Hinrigh et Lynch.
- **Sept portes canoniques** :
  - Cinq portes alignées sur la cloison nord (desservant les 3 cabinets de toilette, la salle de bain et la cabine de douche).
  - Une porte sur la cloison ouest (placard et zone technique).
  - Une porte sur la cloison sud (accès au portail et liaison).
  - Chaque porte possède un chambranle d'acier sombre renforcé, une poignée chromée et une plaque signalétique.
- **Flexibles de douche muraux** : colonnes montantes verticales, mitigeurs thermostatiques, têtes de douche orientées et flexibles métalliques spiralés descendant jusqu'au sol.
- **Bondes de sol** : siphons circulaires en inox affleurant le carrelage avec fentes d'écoulement concentriques.
- **Étagères de maintenance ouvertes** : rayonnage métallique industriel à cinq niveaux chargé de bidons, détergents, flacons et fournitures d'assainissement.

## 2. Buanderie / Salle d'élimination (`tier-2-heilly-secret-hideout-laundry`)

D'après le chapitre 399 (_Expulsion_, p. 168–169) :

- **Batteries de lave-linge et sèche-linge industriels** : châssis cubiques d'acier blanc et gris, hublots circulaires vitrés cerclés de chrome avec tambours sombres, bandeaux supérieurs inclinés équipés de sélecteurs rotatifs, touches et témoins LED d'état, reliés à une gaine collectrice d'extraction supérieure.
- **Tables de travail centrales inox** : deux grandes tables métalliques de tri et de pliage avec plateaux brossés, pieds tubulaires et étagères basses contenant caisses et piles de linge plié.
- **Évier technique** : double bac profond en acier inoxydable avec robinet mélangeur à col-de-cygne chromé.
- **Casiers hauts** : vestiaires métalliques à trois portes avec ouïes d'aération et moraillons.
- **Étagères murales** : consoles métalliques chargées de cartons de lessive, bidons de solvants et linge préparé.

## 3. Salle commune (`tier-2-heilly-secret-hideout-communal`)

D'après le chapitre 399 (_Expulsion_, p. 170–175) :

- **Grande table centrale** : table de réunion massive en bois et stratifié sombre avec structure porteuse acier et chants biseautés.
- **Chaises multiples** : huit sièges ergonomiques de réunion disposés de part et d'autre de la table, avec assises et dossiers rembourrés montés sur piétements tubulaires.
- **Écrans de contrôle** : mur d'écrans de vidéosurveillance CCTV (matrice de 6 moniteurs à lueur cathodique / phosphore vert affichant les flux des coursives, équipés de voyants de veille et d'une régie de sélection).
- **Fontaine à eau** : bonbonne d'eau minérale translucide bleue de 5 gallons inversée sur distributeur réfrigéré à robinets chaud/froid.
- **Services techniques au plafond** : chemins de câbles suspendus en treillis d'acier galvanisé et tuyauteries industrielles apparentes.
- **Canapé et rangements** : banquette d'attente en cuir le long de la cloison.

## 4. Bureau de Morena Prudo (`tier-2-heilly-secret-hideout-office`)

D'après les chapitres 407 à 410 (_Négociation_) :

- **Bureau de la cheffe** : bureau exécutif en bois précieux sombre, caissons à tiroirs, sous-main, lampe de bureau en laiton et chemises de dossiers.
- **Fauteuil de direction** : fauteuil pivotant en cuir noir à haut dossier et accoudoirs.
- **Table de négociation** : table du jeu de cartes entre Morena Prudo et Borksen avec tapis feutré sombre, jeu de cartes, cartes distribuées et chaise d'invité en vis-à-vis.
- **Meuble console et grand téléviseur** : meuble bas sombre supportant le grand écran de télévision cathodique occupant le mur derrière Morena.
- **Consoles de jeu rétro** :
  - **Famicom** : coque blanc-crème et rouge bordeaux, fente avec cartouche de jeu, et ses deux manettes filaires rectangulaires rangées sur les flancs.
  - **Super Famicom** : coque grise profilée, touches éject/power, cartouche insérée et logo coloré.
- **Canapé mural** : canapé capitonné en cuir sombre faisant face à la table de négociation.

## 5. Couloir de bunker (`tier-2-heilly-secret-hideout-corridor`)

- Cadres de sas et linteaux d'acier reliant les pièces de la planque.
- Gaines de ventilation longitudinales et appliques industrielles grillagées au plafond.

## Cohérence et intégration technique

- Les éléments 3D sont regroupés via `BanquetDetailBuilder` en un maximum de deux lots (opaque et lumineux) sans ajouter de source lumineuse dynamique Three.js.
- `heillySurfacePlan` filtre les boîtes volumétriques grossières du blueprint en mode visite normale, évitant les conflits de profondeur tout en conservant 100% de la détection de collision physique du visiteur.
- En mode doctrine (`reveal: true`), les boîtes du blueprint réapparaissent avec leurs badges de provenance canonique.
- Au déchargement de la scène, `disposeBanquetDetails` libère l'intégralité des géométries et matériaux du GPU.
