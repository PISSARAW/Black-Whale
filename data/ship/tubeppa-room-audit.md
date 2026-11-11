# Appartement 1005 — Tubeppa

## Références relues

- **Chapitre 366, page de lecture 9**, tome 35 : façade 1005, puis bureau de
  Tubeppa vu de face, en plongée et depuis le côté. Le poste contient un
  ordinateur portable ouvert, une bouteille, une pile de dossiers et de petits
  objets de papeterie. Le siège a un dossier haut et des accoudoirs. Un panneau
  couvert de feuilles épinglées et un tableau blanc dense se trouvent côte à côte
  derrière le poste. Les lames du plancher et le soubassement sont visibles.
- **Chapitre 388, page de lecture 16**, tome 37 : même fond de tableaux derrière
  Tubeppa. La contre-vue vers Maor, Longhi et Rihan montre le registre supérieur
  des panneaux muraux à motifs et le plafond compartimenté. Elle ne justifie pas
  un laboratoire rempli de matériel expérimental.
- **Chapitre 363**, programme-type des appartements : conservation des huit pièces
  et de leurs communications. Ce plan ne fournit pas huit perspectives
  individuelles du mobilier de Tubeppa.

Les pages sont comptées depuis la première image du chapitre, distinctement de
la pagination d'une édition reliée. Liens de consultation :
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 388](https://www.scan-vf.net/hunter-x-hunter/chapitre-388).

## Corrections

| Élément        | Reprise                                                                                          | Limite                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Bureau         | Plateau clair, pieds fins, traverse ; poste orienté vers la pièce                                | Dimensions et implantation métrique reconstituées                                       |
| Ordinateur     | Socle, clavier, pavé tactile, écran côté Tubeppa, dos du couvercle côté visiteur                 | Aucun contenu informatique inventé                                                      |
| Objets         | Bouteille bouchée, dossiers empilés, carnet et crayon                                            | Petites formes et couleurs interprétées                                                 |
| Siège          | Dossier haut, accoudoirs, piètement à branches                                                   | Mécanisme exact du siège non établi                                                     |
| Tableaux       | Deux surfaces contiguës sur le même mur derrière le siège                                        | Ancien second tableau blanc supprimé ; plus de panneau isolé sur un mur perpendiculaire |
| Écriture       | Tracés vectoriels originaux, denses et approximatifs                                             | Aucune équation transcrite ou présentée comme lisible dans la source                    |
| Feuilles       | Formats variés, petits tracés et points d'attache                                                | Texte des notes non reconstitué                                                         |
| Architecture   | Encadrements clairs, motifs sombres, soubassement strié, plafond à caissons et lames de plancher | Motifs procéduraux et couleurs interprétés à partir du noir et blanc                    |
| Portes         | Réemploi du modèle clair à panneaux biseautés                                                    | Dimensions tirées du plan traversable                                                   |
| Personnage     | Position assise face au bureau ; lunettes rectangulaires et blouse claire                        | Coiffure et vêtement restent stylisés ; veste existante utilisée pour évoquer la blouse |
| Bête gardienne | Absente des inspections des cases du bureau                                                      | Suppression limitée au cadrage manga ; aucune modification des règles de Nen            |

La palette du catalogue de Tubeppa a également été corrigée : cheveux sombres,
lunettes et blouse claire visibles dans les deux chapitres, au lieu de la coupe
blonde sans lunettes et de la veste sombre. Les teintes restent déclarées comme
**choisies**, avec une vérification **partielle**.

## Sept autres pièces

Salle à manger, vestibule, chambre, cuisine, pièce du personnel, WC du personnel
et salle de bains emploient le mobilier détaillé partagé du programme-type. Les
positions, orientations et sanitaires sont repris selon les mêmes contraintes
que les appartements déjà audités. Le mobilier de ces pièces, ainsi que le
mobilier périphérique générique du salon, porte la provenance **`map`** et une
source française qui indique explicitement la reconstitution.

Le mobilier des pièces privées n'est donc pas revendiqué comme directement
visible dans une case de Tubeppa. Les cloisons et portes restent celles du plan
publié ; aucun passage ou équipement de laboratoire supplémentaire n'est ajouté.

## Intégration

- Les huit pièces ont un modèle détaillé. Les volumes simples correspondants
  sont retirés du rendu, tout en conservant le plan de collision d'origine.
- Le plan local 2D projette les mêmes emprises de mobilier que la visite.
- L'ancien lien `tubeppa-living-workstation` reste valide et cite désormais
  précisément la page 9 du chapitre 366.
- Trois vues complémentaires inspectent les objets du bureau, les tableaux et
  les panneaux muraux. Sept autres vues sont libellées « reconstitution ».
- Les vues de décor sont sans personnages. Le cadrage principal montre seulement
  Tubeppa ; les positions des autres intervenants ne sont pas inventées.

## Contrôle

Les captures sont conservées hors versionnement dans
`test-results/tubeppa-apartment-visual/`. Elles couvrent les onze vues :
`tubeppa-living-workstation`, `tubeppa-desk-objects`,
`tubeppa-research-boards`, `tubeppa-salon-panelling`, puis les sept pièces
reconstituées. Une image de l'ancien rendu est conservée dans `before/`.

Le test `tubeppaView.test.ts` contrôle les emprises, la provenance, le nombre et
l'alignement des tableaux, la suppression du tableau surnuméraire, la géométrie
finie, le budget de triangles, les hauteurs, l'absence de lumières ajoutées,
la suppression des anciens volumes, les onze positions de caméra, l'orientation
de Tubeppa et l'absence de la gardienne dans le cadrage de référence.

Vérifications : 129 tests ciblés passés (huit fichiers), puis 29 tests sur les
finitions, la ressemblance et le modèle de Tubeppa ; 13 contrôles du cliquet et
de documentation ; six tests de ressemblance après la correction du catalogue.
ESLint ciblé sans erreur. Le contrôle de types ne relève aucune erreur (trois
avertissements préexistants dans la page infiltration). Compilation de
production et adaptation Node réussies.
