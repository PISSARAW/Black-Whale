# Appartement 1012 — Momoze

## Références relues

- **Chapitre 361, pages de lecture 18–19**, tome 35 : le cartouche « zone 12 »
  identifie le salon. Table rectangulaire, lampes à abat-jour, fleurs, sièges et
  grande plante à palmes ; Momoze reste dans un fauteuil rembourré courbe, un
  panier tressé posé au sol. Les panneaux à motifs, stries basses et bandes du
  sol sont visibles. La nourriture et l'ouvrage qu'elle tient appartiennent à
  l'action de la scène et ne sont pas fixés au mobilier vide.
- **Chapitre 366, page de lecture 2** : le cartouche 1012 surmonte le lit à
  baldaquin orné, aux quatre montants et rideaux fermés. Linge clair ample,
  deux oreillers, sol à larges bandes et panneaux muraux jusqu'au plafond.
- **Chapitre 368, page de lecture 3** : grille haute à lames horizontales et
  montant central, tête de lit chantournée capitonnée, deux oreillers et
  couverture froissée. Oito observe la chambre au moyen du cafard.
- **Chapitre 368, page de lecture 9** : rideaux ouverts et attachés aux
  montants, étoffes descendant autour du lit. Cet état permet l'inspection du
  mobilier sans reproduire les personnages ni l'agression.
- **Chapitre 368, page de lecture 2** : coupe distincte du 1012, sans cotes ni
  fonctions établies pour tous les petits compartiments. Elle ne correspond
  pas métriquement au découpage en huit espaces hérité par la visite.

Les pages comptent les images depuis le début du chapitre, indépendamment de
la pagination d'une édition reliée. Consultation :
[chapitre 361](https://www.scan-vf.net/hunter-x-hunter/chapitre-361),
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 368](https://www.scan-vf.net/hunter-x-hunter/chapitre-368).
Les scans de référence restent hors du dépôt.

La dernière page du **chapitre 367** montre d'abord le regard vers le salon de
Marayam ; la grille de Momoze est explicitement montrée au **368, page 3**.
L'ancienne vue `momoze-bedroom-vent` attribuait le passage dans cette grille à
l'assassin. Cette affirmation est retirée : la case établit l'observation par
le cafard, pas le trajet de l'assassin.

## Corrections

| Élément         | Reprise                                                                                                        | Limite                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Lit             | Cadre élargi, quatre montants tournés, corniche chantournée, lambrequin et rideaux plissés attachés            | État ouvert du chapitre 368 ; aucune dalle opaque ajoutée au toit                                                      |
| Tête de lit     | Profil courbe, bordure et capitonnage à boutons                                                                | Motifs originaux simplifiés ; intégré au lit, ancien bloc séparé supprimé                                              |
| Linge           | Deux oreillers, couverture claire froissée et retombées                                                        | État d'inspection vide, sans corps ni scène d'agression                                                                |
| Grille          | Deux champs à lames horizontales, traverse centrale, cadre près du mur                                         | Hauteur et placement métrique reconstitués ; lien historique d'inspection conservé                                     |
| Salon           | Table avec lampes et fleurs, deux sièges de réception, fauteuil courbe de Momoze, palmier et panier au sol     | Gabarits et implantation reconstitués à partir de perspectives différentes                                             |
| Ancien mobilier | Canapé remplacé par le fauteuil, table basse remplacée par la table de réception, ancien meuble latéral retiré | Aucun meuble générique doublant les éléments repris                                                                    |
| Téléphone       | Retiré de la chambre                                                                                           | Sa mention dans l'ancien dossier ne justifie ni ce modèle ni cet emplacement ; aucune case relue n'y montre le combiné |
| Enveloppe       | Panneaux à motifs, soubassement strié, petits ornements hauts et quadrillages du sol/plafond                   | Motifs procéduraux originaux ; teintes et essence du bois interprétées depuis le noir et blanc                         |
| Portes          | Modèle clair à panneaux biseautés partagé entre appartements                                                   | Communications et largeurs héritées conservées                                                                         |

Les lampes de table sont des objets sans éclairage ajouté à la scène. Les
inspections sont sans personnages et sans bête gardienne.

## Six pièces et plan reconstitués

Vestibule, salle à manger, cuisine, pièce du personnel, WC du personnel et salle
de bains reçoivent le mobilier détaillé du programme de visite. Une cuvette
complète la salle de bains. Ces six enveloppes et leur mobilier sont **`map`**,
avec une source qui annonce la reconstitution. Les deux meubles périphériques
non attestés de la chambre restent aussi **`map`**. Le salon et la chambre sont
**`panel`**, sans prétendre que leurs métriques proviennent des cases.

Le découpage parcourable en huit espaces est conservé : il ne constitue **pas
un relevé de la coupe du chapitre 368**. La carte locale 2D projette maintenant
les murs et les mêmes emprises de mobilier que la visite ; son titre et la vue
aérienne le signalent comme reconstitution. Le marqueur de Momoze est replacé
sur le lit de cette projection. Les collisions sont conservées lorsque les
maillages détaillés remplacent les blocs de rendu ; le mode de révélation garde
les volumes du plan.

## Contrôle visuel

Onze vues : `momoze-bedroom-canopy`, `momoze-bedroom-headboard`,
`momoze-bedroom-vent`, `momoze-living-table`, `momoze-living-armchair` et six
vues `-reconstruction`. Le lien historique de la grille reste valide.

Comparaison des captures aux cases relues : rapprochement de la caméra vers la
table, ajout d'un lambrequin visible au baldaquin et de plis sur les rideaux,
grille affinée contre le mur. Le cadrage général est décalé pour montrer le
lambrequin, et le tissu reste visible des deux côtés du baldaquin. Les six autres pièces sont contrôlées comme
reconstitutions. Captures avant/après et journaux hors versionnement dans
`test-results/momoze-apartment-visual/`.

## Vérifications techniques

- **154 tests ciblés réussis** : 1012, blueprint, vues manga, mobilier princier,
  portes, sols, apparence, carte et régressions Kacho/Fugetsu. Les quatre tests
  du 1012 et les douze tests de portes repassent après les dernières retouches.
- Blueprint de référence et blueprint avec les seules données du 1012 : zéro
  erreur ; maillages finis et bornés en hauteur, caméras sur sol libre, absence
  de lumière ajoutée et mêmes emprises de mobilier 2D/3D vérifiées.
- Onze captures sans erreur JavaScript, puis reprises des vues corrigées.
- **ESLint ciblé sans erreur** ; quatre contrôles de structure/documentation
  réussis, sans ajout d'exemption. **Compilation de production réussie**.
- Le contrôle de types global rencontre deux erreurs préexistantes `detailMode`
  dans `heillyHideoutView.ts` et son test, et trois avertissements de la page
  infiltration. Aucun diagnostic ne vise les fichiers du 1012.
