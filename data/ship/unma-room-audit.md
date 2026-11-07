# Chambre de la reine Unma (Chambre 01) — fidélisation du chapitre 403

La chambre de la reine Unma (première reine de Kakin, mère de Benjamin et Tserriednich, mère biologique d'Halkenburg) reçoit le même traitement d'excellence que le salon du Roi Nasubi : relecture des cases, vérification de l'emprise partagée, et modélisation détaillée du mobilier d'apparat et de l'architecture intérieure. Source éditoriale : Yoshihiro Togashi / Shueisha, tome 39, chapitre 403.

## Cases relues et scénographie canonique

Le chapitre 403 dévoile l'intimité de la première reine dans la chambre 01 des quartiers royaux du Pont 1 (`tier-1-queens-living-quarters-room-01`) :

1. **Le salon privé lambrissé** :
   - Murs intégralement revêtus de boiseries sombres et de lambris d'inspiration classique.
   - Panneaux moulurés étagés avec encadrements soignés, cimaises et pilastres d'ornement.
   - Tableaux d'apparat encadrés de moulures dorées suspendus aux boiseries derrière et autour du fauteuil royal.

2. **Le grand fauteuil d'apparat sculpté et son salon** :
   - La reine Unma siège au centre de la pièce sur un fauteuil à haut dossier sculpté orné d'une crête ouvragée et garni d'étoffe sombre de velours capitonné.
   - De chaque côté du fauteuil se dresse un guéridon sculpté (bâbord et tribord) à fût tourné en balustre supportant des pièces de service.
   - En avant du fauteuil trône une table basse de salon rectangulaire sculptée à angles arrondis et piètement à volutes.

3. **La nursery attenante et la porte ouverte** :
   - En arrière-plan direct, une cloison intérieure sépare le salon de réception de la nursery privée.
   - Une large porte d'ébénisterie moulurée est maintenue grande ouverte, offrant une perspective directe sur le berceau en bois sculpté.
   - Le berceau de nursery comporte des montants tournés avec faîteaux et un mobile suspendu articulé d'éveil au-dessus de la literie d'enfant.
   - L'alcôve de repos de la reine avec son grand lit noble occupe la partie latérale en retrait.

## Architecture et mobilier détaillés

- **Boiseries et lambris d'ébénisterie** :
  - Plinthes moulurées, soubassements à panneaux en retrait et cimaise profilée courant sur les parois.
  - Moulures hautes et corniches de plafond à caissons et filets d'or.
  - Parquet d'assemblage en chevrons / marqueterie avec incrustations géométriques au sol.
- **Cloison intérieure de la nursery** :
  - Paroi intermédiaire délimitant le salon officiel et l'espace de puériculture.
  - Embrasure cintrée et porte battante ouverte avec chambranle sculpté à double ressaut.
- **Mobilier d'apparat de la reine Unma** :
  - Fauteuil sculpté : dossier haut chantourné, volutes d'accotoirs garnies, coussin généreux à boutons et piètement galbé.
  - Guéridons jumeaux : tablettes circulaires moulurées et pied tourné.
  - Table basse de salon : plateau chanfreiné, pieds galbés et ornementation de boiserie.
- **Mobilier de la nursery** :
  - Berceau en bois noble : montants d'angle sculptés, fuseaux réguliers, tête et pied cintrés, patins à berce et literie d'enfant.
  - Mobile d'éveil : fixation plafonnière, croisillons d'équilibre en laiton et suspensions de figurines géométriques suspendues au-dessus du berceau.
  - Lit royal : tête de lit capitonnée, boiserie sculptée et soieries.
- **Galerie de tableaux** :
  - Cadres dorés biseautés à coins d'écoinçon.
  - Compositions picturales stylisées originales (portraits dynastiques, paysages allégoriques).

## Cohérence technique et intégration à la visite

- **Intégration TierView** :
  - Décor attaché au nœud de la chambre 01 dans `TierView`.
  - Fusion géométrique sous `BanquetDetailBuilder` en 2 batches (surfaces opaques et points de lumière/dorures).
  - Strictement aucun ajout de source lumineuse Three.js permanente pour ne créer aucune fuite de lumière dans le pont.
  - Moins de 150 000 triangles et libération complète de toutes les géométries et matériaux GPU via `disposeBanquetDetails`.
  - Masquage automatique en mode analyse des structures (`reveal = true`).
- **Plan 2D et projection cartographique** :
  - Projection géométrique précise (`queenUnmaPlan.ts`) des cloisons, de la baie de nursery, du fauteuil, des guéridons, de la table basse et du berceau.
  - Ancrage d'occupant pour `unma-hui-guo-rou` positionnant fidèlement la première reine sur son fauteuil dans `roomAnchors.ts`.
  - Mise à jour du plan SVG local (`queens-living-quarters.svelte`) pour distinguer la chambre 01 de l'agencement générique des chambres 02 à 08.
- **Vues Manga scénarisées** :
  - Trois angles de caméra canoniques du chapitre 403 (`mangaQueenUnmaViews.ts`) :
    1. `unma-nursery-salon` : Plan principal du chapitre 403 montrant la reine Unma sur son fauteuil d'apparat avec l'ouverture sur la nursery et son berceau.
    2. `unma-salon-armchair` : Cadrage resserré sur le trône privé, les guéridons et la table basse.
    3. `unma-nursery-cot` : Vue plongeante sur le berceau en bois sculpté et le mobile suspendu.

## Limites d'interprétation

Les dimensions métriques exactes (11 × 30 m d'après l'emprise du bloc de 8 chambres), l'épaisseur exacte des boiseries, le motif précis des toiles peintes et les teintes exactes (acajou foncé, dorures laiton, velours prune/grenat) constituent une reconstitution fidèle et raisonnée à partir d'un dessin original en noir et blanc de Yoshihiro Togashi. Aucun fac-similé ou scan d'œuvre protégée n'est intégré dans le code.
