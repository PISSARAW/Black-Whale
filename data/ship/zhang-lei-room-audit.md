# Chambre 1003 — Prince Zhang Lei (salle à manger d'apparat) — fidélisation des chapitres 365 et 366

La salle à manger d'apparat de la chambre 1003 (Prince Zhang Lei, 3ᵉ prince de Kakin) reçoit le même traitement d'excellence que le salon du Roi Nasubi et la suite de la Reine Unma : relecture scrupuleuse des planches, vérification des emprises métriques dans le plan partagé, et modélisation détaillée du mobilier et de l'architecture intérieure. Source éditoriale : Yoshihiro Togashi / Shueisha, tomes 35 et 36, chapitres 365 et 366. [Édition officielle chez VIZ](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-365/chapter/16691).

## 1. Cases relues et scénographie canonique

Aux chapitres 365 et 366, le prince Zhang Lei reçoit en audience solennelle la reine Oito (tenant le prince nourrisson Woble dans ses bras), escortée de Kurapika et de sa suivante Shimanu :

1. **La très longue table en bois sculpté (`dining-table-07`)** :
   - Une imposante table d'ébénisterie rectangulaire (4,2 × 1,6 m) trône au centre de la salle d'audience.
   - Plateau épais en bois massif foncé aux chants chanfreinés et moulurés, supporté par un piètement robuste composé de balustres sculptés et de consoles à volutes reliées par une entretoise basse.
   - Un chemin de table d'apparat court sur l'axe longitudinal, soulignant la solennité de l'échange diplomatique.

2. **Les deux fauteuils d'apparat à haut dossier aux extrémités (`dining-chair-head` et `dining-chair-foot`)** :
   - Deux fauteuils cérémoniels jumeaux se font face aux deux extrémités de la table : le prince Zhang Lei siège au bout bâbord (`head`, `[3.2, -2.7]`), tandis que la reine Oito est installée au bout opposé (`foot`, `[8.8, -2.7]`).
   - Dossier rectangulaire très haut, se dressant verticalement et couronné d'une crête ouvragée à volutes baroques et fleuron central doré.
   - Garniture rembourrée en velours sombre capitonné à boutons d'or, accotoirs chantournés en bois verni et pieds tournés à sabot doré.

3. **La crédence d'apparat (`dining-credenza`)** :
   - Disposée le long du mur tribord (`[10.1, -3.3]`), cette crédence basse d'ébénisterie comporte des vantaux moulurés à panneaux en retrait, des tiroirs à ferrures et anneaux de tirage en bronze doré.
   - Son plateau supérieur accueille des pièces de vaisselle noble, des coupes et une carafe de cristal taillé pour le service des hôtes princiers.

4. **La statue sur sellette (`dining-statue-stand`)** :
   - Placée près de la crédence le long de la paroi tribord (`[10.05, -5.15]`), une sellette haute octogonale à montants moulurés élève une sculpture classique : un buste d'art en bronze patiné reposant sur un socle en pierre noble.

5. **Le guéridon d'entrée (`dining-pedestal-table`)** :
   - Positionné près du dégagement d'entrée (`[2.1, -4.9]`), un guéridon circulaire à plateau mouluré repose sur un fût central tourné en balustre et un piétement tripode galbé.

6. **Le haut candélabre à branches (`dining-candelabrum`)** :
   - Isolé dans le passage du chapitre 366 (`[9.8, -1]`), ce candélabre d'apparat en laiton et bronze doré s'élève sur un pied tripode mouluré. Son mât élancé se ramifie en branches curvascendantes portant des bobèches ciselées, des bougies de cire claire et des flammes chaudes lumineuses.

7. **Le grand cadre mural officiel (`dining-framed-document`)** :
   - Accroché sur le mur intérieur (`[3, -5.6]`), un grand cadre doré à moulures étagées présente une charte dynastique ou décret calligraphié sur parchemin patiné.

## 2. Architecture intérieure et ébénisterie

- **Lambris et boiseries d'inspiration classique** :
  - Plinthe haute moulurée au sol, cimaise profilée à mi-hauteur et corniche étagée sous plafond.
  - Panneaux muraux verticaux réguliers avec moulures en encadrement et filets d'or intérieurs.
- **Parquet en marqueterie** :
  - Assemblage géométrique au sol en damier et bandes de bois précieux, ceinturé d'une frise de bordure plus sombre.
- **Plafond à caissons** :
  - Caissons réguliers en léger relief, scandés de moulures transversales et de filets dorés en harmonie avec le mobilier d'apparat.
- **Portes et passages** :
  - Baies de communication vers le salon et la cuisine traitées avec des chambranles d'ébénisterie moulurés, des entablements classiques et des vantaux battants à poignées de bronze.

## 3. Cohérence technique et intégration à la visite

- **Intégration TierView** :
  - Décor attaché au nœud de la salle à manger 1003 (`tier-1-royal-residential-sector-room-1003-dining`) dans `TierView`.
  - Fusion géométrique sous `BanquetDetailBuilder` en 2 lots maximum (surfaces opaques et points de lumière/dorures).
  - Strictement aucun ajout de source lumineuse Three.js permanente pour préserver la performance et l'obscurité relative des pièces voisines.
  - Respect du budget : moins de 150 000 triangles et libération complète de toutes les ressources GPU via `disposeBanquetDetails`.
  - Masquage automatique en mode analyse des structures (`reveal = true`).
- **Plan 2D et projection cartographique** :
  - Module `zhangLeiPlan.ts` pour projeter fidèlement les cloisons, les ouvertures, la table, les deux fauteuils, la crédence, la sellette, le candélabre et le guéridon.
  - Ancrages canoniques d'audience dans `roomAnchors.ts` positionnant Zhang Lei (`prince-zhanglei`), la reine Oito (`queen-oito`) et Kurapika (`kurapika`).
  - Mise à jour du plan SVG local (`local/prince-apartment.svelte`) pour distinguer la chambre 1003 et représenter son aménagement d'apparat au lieu d'une table ordinaire.
- **Vues Manga scénarisées** :
  - Trois angles de caméra canoniques des chapitres 365 et 366 (`mangaZhangLeiViews.ts`) :
    1. `zhanglei-dining-audience` : Plan principal du chapitre 365 montrant l'audience solennelle à travers la longueur de la table sculptée, Zhang Lei faisant face à la reine Oito et Kurapika.
    2. `zhanglei-dining-statue-credenza` : Perspective cadrant la crédence d'ébénisterie, la statue sur sellette et le cadre officiel.
    3. `zhanglei-dining-candelabrum` : Cadrage atmosphérique du chapitre 366 centré sur le haut candélabre à branches et la table d'apparat.

## 4. Limites d'interprétation

L'emprise métrique (9 × 6 m), la hauteur sous plafond (4 m), le profil exact des balustres et sculptures, ainsi que les teintes exactes (acajou sombre, bronze, laiton patiné, velours vert impérial et or) constituent une reconstitution fidèle et raisonnée à partir du dessin original en noir et blanc de Yoshihiro Togashi. Aucun fac-similé ou scan d'œuvre protégée n'est intégré dans le code.
