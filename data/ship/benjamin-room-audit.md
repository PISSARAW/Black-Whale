# Chambre 1001 (Prince Benjamin) — fidélisation des chapitres 362, 363 et 366

Le salon de réception et quartier général du 1er Prince Benjamin reçoit le même traitement
d'excellence et de rigueur que le salon du Roi Nasubi et la chambre de la reine Unma :
relecture méticuleuse des cases du manga, respect strict des emprises du plan partagé, et
habillage volumétrique détaillé rattaché aux objets de la visite.

Sources éditoriales : Yoshihiro Togashi / Shueisha, tomes 35 et 36 (chapitres 362, 363 et 366).
[Édition officielle chez VIZ](https://www.viz.com/shonenjump/chapters/hunter-x-hunter).

## 1. Cases relues et scénographie canonique

Les chapitres 362, 363 et 366 établissent l'espace de vie et de commandement du premier prince de
Kakin dans la chambre 1001 du secteur résidentiel royal (`tier-1-royal-residential-sector-room-1001-living`) :

1. **Le salon de réception austère et martial (chapitres 362 et 363)** :
   - Contrairement aux suites princières dotées d'un aménagement de repos civil ou mondain, la
     pièce principale de Benjamin est dépouillée de tout superflu.
   - Les cloisons sont habillées de boiseries sombres et de pilastres sobres, couronnées par un
     plafond à caissons et solives transversales sombres.
   - Un parquet militaire rectiligne et des plinthes renforcées structurent la pièce.

2. **Le grand tableau mural monumental (chapitres 362 et 363)** :
   - En arrière-plan de l'espace de commandement, le mur du fond est dominé par un grand tableau
     d'apparat (`tier-1-royal-residential-sector-room-1001-living-reception-painting`).
   - Cette toile imposante, enserrée dans un cadre mouluré lourd en bronze patiné et bois noble,
     illustre une fresque héroïque martiale et dynastique (cavalerie, bannières et ciel tourmenté).
   - Togashi cadre expressément le discours solennel de Benjamin à ses troupes sous la domination
     visuelle de cette toile.

3. **L'alignement des soldats au garde-à-vous (chapitres 362 et 363)** :
   - Face au prince, ses soldats et officiers de la garde privée se tiennent immobiles en deux rangs
     parfaitement ordonnés au garde-à-vous.
   - Leur tenue d'apparat reflète la discipline de fer de l'armée de Kakin : vareuse militaire sombre
     à col montant, épaulettes droites, double rangée de boutons métalliques, ceinturon à boucle,
     pantalon à pli et casquette militaire à visière d'officier.

4. **Le poste de commandement téléphonique et Balsamilco (chapitre 366)** :
   - À proximité immédiate de l'accès aux appartements privés de Benjamin, un meuble console
     accueille le téléphone de commandement (`tier-1-royal-residential-sector-room-1001-living-telephone`).
   - Le capitaine Balsamilco, éminence grise et chef d'état-major du prince, s'y tient en permanence
     pour centraliser les communications avec les gardes envoyés infiltrer les suites des autres
     princes (Vincent, Babimyna, Furykov, etc.).
   - Furykov y monte également la garde en faction dans le salon de réception.

## 2. Architecture et mobilier modélisés

- **Enveloppe et boiseries militaires** :
  - Plafond à poutres apparentes et caissons rectangulaires en noyer sombre.
  - Plinthes biseautées, lambris bas à panneaux en retrait et corniches d'architrave.
  - Pilastres verticaux rythmant les parois et encadrant les embrasures.
  - Appliques murales à déflecteur en laiton sombre.
- **Grand tableau mural (`tier-1-royal-residential-sector-room-1001-living-reception-painting`)** :
  - Châssis architectural à moulures biseautées et écoinçons en bronze.
  - Composition en bas-relief procédural figurant une charge de cavalerie et des étendards sous un ciel d'orage.
  - Respect scrupuleux de l'interdiction de textures matricielles ou de scans manga.
- **Poste téléphonique de commandement (`tier-1-royal-residential-sector-room-1001-living-telephone`)** :
  - Pupitre lourd en chêne massif et garnitures métalliques d'angle.
  - Boîtier téléphonique d'état-major avec platine, touches/cadran, combiné et cordon spiralé.
  - Râtelier de transmission et classeurs tactiques.
- **Soldats de la garde privée** :
  - Deux rangées de gardes en posture d'honneur stricte au garde-à-vous (garde-à-vous réglementaire :
    talons joints, buste droit, bras le long des cuisses, regard horizontal).
  - Vareuses à col officier fermé, baudrier, casquette rigide à visière et insigne de Kakin.
- **Estrade et pupitre tactique de Benjamin** :
  - Démarcation d'autorité au sol matérialisant l'axe de commandement face aux rangs de gardes.

## 3. Cohérence technique et intégration à la visite

- **Intégration TierView** :
  - Décor attaché au nœud de la pièce dans `TierView`.
  - Fusion géométrique sous `BanquetDetailBuilder` en 2 batches maximum (surfaces opaques Lambert
    et accents lumineux/métalliques).
  - Triangle budget strictement inférieur à 150 000 triangles (moins de 35 000 triangles requis).
  - Zéro source lumineuse Three.js dynamique additionnelle.
  - Mode documentaire respecté (`reveal: true`) : effacement strict des détails de reconstitution.
  - Libération intégrale des géométries et matériaux avec `disposeBanquetDetails`.
  - Filtrage `benjaminSurfacePlan` omettant le mobilier civil générique (`seat-04`, `table-05`,
    `cabinet-06`) du plan-type en mode visite standard.
- **Plan local 2D et cartographie** :
  - Fichier de projection dédié `benjaminRoomPlan.ts` calculant les positions exactes des fixtures.
  - Ancrage des personnages dans `roomAnchors.ts` (`prince-benjamin`, `balsamilco-might`, `furykov`).
  - Plan SVG enrichi dans `prince-apartment.svelte` pour la chambre 1001.
- **Vues Manga canoniques** :
  - Trois cadrages issus des tomes 35 et 36 avec `MangaCastStaging` complet :
    1. `benjamin-living-guards` (chapitre 362) : plan large sur la ligne de soldats et Benjamin.
    2. `benjamin-living-mural` (chapitre 363) : Benjamin devant la fresque monumentale.
    3. `benjamin-living-telephone` (chapitre 366) : Balsamilco au téléphone de commandement.

## 4. Limites d'interprétation

Les dimensions métriques précises de la pièce (21 × 8,4 m dans le plan type), l'épaisseur des
moulures, les motifs exacts des armoiries militaires et les teintes sombres (vert-de-gris martial,
bronze patiné, chêne fumé) constituent une interprétation respectueuse à partir des cases noir et blanc
de Togashi. Aucun matériau sous droit d'auteur n'est introduit dans le dépôt.
