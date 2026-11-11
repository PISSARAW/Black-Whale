# Appartement 1007 — Luzurus

## Références relues

- **Chapitre 366, page de lecture 7**, tome 35 : Luzurus et Basho discutent autour
  d'un narguilé, de tables basses et de coussins. La vue en plongée montre le
  mobilier bas et le tapis ; elle ne démontre pas l'estrade de 15 cm que le modèle
  présentait comme du tatami. Une assise capitonnée et de grands cadres sont
  visibles dans la même page.
- **Chapitre 386, page de lecture 8**, tome 37 : trois perspectives du salon.
  Télévision, sièges rembourrés à bras roulés, tables chargées de bouteilles et de
  petits objets, étagères ouvertes remplies, plantes feuillues et grands cadres.
  Derrière Luzurus, un grand panneau à traits peints. Les murs ont des panneaux
  à motifs, un soubassement strié et un registre supérieur de petits cadres ;
  le sol est quadrillé de bandes sombres et le plafond compartimenté.
- **Chapitre 389, page de lecture 11**, tome 37 : façade 1007 et discussion de
  l'incident au seuil. Cette page ne fournit pas une nouvelle perspective
  détaillée de chaque pièce privée. Elle ne sert pas à inventer leur décor.
- **Chapitre 363**, programme-type publié : cloisons et communications des huit
  pièces conservées, avec leur géométrie locale antérieure.

Les pages sont comptées depuis la première image du chapitre, distinctement de
la pagination d'une édition reliée. Consultation :
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 386](https://www.scan-vf.net/hunter-x-hunter/chapitre-386),
[chapitre 389](https://www.scan-vf.net/hunter-x-hunter/chapitre-389).

## Corrections du salon

| Élément        | Reprise                                                                     | Limite                                                                                      |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Assises        | Volumes profonds, bras roulés, coussins et boutons de capitonnage           | Gabarits et positions métriques reconstitués                                                |
| Télévision     | Grand écran encadré, tourné vers le groupe d'assises                        | Image originale simplifiée de spectacle ; ni photogramme copié, ni programme identifié      |
| Rayonnages     | Deux ensembles ouverts, tablettes, livres, récipients et petits objets      | Contenu approximatif ; aucune marque ou collection inventée                                 |
| Tables         | Plateaux bas, pieds et bouteilles avec bagues et étiquettes neutres         | Nature des liquides non affirmée                                                            |
| Plantes        | Feuillage en pot, au lieu des anciennes boules de topiaire                  | Espèces et teintes interprétées ; une plante déplacée hors de la porte de la salle à manger |
| Cadres         | Images abstraites et grand fond à traits peints derrière le siège principal | Aucune inscription, œuvre ou identité attribuée aux tableaux                                |
| Murs           | Panneaux à motifs, stries basses et cartouches supérieurs                   | Motifs procéduraux originaux, sans texture tirée des scans                                  |
| Sol et plafond | Quadrillage rectangulaire sombre et trame de plafond                        | Espacement et dimensions interprétés à partir des perspectives                              |
| Portes         | Modèle clair à panneaux biseautés, réemployé de la suite d'entraînement     | Communications et largeurs conservées                                                       |
| Coin narguilé  | Table basse, coussins au sol, récipient, tige et tuyau                      | Ancienne estrade supprimée ; tapis affleurant non bloquant                                  |

Le lien `luzurus-smoking-area` reste valide mais cite désormais la page 7 du
chapitre **366**, au lieu de présenter le chapitre 359 comme preuve de tatamis
surélevés. Le lien `luzurus-living-sofa` cite précisément le chapitre **386**,
page 8, au lieu d'une référence générale au chapitre 362.

Le coin bas du chapitre 366 et l'agencement du salon du chapitre 386 sont
**juxtaposés dans une implantation reconstituée** du programme-type. Les cases
ne donnent pas un relevé commun permettant d'en fixer la distance ou la position
exacte. Le modèle ne prétend donc pas reproduire le déplacement des meubles
entre ces deux moments. Les couleurs, l'essence du bois, les motifs textiles et
les contenus des bouteilles ne sont pas des faits attestés par le noir et blanc.

## Sept pièces privées

Salle à manger, vestibule, chambre du prince, cuisine, pièce du personnel, WC du
personnel et salle de bains emploient le mobilier détaillé partagé du
programme-type. Leur mobilier porte la provenance **`map`** avec une source
française signalant explicitement la reconstitution. Les sanitaires comprennent
la cuvette de la salle de bains ; les orientations sont ajustées pour dégager
les accès.

Le modèle remplace les anciens blocs de rendu sans retirer les collisions des
meubles. L'ancien volume `living-smoking-platform` est supprimé ; le tapis est
une finition de surface. La carte 2D projette les mêmes emprises de mobilier que
la visite, en remplacement du dessin indépendant du salon.

## Contrôle visuel

Onze vues : `luzurus-living-sofa`, `luzurus-smoking-area`,
`luzurus-television-lounge`, `luzurus-salon-panelling`, et les sept vues dont le
titre porte « reconstitution ». Les inspections sont sans personnages et sans
bête gardienne pour examiner le décor. Aucun participant ou effet de Nen
supplémentaire n'est créé.

La caméra principale est déplacée après contrôle pour éviter de couper dans une
feuille de porte. Les captures avant/après sont conservées hors versionnement
dans `test-results/luzurus-apartment-visual/`, avec l'ancien rendu dans `before/`.

## Vérifications techniques

- Les tests du modèle de Luzurus, des vues manga, des détails princiers, des
  portes, des sols, de Tyson, de Tubeppa et les **58 tests du blueprint** passent.
  Le passage global donne **127 tests passés et deux échecs** : les deux
  assertions préexistantes du nombre de lieux dans `roomAppearance.test.ts`
  (63 au lieu de 62, 36 au lieu de 35 au pont 1), liées au chantier du casino.
- Le HEAD de référence et ce HEAD avec les seules données du 1007 modifiées
  retournent tous deux zéro erreur de validation du blueprint.
- Les **13 contrôles du cliquet, de documentation et des silhouettes** passent.
- **ESLint ciblé** sans erreur, sans ajout d'exemption.
- **Contrôle de types** sans erreur, avec les trois avertissements préexistants
  de la page infiltration. Compilation de production réussie.
- Un dernier passage vérifie les caméras et la géométrie après retournement des
  tableaux vers l'intérieur et continuité du dossier des canapés.
