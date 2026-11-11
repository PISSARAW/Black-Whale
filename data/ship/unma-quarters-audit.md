# Appartements de la reine Unma — chambre 01

## Référence relue

**Chapitre 403, page de lecture 10**, tome 39 : enseigne « 01 », plateau de
boisson et vue du salon. La lecture utilisée insère une page de crédits :
la page du manga correspond donc à l'**image 11** du lecteur, pas à onze pages
de décor. Les pages suivantes montrent notamment les lettres et d'autres
pièces ; elles ne confirment pas une seconde vue complète du salon d'Unma.

La case montre le fauteuil sculpté d'Unma, son téléphone sur un guéridon,
une table de service, une console haute, une table ronde fleurie, un siège
invité et sa petite table, le manteau et les cadres, les colonnes cannelées,
les panneaux et l'ouverture sur l'arrière-plan. La nursery y est partiellement
masquée : les profils non visibles du berceau et de sa suspension restent
interprétés.

Consultation : [édition officielle, chapitre 403](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-403/chapter/44504),
[lecture utilisée pour le contrôle](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_403).
Les scans restent hors du dépôt.

## Corrections et limites

| Élément                 | Reprise                                                                                    | Limite                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Composition             | Fauteuil à droite de l'ouverture, console entre les colonnes, nursery derrière             | Répartition métrique reconstituée dans l'emprise héritée de 11 × 30 m                                            |
| Fauteuil                | Dossier cintré, accoudoirs à volutes, pieds et cadre sculpté                               | Suppression des grandes oreilles rectangulaires et du capitonnage supposé ; motifs originaux simplifiés          |
| Guéridons               | Téléphone avec combiné et cordon, théière et tasse                                         | Petits accessoires simplifiés ; aucun service d'alcool supposé                                                   |
| Table fleurie           | Plateau rond, pieds courbes et bouquet                                                     | Remplace l'ancienne petite table rectangulaire avec coffret et journal non établis                               |
| Console et siège invité | Console haute, fauteuil latéral, petite table au récipient                                 | Dimensions, compte hors cadrage et placement interprétés                                                         |
| Manteau et cadres       | Manteau à ouverture sombre, récipients, grand champ encadré et deux petits tableaux        | Contenu du grand cadre non identifiable derrière la bulle ; pas de blason officiel supposé ni de feu ajouté      |
| Nursery                 | Berceau ramené à une emprise compacte, barreaux et linge ; suspension simple non lumineuse | Profils cachés et support de suspension reconstitués ; pas de patins de bascule ni d'étoiles lumineuses supposés |
| Architecture            | Colonnes cannelées, moulures, petits reliefs, bandes et champs géométriques au sol         | Formes originales simplifiées ; couleurs et hauteur de 4,4 m interprétées                                        |
| Cloison                 | Trois volumes de collision, passage ouvert, détails alignés avec l'ouverture               | Provenance `map` : hauteur, épaisseur et tracé intérieur ne sont pas cotés dans le manga                         |
| Couchage adulte         | Cadre et linge simples issus du programme partagé de `/ship`                               | Provenance `map` ; aucun baldaquin, capitonnage royal ou éclairage de chevet non montré                          |

Le lustre, la lanterne de nursery, les appliques répétées, les lumières de
cadres, les lampes de chevet et les accessoires décoratifs non confirmés sont
retirés. Les luminaires de base de la visite restent gérés par le moteur.
Les blocs visuels du 01 sont remplacés par les objets détaillés, avec les
collisions conservées. La hauteur et l'implantation ne prétendent pas être
un relevé métrique du manga.

La carte du 01 et sa miniature dans le bloc des huit reines projettent les
mêmes emprises que la visite. Les positions d'Unma sur le plan individuel et
sur le bloc sont dérivées de son fauteuil. L'accès au plan individuel est
raccordé au sélecteur du 01, au clic comme au clavier. L'emprise extérieure
et l'accès depuis le couloir sont conservés.

## Contrôle visuel

Huit vues : les trois liens historiques `unma-nursery-salon`,
`unma-salon-armchair`, `unma-nursery-cot`, quatre inspections sans personnages
`unma-salon-decor`, `unma-phone-tea`, `unma-flower-console`, `unma-guest-mantel`,
et `unma-bed-reconstruction`. Le couchage non montré est annoncé comme
reconstitué ; les trois liens historiques conservent Unma assise.

Le contrôle a conduit à reculer la vue d'ensemble pour garder la table ronde
et le fauteuil invité dans le cadre, supprimer les volumes génériques sur les
objets détaillés, éviter les superpositions de la cloison, du manteau et des
cadres, corriger l'ancrage d'Unma et raccorder la carte individuelle.
Références, captures avant/après et journaux restent hors versionnement dans
le dossier personnel de visualisations `unma/`.

## Vérifications techniques

- **134 tests ciblés réussis** : modèle d'Unma, blueprint, caméras manga,
  apparences, portes et projection des marqueurs.
- **18 enregistrements de données modifiés, tous dans le 01** ; validation
  du blueprint de référence et du blueprint modifié sans erreur.
- Géométries finies et bornées, budget inférieur à 150 000 triangles,
  caméras sur sol libre, volumes au sol non superposés, ressources GPU libérées
  et absence de lumière ajoutée vérifiés.
- Compilation de production réussie. Le premier contrôle de types ne signale
  aucune erreur ; le dernier rencontre une erreur de tuple dans
  `apps/web/src/lib/hunt/traces.ts`, modifié simultanément hors de ce commit,
  et trois avertissements préexistants de la page infiltration. Aucun
  diagnostic ne vise les fichiers d'Unma.
- Quinze tests du modèle et du registre des cartes relancés avec succès après
  le raccord du plan individuel. ESLint ciblé, documentation et trois contrôles
  du cliquet passent sans ajout d'exemption.
