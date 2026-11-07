# Réfectoire central — fidélisation des chapitres 371, 377 et 379-380

Le réfectoire central du Pont 5 reçoit le même traitement rigoureux que le banquet
inaugural du Pont 1 et le salon du Roi Nasubi : relecture approfondie des cases du
manga, conformité stricte avec le plan du navire et habillage volumétrique détaillé
attaché aux structures de la visite.

Sources éditoriales : Yoshihiro Togashi / Shueisha, tomes 34, 36 et 37 (chapitres 358,
371, 377, 378, 379 et 380).

## 1. Cases relues et volume architectural

- **Chapitre 358** : Mention du réfectoire central du niveau inférieur et de la taxe
  Buor prélevée sur les repas lors des franchissements de coursives.
- **Chapitre 371** : Vue d'ensemble du volume établissant la monumentalité de la salle :
  seul réfectoire du vaisseau pour la 5e classe, noir de monde à l'heure du repas.
  La charpente métallique de fermes triangulées, les passerelles techniques de
  maintenance et les gaines de ventilation massives justifient une hauteur sous
  plafond de 9 m (bien supérieure aux 4,5 m standard du pont 5).
- **Chapitre 377** : Réunion des dix survivants de la Brigade Fantôme (Chrollo, Machi,
  Nobunaga, Feitan, Phinks, Shizuku, Franklin, Bonolenov, Illumi, Kalluto) sur l'une
  des plateformes centrales surélevées face aux membres de la famille mafieuse Cha-R.
  Description visuelle du comptoir de service continu le long du mur Ouest, surmonté
  de panneaux de menu et bordé de tabourets ; présence de 4 piliers centraux massifs
  en acier riveté ; disposition de tables basses et bancs selon deux orientations.
- **Chapitre 378 (« Équilibre »)** : Vue en plongée isométrique du comptoir de service Ouest
  et gros plan canonique sur le plateau-repas de 5e classe :
  - Plateau garni d'une **boîte burger en carton ouverte à clapet (*clamshell box*)**
    contenant un hamburger complet, un gobelet à paille et une coupelle de sauce/salade.
    Ce repas industriel de cafétéria s'oppose thématiquement au tournedos et verre à pied
    de Morena Prudo en 2e classe.
  - Comptoir garni de **bacs gastronormes chauffants (bains-marie)**, d'un écran pare-haleine
    vitré, d'un haut-parleur mural de sonorisation, d'un grand panneau vertical de tarifs
    et d'une colonne de ventilation verticale descendant le long du mur.
- **Chapitres 379–380** : Franklin assis seul à une table de coin face au mur Est,
  à proximité des distributeurs automatiques de boissons, dégustant son repas tout
  en attendant l'arrivée d'Hisoka, les mains prêtes.

## 2. Architecture et aménagements détaillés

- **Charpente et plafond industriel** :
  - Série de fermes métalliques triangulées (open-web steel trusses) transversales
    rythmant les 31,5 m de portée entre 7,8 m et 8,8 m de hauteur.
  - Passerelles techniques longitudinales (catwalks) suspendues avec platelages en
    caillebotis et garde-corps tubulaires.
  - Habillage des gaines de ventilation avant et arrière (`duct-forward`, `duct-aft`)
    avec brides de raccordement, suspensions d'ancrage et grilles de soufflage.
  - Suspensions industrielles à cage métallique protégeant des ampoules à lumière
    chaude, réparties sous les poutres principales.
- **Piliers structuraux** :
  - Les 4 piliers carrés centraux sont renforcés par des embases évasées rivetées et
    des corbeaux structurels en tête soutenant les fermes maîtresses.
  - Plinthe industrielle de protection en tôle larmée le long des cloisons.
- **Comptoir de distribution, tabourets et dépose-plateaux** :
  - Comptoir de service continu Ouest (`service-counter`) de 25 m : plateau en acier
    inoxydable, glissières de guidage à trois barres pour plateaux repas (tray slides),
    façade renforcée et vitrines de protection hygiénique.
  - Ligne de tabourets fixes sur piétement chromé avec assise sombre le long de la travée
    clients du comptoir.
  - Meubles inox de dépose de plateaux repas et goulottes vide-ordures aux deux extrémités
    du comptoir.
  - Panneaux de menu rétro-éclairés (`menu-board`) suspendus au-dessus du comptoir,
    découpés en registres lisibles.
- **Passages et seuils de coursives (taxe Buor)** :
  - Bornes de guidage et pupitre de contrôle aux seuils des coursives Nord et Sud
    matérialisant le poste de perception de la taxe Buor (chapitre 358).
  - Chemins de câbles électriques industriels longitudinaux suspendus sous les fermes.
- **Distributeurs automatiques (vending machines)** :
  - Batterie de distributeurs automatiques sur le mur Est (`dispensers`) : carrosseries
    sombres, vitrines de sélection lumineuses, fentes de paiement et réceptacles.
- **Tables, bancs et vie du réfectoire** :
  - Estrades centrales VIP (`platform-north`, `platform-south`) : encadrement avec
    marche biseautée, tables entourées de bancs sur quatre faces et garnies de plateaux
    repas, bols de ramen/bouillon, gobelets, baguettes, théière centrale, coupes en
    céramique pour les membres de la Brigade et ménagère de condiments.
  - Table isolée de Franklin (`franklin-table`) : plateau de cantine, grande chope,
    ménagère et bancs face aux distributeurs.
  - Tables communes et bancs : piètements tubulaires métalliques, plateaux stratifiés
    à chants protégés, vaisselle collective et ménagères de condiments (shoyu, sel,
    serviettes) réparties le long des travées.

## 3. Cohérence avec le banquet et le salon royal

- Le décor est rattaché au groupe de la salle dans `TierView`.
- Il utilise le constructeur fusionné `BanquetDetailBuilder` :
  - Exactement deux appels de rendu (surfaces opaques Lambert + éléments émissifs Basic).
  - Budget de rendu strictement inférieur à 150 000 triangles.
  - Aucune source lumineuse Three.js dynamique supplémentaire susceptible de fuiter.
- Respect du mode preuve (`reveal`) : les fioritures architecturales s'effacent pour
  rendre compte uniquement de la doctrine documentaire.
- Libération intégrale des géométries et matériaux avec `disposeBanquetDetails`.
- Projection cartographique unifiée 2D (`diningHallPlan.ts`, `central-dining-hall.svelte`,
  `roomAnchors.ts`) calquée sur l'architecture de `banquetPlan` et `royalSalonPlan`,
  garantissant une cohérence parfaite des ancres de personnages et du mobilier.

## 4. Limites

Les teintes métalliques, stratifiées et plastiques interprètent les nuances du manga
noir et blanc. Les géométries procédurales sont simplifiées pour garantir une fluidité
à 60 images par seconde lors de la déambulation. Aucun scan ni texture raster n'est
incorporé, préservant la souveraineté du moteur vectoriel et géométrique du projet.
