# Appartement 1013 — Marayam

## Références relues

- **Chapitre 366, page de lecture 1**, tome 35 : Sevanti donne à manger à
  Marayam devant une table haute à ceinture sculptée. Deux sièges à dossier
  cintré, crédence avec vase strié, tableau encadré et panneaux vitrés. Il ne
  s'agit pas d'une petite table de jeu basse.
- **Chapitre 367, page de lecture 19** : le cafard d'Oito observe le 1013 par
  une grille haute à lames horizontales, divisée en deux champs. La vue plongeante
  montre aussi le mobilier périphérique, les bandes rectangulaires au sol et
  l'occupation du salon. La grille n'est pas une sortie supplémentaire.
- **Chapitre 372, page de lecture 16**, tome 36 : Hanzo découvre le 1013 sans
  occupants. Le mobilier reste présent : fauteuil, petits meubles latéraux,
  aire de jeu bordée au sol, voitures, blocs et papiers pliés. Une autre pièce
  présente des lits superposés à montants carrés et échelles.
- **Chapitre 375, page de lecture 10** : Hanzo repose sur une couchette haute ;
  à proximité, petit meuble à tiroirs avec pile de papiers et tasse, calendrier
  mural. Les parois de cette pièce sont simples, sans les panneaux floraux du
  salon.
- **Chapitre 375, page de lecture 11** : lit à barreaux de Marayam à côté d'un
  lit adulte partiellement visible. Le salon et les jouets restent visibles
  pendant les échanges des gardes.
- **Chapitre 368, page de lecture 2**, tome 35 : coupe du 1013 avec une grande
  zone centrale et plusieurs compartiments. Elle ne cote ni ne nomme toutes
  les pièces et diffère du découpage parcourable hérité de la visite.

Les pages comptent les images depuis le début du chapitre, indépendamment de
la pagination d'une édition reliée. Consultation :
[chapitre 366](https://www.scan-vf.net/hunter-x-hunter/chapitre-366),
[chapitre 367](https://www.scan-vf.net/hunter-x-hunter/chapitre-367),
[chapitre 368](https://www.scan-vf.net/hunter-x-hunter/chapitre-368),
[chapitre 372](https://www.scan-vf.net/hunter-x-hunter/chapitre-372),
[chapitre 375](https://www.scan-vf.net/hunter-x-hunter/chapitre-375).
Les scans de référence restent hors du dépôt.

## Corrections

| Élément              | Reprise                                                                                                       | Limite                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Table de repas       | Plateau à hauteur normale, ceinture ouvragée, quatre pieds et deux chaises à dossier cintré                   | Attribution à la zone de repas et métriques reconstituées ; vaisselle simplifiée, sans personnages ni nourriture figée                         |
| Crédence             | Meuble à deux portes, vase strié et tableau                                                                   | Motifs paysagers originaux simplifiés ; ancien tableau du salon déplacé dans la zone de repas                                                  |
| Vitrages             | Deux champs divisés et traits de reflet                                                                       | Placement métrique reconstitué ; aucun paysage extérieur inventé                                                                               |
| Aire de jeu          | Tapis bordé au sol, voitures, blocs et papier plié                                                            | L'identifiant historique `living-child-table` est conservé, mais son type devient `platform` ; aucune table basse ajoutée                      |
| Rangement des jouets | Petit contenant ouvert près du tapis                                                                          | Forme du contenant et position reconstituées, provenance `map`                                                                                 |
| Salon                | Fauteuil individuel et petite table latérale                                                                  | Remplacement du canapé générique ; rayonnage périphérique conservé en `map`, sans prétendre identifier le meuble grillagé de la vue plongeante |
| Grille               | Deux champs de lames horizontales et montant central                                                          | Lien historique `marayam-living-vent` conservé ; hauteur et position métrique interprétées                                                     |
| Couchettes           | Deux unités de lits superposés, garde-corps hauts et échelles au pied                                         | Les unités visibles sont reprises ; compte complet et attribution à la zone du personnel reconstitués                                          |
| Meuble des gardes    | Tiroirs, pile de papiers, tasse et calendrier mural                                                           | Cases abstraites originales, sans recopier de dates ni d'inscriptions                                                                          |
| Lit de l'enfant      | Montants carrés, barreaux verticaux, matelas et oreiller                                                      | Dimensions et placement reconstitués à partir du chapitre 375                                                                                  |
| Lit adulte           | Cadre et linge clairs, deux oreillers, tête courbe simple                                                     | Seul un fragment est visible ; le modèle complet reste `map`, sans baldaquin supposé                                                           |
| Enveloppes           | Panneaux à motifs, stries basses, ornements hauts et quadrillages ; murs simples dans la pièce des couchettes | Couleurs, essences de bois, métriques et parties non visibles interprétées depuis le noir et blanc                                             |

Les objets détaillés remplacent les blocs de rendu tout en conservant les
collisions. Les inspections sont sans personnages et sans bête gardienne. Elles
permettent de comparer le mobilier ; elles ne simulent pas les changements
d'espace de la capacité de Nen, ni une seconde entrée dans l'appartement.

## Quatre pièces et implantation reconstituées

Vestibule, cuisine, WC du personnel et salle de bains emploient le mobilier
détaillé du programme de visite et portent la provenance **`map`**. Une cuvette
complète la salle de bains. Le mobilier non établi des autres pièces reste
également **`map`**, notamment le lit adulte complet, les deux meubles
périphériques de la chambre, le rayonnage et le contenant des jouets.

Le salon, la zone de repas, la pièce des couchettes et le lit de l'enfant
s'appuient sur les cases. Leur affectation aux espaces du programme de visite
ne constitue **pas un relevé métrique de la coupe du chapitre 368**. Le découpage
parcourable en huit espaces est conservé et explicitement signalé comme
reconstitution. La carte locale 2D projette les mêmes murs et emprises de
mobilier que la visite. Le marqueur de Hanzo rejoint la couchette haute dans
cette projection, plutôt qu'un lit de la chambre privée.

## Contrôle visuel

Douze vues : `marayam-dining-meal`, `marayam-dining-sideboard`,
`marayam-living-play`, `marayam-living-vent`, `marayam-staff-bunks`,
`marayam-hanzo-bunk`, `marayam-bedroom-crib`, `marayam-bedroom-layout` et quatre
vues `-reconstruction`. La carte locale 2D est également inspectée sur la page
du navire.

Le contrôle a conduit à retourner la crédence et le tableau face à la pièce,
reculer le cadrage de la table pour voir ses pieds, sortir la caméra du salon
derrière une feuille de porte ouverte, relever le tapis au-dessus des lignes
du sol et retirer les ornements floraux de la pièce des couchettes. Le lit adulte
reconstitué est ramené à un cadre simple et du linge clair. Captures avant/après
et journaux hors versionnement dans `test-results/marayam-apartment-visual/`.

## Vérifications techniques

- **154 tests ciblés réussis** : 1013, blueprint, vues manga, détails princiers,
  portes, sols, apparence, carte et régressions Momoze/Fugetsu.
- Blueprint de référence et blueprint avec les seules données du 1013 : zéro
  erreur. Géométries finies et bornées en hauteur, caméras sur sol libre,
  absence de lumière ajoutée et mêmes emprises de mobilier 2D/3D vérifiées.
- Douze captures sans erreur JavaScript, puis reprises des vues corrigées.
- **ESLint ciblé sans erreur**, quatre contrôles de structure et documentation
  réussis, sans ajout d'exemption ; **compilation de production réussie**.
- Le contrôle de types global rencontre deux erreurs préexistantes `detailMode`
  dans `heillyHideoutView.ts` et son test, ainsi que trois avertissements de la
  page infiltration. Aucun diagnostic ne vise les fichiers du 1013.
