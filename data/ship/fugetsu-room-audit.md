# Appartement 1011 — Fugetsu

## Références relues

- **Chapitre 366, page de lecture 3**, tome 35 : le cartouche 1011 identifie
  l'appartement. Lit large à colonnes, rideaux, linge clair froissé, albums,
  photographies éparses et boîte de mouchoirs sur la couverture. La vue haute
  montre le quadrillage au sol et le cadre orné du pied du lit.
- **Chapitre 374, page de lecture 9**, tome 36 : réveil numérique à
  **01 h 27**, mardi matin. Le support et son emplacement exact ne sont pas
  établis par ce gros plan ; ils restent reconstitués.
- **Chapitre 374, pages de lecture 10–11** : lit à rideaux et ample literie ;
  l'armoire à gauche présente des vitrages divisés en partie haute et des
  portes basses ornées. Les panneaux muraux, le soubassement strié et les
  bandes du sol sont visibles derrière les gardes.
- **Chapitre 368, page de lecture 2**, tome 35 : coupe du 1011. Elle ne cote
  pas les cloisons et ne permet pas d'attribuer une fonction à tous les petits
  compartiments visibles. Son découpage diffère de celui de la visite héritée.

Les pages comptent les images depuis le début du chapitre, indépendamment de
la pagination d'une édition reliée. Consultation :
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 368](https://www.scan-vf.net/hunter-x-hunter/chapitre-368),
[chapitre 374](https://www.scan-vf.net/hunter-x-hunter/chapitre-374).
Les scans de référence restent hors du dépôt.

## Corrections

| Élément         | Reprise                                                                                        | Limite                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Lit             | Cadre large, quatre colonnes, traverses fines, pied orné, oreillers et couverture froissée     | Dimensions interprétées ; pas de toit opaque ajouté au baldaquin                                          |
| Rideaux         | Fond plissé et pans latéraux ouverts                                                           | État ouvert du chapitre 366 ; la fermeture du chapitre 374 est un autre état de la scène                  |
| Souvenirs       | Albums, deux photos séparées et boîte de mouchoirs sur le linge                                | Silhouettes photographiques originales et simplifiées ; pas de scan reproduit                             |
| Ancien mobilier | Suppression du second chevet, des cadres photographiques debout et de la pile de livres au sol | Les identifiants historiques des deux groupes d'objets sont conservés pour les liens                      |
| Réveil          | Écran LCD statique à segments affichant 01:27                                                  | Le jour et AM restent dans la référence temporelle de la vue ; pas de lumière ajoutée ni d'horloge animée |
| Armoire         | Deux vantaux vitrés divisés, ornements bas et corniche                                         | Sculpture et croisillons simplifiés, emplacement métrique reconstitué                                     |
| Enveloppe       | Panneaux à motifs, stries basses, quadrillage du sol et du plafond                             | Motifs procéduraux originaux ; couleurs et essence du bois interprétées depuis le noir et blanc           |
| Portes          | Modèle clair à panneaux biseautés partagé entre appartements                                   | Communications et largeurs héritées conservées                                                            |

La porte en cœur et le tunnel de **Magical Worm** relèvent du Nen. Ils ne sont
pas transformés en passage architectural permanent. Les onze vues d'inspection
sont sans personnages et sans bête gardienne.

## Sept pièces et plan reconstitués

Vestibule, salon, salle à manger, cuisine, pièce du personnel, WC du personnel
et salle de bains reçoivent le mobilier détaillé du programme de visite. Une
cuvette complète la salle de bains. Ces sept enveloppes et leur mobilier sont
classés **`map`**, avec une source qui annonce la reconstitution. La chambre
reste **`panel`**, sans prétendre que ses dimensions ont été mesurées dans la case.

Le découpage parcourable en huit espaces est conservé. Il ne constitue **pas
un relevé métrique de la coupe du chapitre 368**. La carte locale 2D projette
maintenant les murs et les mêmes emprises de mobilier que la visite ; son titre
et la vue aérienne signalent cette reconstitution. Les marqueurs de Fugetsu et
Kacho sont replacés sur l'emprise du lit dans cette projection.

Les maillages détaillés remplacent les blocs de rendu tout en conservant les
collisions. Le mode de révélation continue d'utiliser les volumes du plan.

## Contrôle visuel

Onze vues : `fugetsu-bedroom-curtains`, `fugetsu-bedroom-keepsakes`,
`fugetsu-digital-clock`, `fugetsu-wardrobe` et les sept vues `-reconstruction`.
Les captures sont relues à côté des cases des chapitres 366 et 374 ; les autres
pièces sont contrôlées comme reconstitutions. La carte locale est aussi inspectée
sur la page du navire.

Le premier passage a conduit à rendre les plis des rideaux plus lisibles,
recentrer la caméra des souvenirs pour sortir une colonne du champ et préciser
les vitrages divisés de l'armoire. Captures avant/après et journaux conservés
hors versionnement dans `test-results/fugetsu-apartment-visual/`.

## Vérifications techniques

- **154 tests ciblés réussis**, dont les quatre tests du 1011 ; les quatre
  repassent après les dernières retouches du mobilier.
- Blueprint : zéro erreur sur le HEAD de référence et zéro sur ce HEAD avec
  les seules données du 1011 modifiées.
- Géométries finies et bornées en hauteur, caméras sur sol libre, collisions
  conservées, absence de lumière ajoutée et mêmes emprises de mobilier 2D/3D.
- Onze captures sans erreur JavaScript, puis reprises des vues corrigées.
- ESLint ciblé sans erreur, sans ajout d'exemption ; contrôles de structure et
  de documentation exécutés.
- Compilation de production réussie. Le contrôle de types global rencontre
  deux erreurs `detailMode` dans les fichiers Heilly modifiés en parallèle,
  hors du périmètre de ce commit, ainsi que trois avertissements préexistants
  de la page infiltration. Aucun diagnostic ne vise les fichiers du 1011.
