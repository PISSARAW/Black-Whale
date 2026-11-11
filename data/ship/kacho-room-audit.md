# Appartement 1010 — Kacho

## Références relues

- **Chapitre 366, page de lecture 4**, tome 35 : Kacho devant une grande table
  de repas rectangulaire, à bordure intérieure et piètement ouvragé. Deux
  sièges à haut dossier sont discernables. Le sol présente des lames et de
  larges bandes rectangulaires. Le repas jeté appartient à l'action de la scène.
- **Chapitre 376, pages de lecture 10–11**, tome 36 : poste d'étude, grand
  fauteuil rembourré, livre ouvert, calculatrice et bouteille. Le fond montre
  les panneaux muraux à motifs, le soubassement strié, de petits cadres
  supérieurs et le plafond compartimenté.
- **Chapitre 376, page de lecture 11** : cuisine en L, four et plaque sur le
  retour gauche, casserole à couvercle et hotte, placards bas et évier au fond,
  éléments hauts et réfrigérateur à droite. Le gros plan de la casserole et
  la vue d'ensemble appartiennent à cette même page.
- **Chapitre 363**, programme-type : distribution des huit pièces conservée.
  Les cinq autres pièces et le meuble périphérique du salon restent des
  reconstitutions signalées.

Les pages comptent les images depuis le début du chapitre, indépendamment de
la pagination d'une édition reliée. Consultation :
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 376](https://www.scan-vf.net/hunter-x-hunter/chapitre-376).

La relecture du [chapitre 374](https://www.scan-vf.net/hunter-x-hunter/chapitre-374),
pages 9–12, situe les scènes nocturnes dans la chambre de **Fugetsu**. Cette
séquence ne justifie pas la commode et le tabouret rond que l'ancien modèle
attribuait au salon de Kacho. Ils sont retirés ; aucun tunnel ni porte de Nen
n'est ajouté au 1010.

## Corrections

| Élément            | Reprise                                                                                                        | Limite                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Poste d'étude      | Table haute remplaçant la table basse et le canapé génériques ; grand fauteuil à dossier arrondi et accoudoirs | Gabarits et implantation métrique reconstitués                                                                             |
| Plateau de travail | Livre ouvert, calculatrice à écran et touches, bouteille à bouchon et outil d'écriture                         | Signes abstraits originaux, sans transcription des pages ni message en morse reproduit                                     |
| Salon              | Panneaux à motifs, stries basses, cadres supérieurs horizontaux et quadrillages du sol/plafond                 | Motifs procéduraux originaux ; meuble latéral non attesté conservé en `map`                                                |
| Cuisine            | Plan en L, retour de cuisson à gauche, arrière avec évier, réfrigérateur à droite                              | Dimensions et distances reconstituées à partir de la perspective                                                           |
| Meubles hauts      | Éléments relevés au-dessus du plan de travail                                                                  | L'ancien bloc au niveau du sol est corrigé                                                                                 |
| Cuisson            | Plaque, casserole couverte, four encastré, commandes et hotte                                                  | Pas de flamme ni vapeur animée, pas de marque inventée                                                                     |
| Placards bas       | Façades et poignées sous le plan, sans îlot central                                                            | Le morse évoque le rangement bas et son fond ; il ne précise pas une porte « à gauche ». Aucun contenu caché n'est inventé |
| Salle à manger     | Table rectangulaire à bordure et deux sièges à haut dossier                                                    | Les deux sièges discernables sont repris ; le compte complet et les métriques ne sont pas établis                          |
| Repas              | Plateau débarrassé pour l'inspection du mobilier                                                               | La nourriture jetée du chapitre 366 n'est pas un décor permanent                                                           |
| Portes             | Modèle clair à panneaux biseautés partagé avec les autres appartements                                         | Communications et largeurs du plan conservées                                                                              |

La cuisine est reconstruite dans l'orientation relative visible : cuisson à
**gauche**, évier et placards **au fond**, réfrigérateur à **droite**. Le retour
oriental et l'îlot central du modèle antérieur sont remplacés. Les deux grands
« tableaux » verticaux du salon deviennent les petits ornements horizontaux
visibles en hauteur. Les couleurs, l'essence du bois et les distances entre les
pièces ne sont pas des données attestées par le noir et blanc.

## Cinq pièces reconstituées

Chambre de Kacho, vestibule, pièce du personnel, WC du personnel et salle de
bains emploient le mobilier détaillé du programme-type. Leurs enveloppes sont
rattachées au **plan publié**, leur mobilier à la provenance **`map`**, avec une
source qui précise la reconstitution. La chambre de Kacho n'est pas meublée
d'après les scènes de Fugetsu. Une cuvette complète la salle de bains.

Les maillages détaillés remplacent les blocs de rendu sans retirer les
collisions. La carte locale 2D projette les mêmes emprises que la visite.

## Contrôle visuel

Onze vues : `kacho-living-homework`, `kacho-study-table`,
`kacho-kitchen-cabinet`, `kacho-kitchen-cooker`,
`kacho-kitchen-lower-cupboard`, `kacho-dining-table` et cinq vues
`-reconstruction`. Les deux anciens liens d'inspection restent valides. Toutes
les inspections sont sans personnages et sans bête gardienne.

Le contrôle initial a conduit à rapprocher la vue générale du poste d'étude,
replacer les cadres derrière le fauteuil et déplacer la caméra de cuisine
hors d'une feuille de porte ouverte. Les vues corrigées sont comparées aux
cases relues. Captures conservées hors versionnement dans
`test-results/kacho-apartment-visual/`, avec les anciens rendus dans `before/`.

## Vérifications techniques

- **136 tests ciblés réussis** : 1010, blueprint (58), vues manga, détails
  princiers, portes, sols, apparence des pièces et régressions des appartements
  1007 à 1009. Les quatre tests du 1010 repassent après le dernier cadrage.
- Validation du blueprint : zéro erreur sur le HEAD de référence et zéro sur
  ce HEAD avec les seules données du 1010 modifiées.
- Maillages finis et bornés en hauteur, caméras sur sol libre, collisions
  conservées, absence de lumière ajoutée et mêmes emprises en 2D/3D vérifiés.
- Captures des onze vues puis reprises après correction, sans erreur JavaScript.
- **ESLint ciblé sans erreur**, sans ajout d'exemption ; **13 contrôles de
  structure et de documentation réussis**.
- **Contrôle de types sans erreur**, avec trois avertissements préexistants de
  la page infiltration ; **compilation de production réussie**.

Le routage des palettes d'appartement passe par une liste ordonnée pour
accueillir le 1010 en respectant la borne de complexité. La priorité des
palettes existantes est conservée.
