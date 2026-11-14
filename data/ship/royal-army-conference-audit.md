# Army Conference Floor — contrôle des cases du chapitre 380

## Références

La salle est identifiée par `tier-4-royal-army-conference-room-floor`, dans l'intérieur `interior-royal-army-conference`. Les références principales sont les **pages de lecture 1, 2, 3 et 6 du chapitre 380**, tome 36 : présentation du briefing, contrechamp sur les officiers et vue oblique du U. La page imprimée « 189 » de l'ancien modèle n'a pas été vérifiée dans une édition identifiée ; les vues donnent désormais les pages du chapitre.

La relecture du chapitre **350** ne montre pas ce briefing militaire. Ses références dans les anciennes vues et descriptions sont retirées. Le récit de Kurapika avant le départ ne documente pas l'intérieur de cette salle.

Sources : [chapitre 380, édition officielle VIZ](https://www.viz.com/shonenjump/hunter-x-hunter-chapter-380/chapter/12040), [lecteur du chapitre 380](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_380), [chapitre 350 relu pour vérification](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_350). Aucun scan n'est intégré aux textures ni aux assets du dépôt.

## Ce que montrent les cases et corrections

| Élément         | Ancien modèle                                                            | Correction d'après les pages examinées                                                                          |
| --------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Table du comité | U sombre fermé du côté de l'orateur                                      | Plateau clair, U ouvert vers Mizaistom, traverse fermée du côté du public, tablier à traits verticaux           |
| Sièges          | Fauteuils ergonomiques, appuie-tête et roulettes                         | Chaises sobres à cadre rectangulaire, dossier partiellement ouvert et quatre pieds                              |
| Public          | Absent du plan                                                           | Rangées derrière le comité avec allée centrale                                                                  |
| Écran           | Interface bleue, télémétrie, silhouette du navire et points radar        | Surface blanche encadrée                                                                                        |
| Petit tableau   | Tableau de cartes tactiques sur le mur latéral                           | Petit panneau clair dans la zone avant gauche, sans carte lisible ; implantation et profils cachés reconstitués |
| Sol             | Moquette sombre et bordure en laiton                                     | Quadrillage de dalles claires                                                                                   |
| Pupitre         | Médaillon, écran de contrôle, lampe et doubles microphones               | Petit pupitre en caisson avec tablette et rangement ouverts du côté de l'orateur                                |
| Estrade         | Volume visuel sans support de marche                                     | Plateforme basse inscrite dans le blueprint et utilisée par les collisions ; pupitre et Mizaistom à sa hauteur  |
| Murs et plafond | Armoiries, horloges, rack, écrans auxiliaires, caméras, projecteur laser | Parois simples à grands panneaux, grille basse entrevue à droite et plafond uni reconstitué                     |

Aucun microphone, dossier marqué « confidentiel », sous-main, plaque nominative, verre ni tableau tactique n'est ajouté aux tables : ces équipements ne sont pas établis par les vues examinées. Les anciens voyants et bandes lumineuses décoratives sont retirés.

## Limites de la reconstruction

L'emprise intérieure héritée reste de **20 × 15 m**, sous 5 m ; ce n'est pas un relevé métrique du manga. La hauteur de l'estrade (0,16 m), les profils cachés, les couleurs, les pas du quadrillage et les dimensions des meubles sont interprétés.

Les **douze places du comité et dix-huit places du public** constituent une implantation schématique des groupes visibles, pas un décompte canonique exhaustif. Les structures restent de provenance `panel` pour la nature des objets dessinés, avec cette limite explicitée dans leur source.

Le rattachement extérieur au **pont 4**, son emprise sur le plan général et son accès arrière restent ceux de `/ship`. Ces pages ne donnent pas de localisation métrique de la salle sur le navire ; aucune autre zone n'est déplacée dans cette correction.

Les volumes simples du blueprint assurent toujours les collisions et le mode de preuve. Le rendu normal les remplace par les meubles détaillés ; il ne les superpose plus aux chaises et aux tables.

## Carte et cadrages

Le plan 2D projette directement les 37 structures du blueprint : trois parties du U, trente chaises, écran, petit tableau, pupitre et estrade. Les ancrages de Mizaistom suivent sa position sur l'estrade. L'échelle et le nombre de sièges reconstitués sont indiqués sur le plan.

Les quatre anciens liens de vue sont conservés, avec références et descriptions corrigées. Le lien `royal-army-tactical-maps` montre désormais le petit tableau vierge ; son identifiant est conservé pour compatibilité. Une cinquième vue, `royal-army-briefing-decor`, permet de contrôler le décor sans personnage. Les vues d'ensemble surélevées sont signalées comme telles.

## Vérification

- **24 tests ciblés réussis** : sept tests propres à cette salle, six sur les détails des intérieurs et onze sur les apparences. Ils contrôlent le sens du U, les collisions, les emprises, l'allée centrale, la marche sur l'estrade, le mode de preuve et les ancrages de carte.
- **58 tests du blueprint réussis** lors de la dernière passe de régression générale. Un test global des vues manga rencontre encore une caméra dans un escalier du Cineplex, modifié simultanément hors de cette salle.
- **Typage : zéro erreur**, quatre avertissements préexistants dans la route d'infiltration. ESLint ciblé réussi.
- **Compilation de production réussie** pour les meubles, l'architecture et les cadrages. Les deux derniers ajustements (orientation de l'orateur et ordre des couches SVG) ont été recompilés et contrôlés dans une prévisualisation stable sans HMR.
- Les cinq cadrages sont inspectés après comparaison avec les pages 1–3 et 6. Les captures sont conservées hors du dépôt : vue d'ensemble sans occupants, vue oblique du U avec les rangées, tableau vierge, pupitre et briefing avec l'orateur.
- La carte `/ship` projette les mêmes 37 structures ; l'estrade est dessinée avant les meubles pour laisser écran, petit tableau et pupitre visibles.

La représentation de Mizaistom reste l'avatar existant du moteur. Cette passe corrige sa position, sa hauteur et son orientation face au public, sans prétendre refaire son visage, son costume ou les effets de Nen du moteur.
