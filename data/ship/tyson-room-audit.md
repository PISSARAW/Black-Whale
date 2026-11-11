# Appartement 1006 — Tyson

## Cases relues

- **Chapitre 366, page de lecture 8**, tome 35 : numéro 1006, portes à panneaux
  clairs et distribution du Livre de Tyson à Izunavi et Giuliano. Cette page
  n'établit pas une table centrale garnie de cadeaux.
- **Chapitre 375, page de lecture 1**, tome 36 : vue plongeante du salon, sièges
  rembourrés à motifs et accoudoirs arrondis, table basse carrée avec bouquet,
  tasses et petit livre, sol clair quadrillé de bandes sombres. Un tapis
  rectangulaire à damier occupe un côté de la pièce avec une table basse de
  service ; une plante en pot se tient à proximité. Les panneaux muraux ont
  des remplissages à motifs encadrés et un soubassement strié.
- **Chapitre 389, pages de lecture 9–10**, tome 37 : Giuliano lit dans les
  quartiers du personnel, puis entre dans le salon pour son anniversaire
  surprise anticipé. La grande case de la page 10 montre le centre dégagé,
  le sol quadrillé, les panneaux muraux et la porte à l'arrière. Tyson
  **porte** le gâteau ; la case ne justifie ni un présentoir central permanent
  ni deux meubles de cadeaux emballés.
- **Chapitre 363**, programme-type publié des appartements : cloisons et
  communications des huit pièces conservées. Le mobilier précis des sept
  pièces privées n'est pas confirmé par sept perspectives individuelles.

Les numéros sont les pages de lecture depuis la première image du chapitre,
non la pagination d'un volume relié. Consultation :
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 375](https://www.scan-vf.net/hunter-x-hunter/chapitre-375),
[chapitre 389](https://www.scan-vf.net/hunter-x-hunter/chapitre-389).

## Salon corrigé

| Élément               | Reprise                                                                    | Limite                                                                                             |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Murs                  | Encadrements clairs, remplissages à motifs et soubassement strié           | Motifs procéduraux originaux ; aucune texture extraite du manga                                    |
| Sol                   | Bandes sombres rectangulaires sur fond clair                               | Pas de plancher uniforme dans le salon ; dimensions des mailles interprétées                       |
| Tapis                 | Damier latéral à bordure                                                   | Finition affleurante, sans obstacle dans le plan de collision                                      |
| Assises               | Canapé et deux fauteuils rembourrés, bras arrondis, coussins à fleurs      | Dimensions et implantation dans le programme-type reconstituées                                    |
| Table basse           | Plateau presque carré, entourage mouluré, pieds et traverse                | Bouquet, tasses et livre évoqués par des formes originales sans texte copié                        |
| Coin de service       | Petite table, plateau et tasses                                            | Pas de seconde collection de livres ou de cadeaux inventée                                         |
| Plante                | Pot et feuillage près du tapis                                             | Déplacée hors du dégagement de la porte de la chambre après validation                             |
| Portes                | Feuilles claires à deux panneaux rectangulaires                            | Les cœurs du numéro décoratif de fête ne deviennent pas des ornements de toutes les portes privées |
| Plafond               | Corniche et trame discrète                                                 | Hauteur et espacement reconstitués                                                                 |
| Faux mobilier de fête | Suppression de `living-birthday-table` et des deux `living-gift-display-*` | Le gâteau porté et les figurants ne sont pas rejoués dans l'inspection du décor permanent          |

Le canapé et la table basse existants sont conservés sous leurs identifiants,
avec des formes et sources corrigées. Les deux fauteuils, la table de service
et la plante portent une source de case explicite. Le buffet périphérique
ancien reste une reconstitution cartographique et ne prétend plus être attesté
par le plan du chapitre 363.

Les couleurs restent des interprétations de valeurs monochromes ; ni les
couleurs du tissu, ni l'essence du bois, ni les fleurs exactes ne sont attestées.
Aucun cadeau, participant anonyme ou comportement de Nen n'est ajouté.

## Autres pièces et plans

Salle à manger, vestibule, chambre, cuisine, pièce du personnel, WC du personnel
et salle de bains reprennent le mobilier détaillé du programme-type partagé.
Leur mobilier porte **`map`**, avec une source française indiquant la
reconstitution. Les positions et orientations dégagent les portes ; les
sanitaires détaillés incluent la cuvette de la salle de bains.

Le modèle détaillé remplace les volumes simples dans le rendu tout en
conservant les collisions des meubles. La carte 2D utilise les mêmes emprises
que la visite. Le tapis est une finition du sol et ne crée pas de volume
bloquant.

La grille du salon est extraite sans changement du modèle de Tserriednich dans
un module partagé. Les tests de Tserriednich vérifient cette réutilisation.

## Contrôle visuel

Onze vues : `tyson-living-audience` (lien conservé, référence corrigée au
chapitre 375), `tyson-salon-overview`, `tyson-checkerboard-corner`,
`tyson-salon-panelling`, et les sept vues de pièces privées dont le titre porte
explicitement « reconstitution ». Les inspections sont sans personnages ni
bête gardienne pour permettre l'examen du décor.

Les captures sont conservées hors versionnement dans
`test-results/tyson-apartment-visual/`, avec l'ancien rendu dans `before/`.
Les sources et le modèle permanent distinguent l'anniversaire de **Giuliano**
d'une prétendue réception d'anniversaire de Tyson.

## Vérifications techniques

- **69 tests ciblés** passent dans huit fichiers (Tyson, vues manga, détails des
  princes, portes, sols, Tserriednich, Zhang Lei et Tubeppa), puis quatre tests
  du modèle Tyson après le dernier ajustement de la table de service.
- **13 tests du cliquet, de documentation et des silhouettes** passent.
- **ESLint ciblé** : aucune erreur ; pas d'exemption ajoutée.
- **Contrôle de types** : aucune erreur, trois avertissements préexistants
  dans la page infiltration.
- **Compilation de production** et adaptation Node réussies.
- **Validation isolée du blueprint** : le HEAD de référence et le même HEAD
  avec les seules entrées 1006 modifiées retournent tous deux zéro erreur.
  Les premiers tests globaux de l'espace de travail signalent en parallèle
  des problèmes de source, de liaison et de décompte liés à un nouvel escalier
  du casino, hors du 1006. Ils ne sont pas corrigés dans ce chantier.
- Les onze captures se terminent sans erreur JavaScript de page. Le coin du
  tapis est recapturé après le déplacement de la plante et la simplification
  des objets de la table de service.

Au dernier passage global, les **58 tests de blueprint passent**. Deux tests
de `roomAppearance.test.ts` restent en échec sur le nombre total de lieux
(63 au lieu de 62, 36 au lieu de 35 au pont 1), à cause du lieu ajouté au
casino dans le chantier parallèle. Aucun de ces deux échecs ne concerne le 1006.
