# Appartement 1014 — Woble

## Références relues

- **Chapitre 359, page de lecture 8**, tome 34 : compartiment de Woody,
  cuvette à abattant ouvert et porte-papier mural, sol carrelé et murs simples.
  Cela ne confirme pas la baignoire ni le lavabo du programme de visite.
- **Chapitre 360, page 1** : table carrée portant deux petites sculptures
  drapées, fauteuil canné, armoire vitrée et une sellette séparée. Sol à bandes
  rectangulaires sombres. **Page 6** : grande table ouvragée, fleurs et sièges
  hauts. **Pages 14–17** : téléphone, vitrages des meubles et lit à rideaux.
- **Chapitre 367, page 1**, tome 35 : plan de travail droit, bouteilles,
  placards hauts vitrés, rangements bas et plancher. Aucun îlot central ni
  plaque de cuisson non montrée n'est ajouté.
- **Chapitre 371, pages 3–5**, tome 36 : espace dégagé du cours de Nen ; Woble
  dans le grand lit auprès d'Oito, colonnes, rideaux ouverts attachés et
  lambrequin festonné ; grande table continue, fleurs et plateaux-repas.
  Ces cases n'établissent pas deux tables parallèles séparées ni un berceau.
- **Chapitre 368, page 2** : coupe non cotée du 1014, différente du découpage
  parcourable hérité. Les huit espaces de la visite sont conservés et leur
  implantation reste explicitement une reconstitution.

Les pages comptent les images depuis le début du chapitre. Consultation :
[359](https://www.scan-vf.net/hunter-x-hunter/chapitre-359),
[360](https://www.scan-vf.net/hunter-x-hunter/chapitre-360),
[367](https://www.scan-vf.net/hunter-x-hunter/chapitre-367),
[368](https://www.scan-vf.net/hunter-x-hunter/chapitre-368),
[371](https://www.scan-vf.net/hunter-x-hunter/chapitre-371).
Les scans de référence restent hors du dépôt.

## Corrections et limites

| Élément               | Reprise                                                                                                                                | Limite                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Salon                 | Table carrée, deux sculptures sur le plateau, une sellette, fauteuil canné, armoire vitrée, téléphone avec combiné et cordon, tableaux | Sculptures et ornements simplifiés ; implantation et couleurs interprétées             |
| Cours de Nen          | Suppression du canapé, de la table basse et de meubles génériques qui occupaient le centre                                             | Inspection du décor vide, sans figurants ni bête gardienne                             |
| Chambre               | Grand lit clair à deux oreillers, quatre colonnes, rideaux ouverts attachés, lambrequin festonné et plis du linge                      | Aucun berceau distinct ; chevet et armoire restent `map`                               |
| Repas                 | Une grande table à ceinture sculptée, dossiers cintrés, fleurs, plateaux, tasses et vaisselle                                          | Six places et métriques reconstituées ; plats simplifiés sans aliments copiés          |
| Cuisine               | Plan droit, rangements bas, placards hauts vitrés et bouteilles, plancher                                                              | Suppression de l'îlot supposé ; dimensions reconstituées                               |
| Compartiment de Woody | Cuvette, abattant ouvert, porte-papier, carrelage                                                                                      | Affectation à la salle d'eau héritée interprétée ; baignoire et lavabo restent `map`   |
| Enveloppes            | Panneaux floraux simplifiés, stries basses, ornements hauts, bandes rectangulaires et plafond quadrillé                                | Formes originales simplifiées depuis le noir et blanc ; aucun relevé métrique prétendu |

Le vestibule, la chambre du personnel et ses WC restent des reconstitutions
**`map`**, avec le mobilier détaillé du programme partagé. Cinq espaces
reprennent des éléments attestés ; la provenance de la salle d'eau est limitée
explicitement à la cuvette. Les portes, les empreintes des pièces et les huit
espaces hérités restent inchangés. Les collisions sont conservées lors du
remplacement des blocs par les objets détaillés.

La carte locale 2D projette les mêmes murs et emprises de mobilier que la
visite. Woble et le faux neveu d'Oito sont repositionnés sur le grand lit ; Oito
à côté ; Kurapika, les victimes et Woody rejoignent le sol de leur espace
respectif. Les positions métriques restent interprétées.

## Contrôle visuel

Treize vues inspectées : `woble-living-display`, `woble-living-phone-wall`,
`woble-living-classroom`, `woble-bedroom-bed`, `woble-bedroom-curtains`,
`woble-dining-guards`, `woble-dining-trays`, `woble-kitchen-counter`,
`woble-kitchen-glazing`, `woble-bathroom-wc` et trois vues `-reconstruction`.
Les trois anciens liens d'inspection sont conservés. La carte locale est aussi
vérifiée dans `/ship`.

Le contrôle a conduit à déplacer la caméra de présentation hors d'une feuille
ouverte de porte et à placer un siège en bout de table pour dégager la porte
de cuisine. Le lit est ramené à une tête simple, sans le capitonnage de Momoze.
La capture finale du salon et les derniers journaux restent hors versionnement
dans le dossier personnel de visualisations `woble/`. Les références restent
hors du dépôt.

## Vérifications techniques

- **160 tests ciblés réussis** après
  les derniers ajustements de caméra et de marqueur : blueprint, détails,
  portes, sols, apparences, vues manga, carte et régressions Momoze/Marayam.
- **41 enregistrements modifiés, tous limités au 1014** ; validation du
  blueprint de référence et du blueprint modifié sans erreur. Géométries
  finies et bornées, caméras sur sol libre, absence de lumière ajoutée et
  mêmes emprises 2D/3D vérifiées.
- Treize captures sans erreur JavaScript, avec reprises des vues corrigées.
- ESLint ciblé et contrôle de documentation réussis, sans ajout d'exemption ;
  compilation de production réussie.
- Contrôle de types global : **zéro erreur**, trois avertissements préexistants
  dans la page infiltration. Les contrôles de structure et de documentation
  passent sans ajout d'exemption.
