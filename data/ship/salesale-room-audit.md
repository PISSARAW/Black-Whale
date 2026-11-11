# Appartement 1008 — Salé-salé

## Références relues

- **Chapitre 366, page de lecture 6**, tome 35 : Swinko et ses gardes devant
  le grand lit de Salé-salé. Tête de lit courbe, deux hauts montants arrière,
  étoffe retombante, literie ample et deux écrans sur des meubles bas latéraux.
- **Chapitre 381, page de lecture 15**, tome 37 : vue détaillée de la chambre
  avec Predator au premier plan. Elle précise les équipements empilés sous les
  écrans, le tissu posé sur un écran, les coussins et boissons au sol, les plis
  du linge, les panneaux muraux à motifs, leur registre supérieur encadré,
  le soubassement strié et les lames du plancher.
- **Chapitre 382, page de lecture 17**, tome 37 : le lit et ses montants sont
  recoupés dans la scène de la mort du prince. La scène n'est pas rejouée dans
  les vues d'inspection du décor.
- **Chapitre 363**, programme-type : distribution conservée des huit pièces.
  Aucune perspective individuelle ne démontre ici le détail des sept autres
  pièces du 1008.

La pagination compte les images depuis le début du chapitre, distinctement de
celle d'une édition reliée. Consultation :
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 381](https://www.scan-vf.net/hunter-x-hunter/chapitre-381),
[chapitre 382](https://www.scan-vf.net/hunter-x-hunter/chapitre-382).

## Corrections de la chambre

| Élément       | Reprise                                                                                    | Limite                                                             |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Lit           | Grand matelas, traverse courbe, montants arrière, tête striée                              | Dimensions et implantation métrique reconstituées                  |
| Étoffes       | Drapé en pans larges sur la tête, couverture déformée en relief, jupe plissée et oreillers | Plis procéduraux approximatifs ; aucun corps suggéré sous le linge |
| Équipements   | Deux écrans latéraux tournés vers la pièce, appareils empilés sur meubles bas              | Écrans neutres ; marques et programmes non identifiés              |
| Tissu d'écran | Étoffe claire retombant sur l'un des écrans                                                | Forme simplifiée                                                   |
| Sol           | Lames étroites, coussins et plateau de boissons au sol                                     | Matières, couleurs et nature des boissons interprétées             |
| Murs          | Panneaux floraux, soubassement strié, cadres horizontaux supérieurs                        | Motifs originaux simplifiés, sans texture extraite des scans       |
| Portes        | Modèle clair à panneaux biseautés partagé avec les autres appartements                     | Largeurs, ouvertures et communications conservées                  |

Les meubles audiovisuels flanquent le lit ; ils ne forment plus un ensemble
placé arbitrairement face à lui. Le petit plateau de sol remplace la table de
fête générique. Le rendu propre au 1008 écarte le banc de pied de lit, le tapis
et le lustre ajoutés par l'habillage générique des chambres. L'armoire reste
une reconstitution `map`. Les couleurs du décor ne sont pas attestées par le
noir et blanc.

## Sept pièces reconstituées

Salon, salle à manger, vestibule, cuisine, pièce du personnel, WC du personnel
et salle de bains utilisent le mobilier détaillé partagé du programme-type.
Leur mobilier porte la provenance **`map`** et une source précisant la
reconstitution. Une cuvette complète les équipements de la salle de bains.
Les collisions restent présentes quand les blocs sont remplacés par les
maillages détaillés. La carte 2D projette les mêmes emprises de mobilier.

## Contrôle visuel

Onze vues ont été capturées et examinées : `salesale-bedroom-party`,
`salesale-headboard-drapery`, `salesale-bedding-floor`,
`salesale-audiovisual-corner`, puis les sept vues dont l'identifiant se termine
par `-reconstruction`. Elles sont sans personnages ; la bête gardienne est
omise dans les quatre inspections de la chambre.

Après comparaison avec les cases, les pans de tissu de la tête de lit sont
élargis, le relief de la couverture est accentué et le registre supérieur des
panneaux est ajouté. La caméra des équipements est reculée et abaissée pour
montrer aussi le meuble sous l'écran. Les captures de contrôle sont conservées
hors versionnement dans `test-results/salesale-apartment-visual/`.

## Vérifications techniques

- **125 tests ciblés réussis** : 1008, blueprint (58), vues manga, détails
  princiers, portes, sols et régressions des appartements 1005 à 1007.
- Le HEAD de référence et ce HEAD avec les seules données du 1008 modifiées
  retournent chacun zéro erreur de validation du blueprint.
- Géométrie finie et bornée en hauteur, caméras sur sol libre, retrait des
  détails en mode révélation et cohérence des emprises 2D/3D vérifiés.
- Captures des onze vues sans erreur JavaScript.
- ESLint ciblé sans erreur et sans ajout d'exemption.
- **13 contrôles de structure et de documentation réussis.**
- **Contrôle de types sans erreur**, avec trois avertissements préexistants
  dans la page infiltration ; **compilation de production réussie**.
