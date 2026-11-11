# Tribunal central du niveau 3 — fidélisation du chapitre 359

## Source et limites

Référence géométrique : case de manga jointe par l’utilisateur le **11 novembre 2026**,
montrant Botobai au Tribunal central du niveau 3, **chapitre 359, tome 34**.
La page n’est pas identifiée. La reconstruction ne lui attribue donc ni pagination,
ni dimensions officielles, ni couleurs canoniques.

La case montre une pièce rectangulaire, le plafond et le sol quadrillés, des panneaux
muraux verticaux et une frise haute. Le magistrat imposant est assis sur un siège dont
l’assise et les pieds restent visibles. Un maillet à très long manche repose au sol,
à gauche du siège dans l’image. Deux pupitres sont décalés sur la droite : l’arrière est
plus large et plus haut ; l’avant est plus étroit et plus bas. Des tentures se trouvent
derrière cet ensemble. Une ouverture étroite apparaît sur la paroi gauche ; son au-delà
reste inconnu.

L’identification du chapitre est recoupée avec la [fiche du chapitre 359](https://hunterxhunter.fandom.com/wiki/Chapter_359)
et la [galerie du Black Whale](https://hunterxhunter.fandom.com/wiki/Black_Whale/Image_Gallery).
Ces références secondaires servent à l’attribution ; la case fournie est la source
directe de la disposition reconstruite.

Les gardes, le prévenu et les autres personnes visibles sont des présences de la scène.
Ils ne deviennent pas du mobilier ni des personnages permanents du plan. Le cartouche
blanc en haut à droite appartient à la mise en page du manga, pas à l’architecture.

## Corrections du plan et de la visite

Les six anciens volumes du tribunal représentaient une estrade, un grand comptoir devant
le magistrat, une table de greffiers, deux tables symétriques attribuées au parquet et à
la défense, et un box central. Cette disposition ne correspond pas à la case fournie.
Elle est remplacée par cinq volumes attestés : siège, maillet, deux pupitres et tentures.
Les noms des pupitres restent descriptifs, sans fonction judiciaire attribuée à tort.

La salle conserve son identifiant `tier-3-central-courthouse-courtroom` et son niveau
`interior-courthouse`. L’emprise extérieure du bâtiment sur le pont 3 ne change pas.
L’intérieur passe d’une halle de 24 × 18 × 8 m à une enveloppe compacte de
**12 × 10 × 4,2 m**, choisie pour restituer les proportions de la référence et permettre
la visite. Ces mesures sont des **estimations de reconstruction**. Le cadrage ne permet
pas de déterminer l’intégralité du plan ni les accès hors champ.

Le lien existant depuis le pont est conservé. Son point d’arrivée intérieur `[0, 4.2]`,
derrière l’espace d’audience, porte désormais la provenance `inferred` : la référence ne
montre pas cette entrée. Il ne sert pas de preuve d’une porte dessinée dans la case.

## Géométrie partagée

Coordonnées du repère local intérieur : le fond de l’image est vers `z` négatif.
Les dimensions et hauteurs suivantes sont estimées ; la présence et la disposition
relative des objets viennent de la case (`provenance: panel`).

| Suffixe d’identifiant | Élément                   | Centre `[x, z]` | Emprise `[x, z]` | Base | Hauteur |
| --------------------- | ------------------------- | --------------- | ---------------- | ---- | ------- |
| `seat`                | Siège dégagé du magistrat | `[-1.5, -2.4]`  | `[1.7, 1.3]`     | 0    | 1,15    |
| `gavel`               | Maillet à long manche     | `[-3.15, -1.9]` | `[0.8, 0.45]`    | 0    | 2,8     |
| `rear-desk`           | Pupitre arrière, à droite | `[3.1, -3.25]`  | `[3.8, 0.8]`     | 0    | 1,7     |
| `front-desk`          | Pupitre avant, à droite   | `[3, -1.55]`    | `[2.2, 0.9]`     | 0    | 1,15    |
| `curtain`             | Tentures du fond droit    | `[3.1, -4.75]`  | `[4.5, 0.24]`    | 0,12 | 3,85    |

Tous les identifiants commencent par `tier-3-central-courthouse-`. Le maillet emploie le
type géométrique existant `pillar` comme enveloppe de collision de son manche et de sa
tête ; il ne représente pas un pilier d’architecture. Les tentures emploient `painting`,
comme les autres tentures du blueprint. L’habillage détaillé donne à chaque volume sa
forme visible.

Le maillet est un **accessoire visible dans cette scène**, tenu par Botobai et posé au
sol. Sa représentation dans le modèle de référence ne documente pas sa présence à
d’autres moments du voyage. Les déplacements et accessoires personnels hors de cette
case restent à établir par la projection temporelle.

Le plan SVG projette directement le contour et les cinq structures de `blueprint.json`
via `apps/web/src/lib/components/map/projection/centralCourthousePlan.ts`. Un même facteur
de projection est utilisé pour les deux axes. Le dessin et la visite ne maintiennent donc
pas deux listes indépendantes de positions de meubles.

## Habillage et cadrage

`centralCourthouseView.ts` remplace les cinq boîtes de rendu par un siège à pieds
dégagés, un maillet à tête rectangulaire et manche long, des pupitres à panneaux et
des tentures plissées. Les collisions continuent à lire les mêmes cinq volumes.
Les murs reprennent les panneaux verticaux, le soubassement et la frise ; le plafond
et le sol reçoivent leur quadrillage. L’embrasure visible à gauche est évoquée par
un retrait fermé et son encadrement : aucun passage vers une salle inconnue n’est créé.

La vue `central-courthouse-hearing` du catalogue manga cadre la composition depuis
l’espace d’audience. Elle est accessible avec `/tour?mangaView=central-courthouse-hearing`.
Les présences restent celles de l’événement sélectionné ; le rendu architectural ne
crée aucun figurant et ne modifie ni la morphologie ni la trajectoire de Botobai.

L’habillage est assemblé dans un seul maillage, sans texture externe ni lumière
supplémentaire. Le mode preuves conserve les volumes et la provenance du blueprint.

## Points à vérifier

- L’accès mène à l’espace dégagé devant le siège et les pupitres.
- Les objets visibles conservent leurs volumes de collision dans la visite.
- Aucun comptoir ne masque le siège et aucune estrade ne relève le magistrat.
- Les deux pupitres restent à droite, décalés en profondeur et en hauteur.
- Les traductions FR/EN des sources, des noms et du plan signalent les mêmes limites.
- Les couleurs, le nombre de panneaux et la périodicité du quadrillage restent des
  choix de rendu ; ils ne sont pas déclarés comme des données canoniques.
