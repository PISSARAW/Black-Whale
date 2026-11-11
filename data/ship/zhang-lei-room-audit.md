# Suite 1003 — Zhang Lei, troisième prince

Relecture du 11 novembre 2026 à partir du chapitre 365, pages de lecture 16–19
(tome 35), de Yoshihiro Togashi / Shueisha. Le chapitre 363 fournit le
programme-type des appartements. Le chapitre 390, page 1, confirme le fauteuil
et la présence de la bête gardienne ; il ne précise pas les sept autres pièces.
Les scans servent uniquement à la comparaison, sans texture ni fac-similé
embarqué dans le projet.

## Ce que montre l’audience

La page 16 présente la table rectangulaire sculptée, les deux fauteuils clairs
à dossier haut et crête chantournée, et le mur derrière Zhang Lei. On y voit une
crédence, une pendule ornementale, un grand paysage encadré, un petit document
encadré et une sculpture en pied sur une sellette. La précédente version
inversait la disposition du fond et transformait la sculpture en buste et le
grand paysage en décret officiel. Ces interprétations sont corrigées ; le
contenu du petit document reste illisible et n’est pas identifié.

Les pages 16, 17 et 19 montrent deux candélabres **sur le plateau**, avec des
pots à couvercle et des tasses. Le haut candélabre isolé au sol, le chemin de
table, la coupe de fruits, les carafes à vin et leur service de verres ajoutés
au premier modèle ne sont pas établis par ces cases et sont retirés. Les pieds
courbes et le tablier sculpté de la table remplacent les simples balustres.

Les parois ont des encadrements clairs et des panneaux à motifs sombres, avec
un soubassement finement strié. Les motifs procéduraux évoquent cette densité
sans recopier le dessin imprimé. Le sol clair comporte des lames et des bandes
sombres perpendiculaires ; le damier de cases de bois foncé et les joints de
pont génériques disparaissent. Le plafond à caissons précédemment présenté
comme certain n’est pas établi par la vue intérieure : la corniche suffit.
Les portes à panneaux moulurés restent une restitution simplifiée.

## Personnages et angles de contrôle

Zhang Lei et Oito font face à la table ; leurs orientations initiales étaient
inversées, comme celles de leurs fauteuils. La mise en scène précise aussi
Kurapika et les gardes, avec Woble dans la posture tenue au niveau des bras
d’Oito lorsque son poste est fourni par le catalogue. La roue gardienne,
lorsqu’elle est présente et autorisée par le cap de lecture, se trouve derrière
Zhang Lei comme à la page 18 ; cette correction ne crée aucune bête absente.
Les positions métriques restent reconstruites.

Les silhouettes et costumes restent ceux du catalogue existant : ce travail
sur la pièce ne valide pas leur ressemblance exacte aux personnages des cases.
L’angle principal est déplacé pour ne plus être masqué par un vantail ouvert.
L’angle de la sculpture et de la crédence est une inspection **sans personnages**
pour rendre visibles les objets autrement cachés par les gardes et la bête.
Les liens existants sont conservés, y compris celui du candélabre, dont la
référence est corrigée vers le chapitre 365, tome 35. Les pages 7–8 du chapitre
366 montrent d’autres princes et ne justifient pas son ancien candélabre au sol.

## Les sept autres pièces

Salon, vestibule, chambre, cuisine, pièce du personnel, WC du personnel et
salle de bains reçoivent un habillage parcourable du programme-type : canapé
et table basse, rangements, lit double, deux lits simples, cuisine en L,
baignoire, lavabo et WC séparés. Les cloisons du plan publié sont conservées.
Le mobilier détaillé porte la provenance `map` et ces sept points de vue
portent explicitement la mention « reconstitution ». Aucune perspective des
planches relues ne prouve leurs finitions ou leurs positions au centimètre.
Ces vues du plan restent sans personnages, y compris dans les pièces voisines.

## Cohérence du modèle

La carte locale projette les mêmes structures que la visite, au lieu de garder
une seconde disposition en SVG. Le volume grossier des meubles est masqué dans
le rendu normal, mais conservé pour les collisions et pour la vue des preuves.
Un objet déplacé ou supprimé emporte ses détails. Les candélabres, les pots et
la pendule ont leur propre support dans le plan. Les détails sont fusionnés en
deux lots maximum par pièce et n’ajoutent aucune lumière Three.js permanente.
Les sept pièces de reconstitution utilisent les constructeurs communs aux
appartements de Benjamin et Camilla.

## Contrôle visuel et validation

Dix vues ont été capturées et relues dans
`test-results/zhang-lei-apartment-visual/` : trois angles de la salle d’audience
et les sept pièces du programme-type. Les captures de l’état initial sont
conservées dans le sous-dossier `before/`. Le contrôle a notamment corrigé le
vantail masquant l’audience et les rebords du guéridon et des pots, qui étaient
dessinés verticalement. La vue sans personnages permet de contrôler la pendule,
les cadres, la crédence et la silhouette de la sculpture en pied.

Les navigations ne produisent aucune erreur JavaScript. Les 71 tests ciblés
passent, ainsi que les 13 contrôles de structure et documentation et l’invariant
global du plan. Les tests géométriques des huit pièces ont aussi été relancés
après la dernière correction des rebords. ESLint ciblé, compilation de production
et contrôle de types passent ; le typage ne signale aucun avertissement.

## Limites et références

La hauteur de quatre mètres, les dimensions, l’implantation dans le
programme-type, le rythme des motifs et les profils sculptés restent des
estimations. Les couleurs sont interprétées d’après des sources en noir et
blanc. Le paysage est une composition originale simplifiée ; aucune œuvre
identifiée ni aucun texte canonique n’est inventé pour les cadres.

Références de lecture : [audience du chapitre 365, page 16](https://www.scan-vf.net/hunter-x-hunter/chapitre-365/16),
[service de table, page 17](https://www.scan-vf.net/hunter-x-hunter/chapitre-365/17),
[roue gardienne, page 18](https://www.scan-vf.net/hunter-x-hunter/chapitre-365/18),
[vue du fond, page 19](https://www.scan-vf.net/hunter-x-hunter/chapitre-365/19),
[chapitre 390, page 1](https://www.scan-vf.net/hunter-x-hunter/chapitre-390/1).
Source éditoriale : Yoshihiro Togashi / Shueisha,
[chapitre 365 chez VIZ](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-365/chapter/16691).
