# Entrepôt sous contrôle Cha-R (Tier 5 — Chapitres 378, 379, 380)

L'organisation spatiale et la silhouette de l'entrepôt sont établies d'après le plan publié de la cale Cha-R, les scènes de confrontation des chapitres 378 à 380 et la case d'allée fournie : un volume de stockage colossal (112 m de long × 49 m de large sous 12 m de hauteur sous plafond), quadrillé de 32 travées de rayonnages d'archives chargés de cartons, flanqué d'un poste de garde d'accès, d'une caméra de vidéosurveillance posée après chargement, et marqué par la brèche du portail spatial de Luini.

Source éditoriale : Yoshihiro Togashi / Shueisha, tomes 36 et 37.
Chapitres 378, 379 et 380 chez VIZ / Shonen Jump.

## Relevé spatial et enveloppe canonique

- **Identifiant :** `tier-5-warehouse`
- **Pont :** Niveau 5 (Tier 5, catégorie stockage)
- **Emprise relevée :** 112,0 m × 49,0 m (X de -35,0 à 77,0 ; Z de -45,5 à 3,5)
- **Hauteur sous plafond :** 12,0 m
- **Sous-espaces :** 1 volume unifié de haute baie
- **Fonction narrative :** Base logistique avancée de la famille mafieuse Cha-R sur le pont 5. Dépôt des armes de contrebande de la Brigade Fantôme (Nobunaga, Phinks, Feitan) et théâtre du massacre des gardes par Luini (assassin Heil-Ly) utilisant sa capacité de téléportation spatiale.

## Mobilier et éléments architecturaux fidélisés

### 1. Charpente et éclairage de l'allée (`warehouseArchitecture.ts`)

- 7 fermes métalliques transversales peu profondes, avec arbalétriers inclinés, entrait horizontal et tirants verticaux comme dans la case.
- Pannes longitudinales fines et poteaux de rive prolongeant le rythme vertical des rayonnages.
- Lampes industrielles émaillées suspendues par une tige au-dessus des allées.
- Conduites apparentes courant sur le mur du fond puis descendant de part et d'autre de la double porte.
- Suppression des ponts roulants jaunes, crochets, gaines géantes et éclairages de terminal maritime absents de la case.

### 2. Dalle béton et marquages au sol (`warehouseFloor.ts`)

- Dalle industrielle haute charge en béton quartzé avec trame de joints de dilatation longitudinaux et transversaux.
- Plaques de roulement larmées en acier aux carrefours de manutention et au seuil d'accès de fret.
- Marquages normalisés de circulation : voies de circulation des engins de levage, bandes de danger jaune et noir, délimitation des baies de stockage (« BAY 01 » à « BAY 08 »).
- Traces narratives de l'assaut de Luini (Chapitres 378 et 380) : flaque de sang au poste de garde 2 et incisions de relevé dimensionnel au sol pour le calibrage de son portail spatial.

### 3. Les 32 travées de rayonnages (`warehouseCrates.ts`)

- Remplacement des 32 volumes primitifs (`tier-5-warehouse-crate-01` à `32`) par des rayonnages double face montant à 8,7 m.
- Sept niveaux par travée, divisés en cinq colonnes par des montants d'acier sombres et des lisses horizontales continues.
- Cartons de formats et teintes légèrement irréguliers, presque jointifs, avec porte-étiquette et fente de préhension sur chaque face visible.
- Panneaux bas ventilés et allées centrales dégagées pour conserver la perspective profonde de la case.
- Suppression des conteneurs ISO, fûts, palettes maritimes et caisses à renforts diagonaux qui ne correspondent pas à la référence.

### 4. Postes de garde et armoire aux armes (`warehouseGuardPost.ts`)

- 4 postes de contrôle d'accès (`tier-5-warehouse-guard-post-01` à `04`) encadrant l'allée d'entrée.
- Bureaux de magistrature / contrôle en acier avec sous-main en linoléum, moniteurs de vidéosurveillance CRT, claviers de commande et registres de dédouanement.
- Armoire blindée de sécurité où étaient entreposées les armes clandestines de Nobunaga, Phinks et Feitan (étui de katana, couteaux).
- Barrières mobiles de canalisation des flux de manutentionnaires.

### 5. Seuil d'accès, caméra post-chargement et portail Nen (`warehouseEntrance.ts`)

- Caméra de surveillance haute définition (`tier-5-warehouse-camera`) posée après le chargement du navire (précision explicite du plan du chapitre 380), dotée de son bras articulé, optique orientée vers le sas et voyant d'enregistrement actif.
- Grand volet roulant métallique sectionnel de 6 m de largeur pour le passage des cargaisons lourdes avec treuil manuel à chaîne.
- Porte arrière blindée verrouillée ayant empêché Luini de fuir vers l'arrière du pont.
- Brèche spatiale du portail Nen de Luini sur la paroi au-dessus du poste de garde avec halo de distorsion violet (`WAREHOUSE_PORTAL_VIOLET`).
