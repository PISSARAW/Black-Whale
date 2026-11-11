# Appartements du roi Nasubi — salon et vestibule

## Références relues

- **Chapitre 382, pages de lecture 1–2**, tome 37 : hall gardé avec poste
  d'accueil et portes. Il ne donne pas le tracé métrique du raccord hérité
  entre le salon, son vestibule de visite et la salle de banquet.
- **Chapitre 382, page 3** : axe du fauteuil du roi face à un grand paysage
  encadré, deux enceintes, groupe de sièges latéral, tableaux nombreux,
  panneaux muraux et sol à bandes sombres et champs géométriques clairs.
- **Chapitre 382, page 4, double planche** : grande bataille encadrée sur le
  mur perpendiculaire au paysage, manteau garni de photographies, buste drapé,
  horloge et récipients. Table basse devant le manteau, meubles de présentation,
  desserte à bouteilles et verres sous une nappe, fauteuil de repos allongé,
  accoudoirs sculptés et pieds dégagés ; voûte à caissons et piles carrées.
- **Chapitre 382, pages 5–11** : rapprochements sur les sièges, le manteau,
  les cadres et les boiseries pendant l'échange entre Halkenburg et Nasubi.
  Les bêtes gardiennes apparaissent dans les séquences suivantes : elles
  sont omises dans les inspections du décor.
- **Chapitre 413, pages de lecture 1–4** : arrivée du cercueil puis chambre
  funéraire à quatorze réceptacles. Ces pages ne montrent pas de catafalque
  installé à demeure dans le salon de réception du chapitre 382.

Les pages comptent les images depuis le début du chapitre, la double planche
comptant comme une image. Consultation :
[chapitre 382](https://www.scan-vf.net/hunter-x-hunter/chapitre-382),
[chapitre 413](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_413).
Les scans de référence restent hors du dépôt.

## Corrections et limites

| Élément                 | Correction                                                                                                                    | Limite                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Mobilier                | Suppression des blocs visuels qui remplissaient les meubles détaillés ; volumes complets, pieds, plateaux et caissons ajoutés | Les collisions restent celles du blueprint ; métriques reconstituées                              |
| Fauteuil du roi         | Assise allongée, dossier incliné, coussin, volutes et pieds courbes                                                           | Formes et teinte du tissu interprétées                                                            |
| Salon latéral           | Sièges dégagés, orientation d'un fauteuil corrigée et fauteuil latéral supplémentaire                                         | Compte hors cadrage et implantation interprétés                                                   |
| Manteau                 | Buste drapé, photographies, vases, horloge décalée sur le côté                                                                | Objets et portraits originaux simplifiés ; aucun feu ajouté                                       |
| Table devant le manteau | Ancienne table haute ramenée à une table basse à pieds, deux récipients et linge clair                                        | Emprise et position reconstituées                                                                 |
| Desserte                | Nappe, plis, bouteilles et verres, pieds visibles                                                                             | Dressage simplifié                                                                                |
| Tableaux                | Paysage et bataille sur deux murs distincts, petits cadres intercalés à diverses hauteurs                                     | Motifs originaux en bas-relief ; aucune texture issue des scans ; le paysage n'est plus émissif   |
| Murs et voûte           | Champs à petit motif, moulures, piles, caissons et appliques                                                                  | Motif mural original simplifié, couleurs et métriques interprétées                                |
| Sol                     | Champs clairs et bruns, diagonales et larges bandes sombres ; suppression du liseré doré générique                            | Trame métrique reconstituée depuis la perspective                                                 |
| Catafalque              | Retiré du salon et du plan local                                                                                              | Le chapitre 413 concerne la chambre funéraire distincte ; son architecture n'est pas modifiée ici |

Le programme parcourable conserve ses **deux espaces**, sans ajouter de chambre
ou de salle de bains non montrée. Le vestibule est détaillé à partir du
programme partagé et reste explicitement **reconstitué**. Les limites des
pièces et les portes sont conservées. La carte locale partage les emprises du
mobilier avec la visite ; Halkenburg est ancré sur le sol face au roi, et non
sur le catafalque supprimé. Ces positions sont des interprétations métriques.

## Contrôle visuel

Neuf vues : les trois liens historiques `nasubi-living-mantel`,
`nasubi-living-landscape`, `nasubi-living-vault`, cinq inspections sans
personnages `nasubi-salon-overview`, `nasubi-mantel-objects`,
`nasubi-seating-service`, `nasubi-chair-profile`, `nasubi-floor-inlay`, et
`nasubi-vestibule-reconstruction`. Les trois liens historiques gardent Nasubi
assis et Halkenburg debout ; le décor peut aussi être inspecté sans occupants.

Le contrôle avant/après a permis de retirer les blocs pleins qui masquaient
les pieds, la bête qui occultait le manteau dans la vue d'architecture, les
portraits trop hauts qui traversaient la naissance de la voûte et le catafalque
sans référence dans cette pièce. Le dernier passage reprend la densité des
murs et les diagonales du sol. Captures et journaux hors versionnement dans le
dossier personnel de visualisations `nasubi/`.

## Vérifications techniques

- **139 tests ciblés réussis** : salon royal, blueprint, vues manga, sols,
  apparences, portes et projection de la carte.
- **36 enregistrements de données modifiés, tous dans les quartiers du roi** ;
  blueprint de référence et modifié valides. Caméras sur sol libre, mobilier
  non superposé, géométries finies et bornées, moins de 150 000 triangles,
  absence de lumière ajoutée et ressources GPU libérées vérifiées.
- Compilation de production réussie ; contrôle de types sans erreur, avec les
  trois avertissements préexistants de la page infiltration.
- ESLint ciblé, documentation et contrôle des exemptions réussis, sans nouvelle
  exemption. Les 15 tests du modèle et du sol sont relancés avec succès après
  l'extraction des helpers du sol.
