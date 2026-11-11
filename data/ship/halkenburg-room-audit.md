# Appartement 1009 — Halkenburg

## Références relues

- **Chapitre 366, page de lecture 5**, tome 35 : réveil dans un lit à tête
  courbe ornée, deux oreillers clairs, linge ample et rideaux derrière la tête.
  Dans le salon, les gardes déplacent et empilent le mobilier : cette scène
  n'établit pas un canapé et une table basse à conserver au milieu du passage.
- **Chapitre 382, page de lecture 11**, tome 37 : Shikaku se trouve au 1009.
  La vue dans l'axe du salon montre le sol à bandes rectangulaires, le
  soubassement strié, les panneaux à motifs, les cadres supérieurs et les
  rayonnages ouverts. Le fond central cintré est partiellement masqué.
- **Chapitre 386, page de lecture 13**, tome 37 : Halkenburg et Sumidori sont
  assis face à face sur **deux chaises pliantes**, avec les gardes debout autour.
  Cette case ne démontre pas les six fauteuils en cercle du modèle antérieur.
- **Chapitre 363**, programme-type : cloisons et communications conservées.
  Les six autres pièces n'ont pas de perspective individuelle établie dans
  ces références.

La pagination compte les images depuis le début du chapitre, indépendamment de
l'édition reliée. Consultation :
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 382](https://www.scan-vf.net/hunter-x-hunter/chapitre-382),
[chapitre 386](https://www.scan-vf.net/hunter-x-hunter/chapitre-386).

Les vues du cours de Kurapika aux pages 14–16 du chapitre 386 appartiennent au
1014 : elles ne servent pas de preuve pour le mobilier du 1009. La référence
antérieure aux « vues larges du chapitre 386 » est remplacée par la page 11 du
chapitre 382 pour les rayonnages du salon.

## Corrections

| Élément         | Reprise                                                                              | Limite                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Centre du salon | Canapé, table basse et meuble génériques retirés ; deux chaises pliantes face à face | Disposition mobile inspirée de l'entretien, positions métriques reconstituées                                                        |
| Chaises         | Cadre tubulaire, pieds croisés, assise plate, dossier court et ajour sous le dossier | Ni six fauteuils rembourrés, ni cercle fixe ajouté                                                                                   |
| Bibliothèques   | Rayonnages ouverts, rangées de livres, montants et corniches                         | Livres sans titres ; répartition simplifiée                                                                                          |
| Fond central    | Contours encadrés et fronton cintré, remplissage neutre                              | La partie masquée n'est pas transformée en feu, miroir, horloge ou nouvelle sortie ; identifiant historique `living-mantel` conservé |
| Sol du salon    | Grille rectangulaire sombre avec joints fins parallèles                              | Espacement reconstitué ; ancien dessin de joints génériques retiré pour éviter la superposition                                      |
| Murs du salon   | Panneaux à motifs, soubassement strié et cartouches supérieurs                       | Motifs procéduraux originaux, sans texture tirée des scans                                                                           |
| Lit             | Tête courbe ornée, linge clair déformé, oreillers et rideaux en larges pans          | Dimensions et plis approximatifs ; aucun personnage sous le linge                                                                    |
| Chambre         | Finitions sobres du programme-type autour du lit attesté                             | La case du lit ne démontre pas tout le décor mural de la chambre                                                                     |
| Portes          | Panneaux clairs biseautés, modèle partagé des appartements                           | Largeurs et communications conservées                                                                                                |

Les bibliothèques encadrent le fond central dans une implantation adaptée au
programme-type. Celle de droite est retirée de l'emprise de la porte de la
salle à manger. La scène du chapitre 382 et les chaises du chapitre 386 sont
réunies pour l'inspection du décor ; aucune case ne donne leur distance exacte
ou un relevé métrique commun. Les couleurs sont interprétées depuis le noir et
blanc.

## Six pièces reconstituées

Salle à manger, vestibule, cuisine, pièce du personnel, WC du personnel et salle
de bains emploient le mobilier détaillé partagé. Les enveloppes relèvent du
**plan publié** ; leur mobilier et les armoires non établies de la chambre
portent la provenance **`map`**, avec une source qui précise la reconstitution.
Une cuvette complète la salle de bains.

Les blocs de rendu sont remplacés sans retirer les collisions. La carte 2D
projette les mêmes emprises, avec les chaises mobiles distinguées du mobilier
fixe.

## Contrôle visuel

Onze vues : `halkenburg-living-cleared`, `halkenburg-folding-chairs`,
`halkenburg-bookcases`, `halkenburg-bedroom-curtains`,
`halkenburg-bedroom-bedding` et les six vues `-reconstruction`.
Les inspections sont sans personnages et sans bête gardienne.

Le premier contrôle a conduit à déplacer la caméra des chaises hors d'une
feuille de porte ouverte, élargir les rideaux, compléter les joints du sol et
neutraliser le remplissage du fond partiellement masqué. Les captures initiales
et corrigées sont conservées hors versionnement dans
`test-results/halkenburg-apartment-visual/`.

## Vérifications techniques

- **132 tests ciblés réussis** : 1009, blueprint (58), vues manga, détails
  princiers, portes, sols, apparence des pièces et régressions du 1007/1008.
  Les quatre tests du 1009 repassent après le dernier déplacement de caméra.
- Validation du blueprint : zéro erreur sur le HEAD de référence, et zéro sur
  ce HEAD avec les seules données du 1009 modifiées.
- Maillages finis et bornés en hauteur, caméras sur sol libre, détails retirés
  en mode révélation, emprises 2D/3D identiques et absence de lumière ajoutée.
- Onze captures examinées, puis cinq reprises après correction ; aucune erreur
  JavaScript lors des captures.
- **ESLint ciblé sans erreur**, sans ajout d'exemption ; les **13 contrôles de
  structure et de documentation** passent.
- **Contrôle de types sans erreur**, avec les trois avertissements préexistants
  de la page infiltration ; **compilation de production réussie**.
