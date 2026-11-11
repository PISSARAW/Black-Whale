# Suite 1002 — Camilla, deuxième prince

Relecture du 11 novembre 2026 à partir des chapitres 366 et 389 de Yoshihiro
Togashi / Shueisha. Les finitions et objets sont des volumes originaux ; aucun
scan ni texture du manga n'est embarqué.

## Les trois scènes effectivement montrées

- **Repas avec Duazul, chapitre 366, page de lecture 14 (tome 35).** Deux
  personnes se font face aux extrémités d'une table rectangulaire nappée. Deux
  couverts, des verres hauts, des bougies courtes sur soucoupes et un bouquet
  bas occupent le plateau. Les dossiers des chaises sont hauts et encadrés.
- **Musse au bureau, chapitre 366, page de lecture 15.** Le soldat est assis dans
  un passage, devant un ordinateur portable ouvert et des papiers. Son oiseau
  appartient au Nen : cette case n'établit aucun perchoir physique ni poste
  téléphonique d'interception. Ces accessoires de la première version sont
  retirés. L'ancien identifiant `living-guard-desk` est conservé, mais le meuble
  appartient désormais au sous-espace d'entrée qu'il habille réellement.
- **Réunion des Intouchables, chapitre 389, pages de lecture 16–17 (tome 37).**
  Les gardes sont debout autour de Sarahell. Des sièges bordent les murs ; les
  panneaux moulurés, petits tableaux, meubles périphériques, plafond en retrait
  et lustre encadrent un centre dégagé. Les positions individuelles des gardes
  dans le modèle restent une reconstruction de ce rassemblement.
  Le meuble haut à sommet arqué près des doubles portes est restitué sans lui
  inventer de fonction ni de contenu. Sarahell fait face au groupe ; Fukataki,
  appelée après ce briefing, n'est pas placée dans les rangs de cette vue.

La comparaison à l'écran a corrigé l'orientation des deux convives et de Musse,
la hauteur des assises et la déformation des objets ronds sur la table
rectangulaire. Les assiettes, verres hauts et bougies restent circulaires ; le
bouquet bas comporte des roses et du feuillage. Le sol continu du salon ne
porte plus les joints métalliques du pont générique. Les doubles portes ont
des panneaux encadrés, plutôt que des vantaux d'or massif.
Le lustre modélisé porte aussi la source de l'éclairage calculé du salon : les
panneaux lumineux rectangulaires génériques ne se superposent plus à ce décor.

## Correction de la confusion avec la détention VVIP

La page de lecture 13 du chapitre 389 nomme explicitement les quartiers VVIP où
Camilla est retenue. La scène de toilette et de massage de cette page ne situe
pas une méridienne dans la suite 1002. Le modèle précédent ajoutait à tort une
chaise longue et quatorze coussins au sol, puis plaçait Camilla au milieu des
gardes du chapitre 389. Ces ajouts sont retirés. L'ancien angle
`camilla-massage-couch` est remplacé par une vue des parois du salon ; le lien
`camilla-untouchables-circle` est maintenu, avec un libellé et une mise en scène
corrigés. Camilla ne figure pas dans la réunion alors qu'elle est détenue.

Les tapisseries damassées, tapis à broderies d'or, parfums, carafe de vin et
lustre très bas au-dessus du repas n'étaient pas établis par les cases relues.
Ils ne sont plus présentés comme des détails certains de cet appartement.

## Plan, rendu et circulation

L'encart du chapitre 363, page de lecture 2, publie le plan des appartements
1002, 1004 et 1006 : les cloisons et le programme du 1002 gardent donc leur
provenance `panel`. Les cinq pièces sans perspective intérieure détaillée
reçoivent un mobilier reconstruit de provenance `map` : lit double et rangements,
cuisine en L, deux lits du personnel, WC séparé, baignoire et sanitaires. Les
finitions et dimensions ne sont pas établies par ce seul plan. Cinq points de
vue portent explicitement la mention « reconstitution » et restent sans
personnages. Le canapé et les meubles
périphériques du salon sont replacés hors du centre ; leur métrique et leur
identification détaillée restent reconstruites. Les sièges ne bouchent plus les
accès à la chambre et à la salle d'eau. La table et les deux chaises du repas,
le bureau et la chaise de Musse ainsi que les cadres ont des structures dans
le même plan que les collisions. Le plan 2D projette ces structures, au lieu
d'un cercle de coussins codé en dur.

Les détails se construisent depuis les structures du plan parcouru : un meuble
retiré, déplacé ou tourné par un Hatsu emporte tout son décor. Seul son volume
grossier est remplacé dans le rendu normal. La vue des provenances conserve
ce volume, sans ornements. Chaque pièce utilise deux lots maximum et aucune
nouvelle lumière permanente ; les ressources sont libérées avec le pont.
Les éléments courants des cinq pièces utilisent les mêmes constructeurs que
ceux du 1001, extraits sans changement de son rendu.

## Contrôle du rendu

Neuf captures relues dans `test-results/camilla-apartment-visual/` : les quatre
angles des scènes montrées, puis chambre, cuisine, pièce du personnel, WC du
personnel et salle de bains. Aucun échec JavaScript pendant ces navigations.
Les silhouettes et volumes sont comparés aux cases citées ; le mobilier des
cinq pièces privées est seulement contrôlé contre le plan et ses circulations.

Validation : 87 tests ciblés (Camilla, régression Benjamin, portes, sol, lumière,
finitions et vues manga), 13 contrôles de structure et documentation, ESLint
ciblé, compilation de production et contrôle de types sans erreur ni avertissement.
L'invariant global du navire signale sept anomalies dans le repaire Heil-Ly en
cours de modification ; aucune ne concerne le 1002, dont l'invariant filtré passe.

## Limites et références

La hauteur de quatre mètres, les dimensions et les positions métriques, le
nombre exact de sièges périphériques, le rythme des panneaux et la silhouette
simplifiée du lustre sont des estimations. La couleur de la moquette, des
boiseries et des tissus est interprétée d'après une source en noir et blanc.
Les sujets des petits tableaux et le détail des fleurs sont des interprétations
originales, pas des reproductions des œuvres dessinées.
Les silhouettes des personnages proviennent du catalogue existant ; les
gardes sans ressemblance déclarée conservent son uniforme et son visage
approximatifs. Le contrôle de la pièce ne vaut pas validation de ces costumes.

Consultation : [repas du chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366/14),
[bureau de Musse](https://www.scan-vf.net/hunter-x-hunter/chapitre-366/15),
[détention VVIP](https://www.scan-vf.net/hunter-x-hunter/chapitre-389/13),
[réunion des gardes](https://www.scan-vf.net/hunter-x-hunter/chapitre-389/16).
La source éditoriale reste Yoshihiro Togashi / Shueisha ;
[chapitre 389 chez VIZ](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-389/chapter/16685).
