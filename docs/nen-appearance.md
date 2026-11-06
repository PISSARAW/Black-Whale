# Apparence des manifestations de Nen

Les dessins du manga déterminent l'anatomie. Les modèles restent des
reconstructions procédurales stylisées : leurs couleurs, leurs dimensions en
mètres et leur adaptation à la hauteur des cabines sont des choix de rendu,
pas des mesures ou des couleurs canoniques.

## Modèles et références

| Manifestation                | Éléments repris                                                                                                        | Repères                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Without You                  | Même modèle humain nommé que Kacho, opaque ; pose assise à la table de Morena                                          | ch. 381, 400 ; `appearance.json` |
| Indoor Fish                  | Colonne, côtes ouvertes, crâne, mâchoire et nageoires                                                                  | ch. 97                           |
| Blinky                       | Embout avec yeux, bouche dentée et langue ; tuyau continu                                                              | ch. 71, 227                      |
| Cat's Name                   | Chat noir, bras longs, mains préhensiles, pieds, moustaches et queue                                                   | ch. 373                          |
| Momoze                       | Une seule anatomie de souris : oreilles rondes, motifs frontaux, dents triangulaires, cœur ; petites répliques         | ch. 361–362                      |
| Tserriednich, gardienne      | Tronc équin, avant-bras et mains humains, talons, cou annelé arqué, visage féminin, chevelure et queue en fléau        | ch. 362, 384–385                 |
| Camilla, gardienne           | Couronne d'appendices en goutte reliés, tronc écaillé et base évasée                                                   | ch. 362, 375                     |
| Tubeppa                      | Crapaud, excroissances et quatre roues à rayons                                                                        | ch. 362, 375                     |
| Zhang Lei                    | Roue à huit branches, visage, flammes noires courbes ; valeur et motif gravés sur les pièces                           | ch. 362, 375–390                 |
| Tyson                        | Cœur, grand œil, quatre ailes ; même modèle au salon et pendant le pouvoir                                             | ch. 375                          |
| Eye-wogs                     | Œil, membres courbés, doigts préhensiles, queue souple                                                                 | ch. 375                          |
| Luzurus                      | Segments, tête, antennes, petites ailes et dentition                                                                   | ch. 362, 375                     |
| Salé-salé                    | Masse irrégulière, lèvres, bouches réparties sur les faces et dents                                                    | ch. 362, 375                     |
| Marayam                      | Formes élancée, agrandie et compacte ; appendices dentés de la dernière                                                | ch. 362, 370, 372                |
| Benjamin                     | Tête allongée, yeux en perles, deux bouches, col hérissé, mains et ailes en cape                                       | ch. 362–363, 372                 |
| Halkenburg                   | Cyclope simiesque, cornes, plumes, grands bras et orifice dorsal                                                       | ch. 349, 382                     |
| Nasubi                       | Deux masses latérales, quatorze excroissances par côté, cinq membres terminés par des mains par côté, visage et langue | ch. 349                          |
| Tserriednich, seconde bête   | Modèle distinct : cage thoracique, membres noueux, tête encapuchonnée, sceau abdominal                                 | ch. 384                          |
| Stealth Dolphin              | Dispositif ornementé en forme de dauphin, nageoires et deux seringues                                                  | ch. 361                          |
| Cookie                       | Cheveux longs, robe à manches courtes, tablier sombre et nœud                                                          | ch. 201                          |
| Predator                     | Uniquement le contre montré face à Salé-salé : gueule à quatre lobes, rangées de dents, chevelure et membres           | ch. 375                          |
| Silent Majority              | Poupée humaine partagée et quatre serpents blancs à lèvres humaines, distincts de Snake Arm                            | ch. 369–376                      |
| Biohazard                    | Caméra-chat et menottes-pigeons ; l'objet original est masqué pendant ces transformations                              | ch. 390–391                      |
| Magical Worm                 | Petite porte à encadrement arrondi, battant, poignée et gorge du tunnel ; rendu de la destination conservé             | ch. 368, 381                     |
| Skill Hunter / Double Face   | Couverture avec paume, blocs de portrait et texte, marque-page uniquement lorsqu'il est actif                          | ch. 99, 351–352                  |
| Papier de Kalluto            | Silhouette découpée avec bras, jambes et tête, épaisseur de papier                                                     | ch. 226                          |
| Black Voice / Love Dial      | Téléphones distincts ; antenne du contrôle conservée sur la cible                                                      | ch. 227 ; arc Yorknew            |
| Snake Arm                    | Quatre marques en cœur ajoutées à la tête du serpent                                                                   | ch. 319                          |
| Jupiter                      | Sphère à bandes, montrée au moment de l'impact                                                                         | ch. 225                          |
| Pain Packer                  | Robe protectrice, panneaux noirs anguleux, capuche et ornement croisé                                                  | ch. 229                          |
| Fun Fun Cloth / Priest Staff | Tissu continu avec plis ; bâton avec embouts distincts                                                                 | arc Yorknew ; ch. 349            |

Les planches consultées sont notamment recensées dans les galeries
[des gardiennes](https://hunterxhunter.fandom.com/wiki/Guardian_Spirit_Beast/Image_Gallery),
[de Tserriednich](https://hunterxhunter.fandom.com/wiki/Tserriednich_Hui_Guo_Rou/Image_Gallery)
et [de Camilla](https://hunterxhunter.fandom.com/wiki/Camilla_Hui_Guo_Rou/Image_Gallery).
Les caractéristiques structurantes sont aussi consignées dans `nenAppearance.ts`.

## Apparences non établies

- **Woble** : retrait de la déclaration `ghost`. Une aura inquiétante n'établit
  ni un corps ni un fantôme muni d'un stylo. Les anciens payloads sont aussi
  refusés par la projection de la distribution.
- **Troisième mensonge** : conservation de l'état de simulation, suppression de
  la sphère à piques inventée. Aucun corps de remplacement n'est dessiné.
- **Trois singes de Saiyu** : les fonctions sont connues, mais aucune anatomie
  dessinée n'a été établie par les références consultées. Aucun singe générique
  n'est ajouté.
- **Predator contre une autre cible** et **autres hybrides Biohazard** : aucun
  nouveau contre-animal ni animal-meuble n'est déduit d'une simple capacité.

## Placement et vérification

`GUARDIAN_PRESENTATION` distingue le sol, le vol et les épaules de l'hôte. La
taille est plafonnée par la hauteur disponible. Les gardiennes au repos ne
reprennent pas les animations des manifestations portées par la caméra.

Les géométries fixes sont regroupées par matériau ; les articulations nommées
restent séparées. Les tests vérifient que ce regroupement conserve exactement
les volumes, que les coordonnées sont finies, que Kacho reprend sa propre
apparence et que les pouvoirs libérés retirent leurs accessoires. La revue
visuelle utilise les mêmes constructeurs Three.js que la visite.
