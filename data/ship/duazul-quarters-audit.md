# Duazul et le programme commun des chambres de reine 02 à 08

## Références examinées

- Chapitre 366, page de lecture 14 : le numéro **1002** apparaît dans la case du repas de Camilla avec Duazul. Table rectangulaire nappée, deux sièges, fleurs basses, bougies courtes et couverts appartiennent donc à l'appartement de **Camilla**. La vue `camilla-duazul-dining` reste dans cet appartement ; aucun mobilier de cette scène n'est attribué au 02.
- Chapitre 349 : présentation des reines avant la traversée ; aucun relevé de l'intérieur privé du 02.
- Chapitres 373, 374 et 389 : scènes, portraits et rappels du contexte royal, sans vue identifiable de cet intérieur privé.
- Chapitre 403, page de lecture 10 (image 11 du lecteur avec les crédits) : salon d'**Unma**, déjà audité séparément. Ce n'est pas une preuve directe de l'aménagement de Duazul.
- La carte `/ship` fournit huit chambres et leur programme de couchage. L'ordre du bloc et l'attribution du 02 à Duazul selon son rang sont reconstruits.

Sources de lecture : [chapitre 366](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_366), [349](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_349), [373](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_373), [374](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_374), [389](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_389), [403](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_403). [Catalogue officiel VIZ](https://www.viz.com/shonenjump/chapters/hunter-x-hunter?locale=en).

Cette vérification n'établit pas que tout l'intérieur des appartements des reines aurait été publié. Elle délimite ce que les pages examinées permettent de reproduire.

## Socle demandé et provenance

L'utilisateur demande ensuite que chaque reine dispose du minimum présent chez Unma, sans les spécificités de première épouse. Ce choix autorise un **programme commun extrapolé**, signalé comme tel. Les chambres 02 à 08 reçoivent chacune onze emprises `map`, jamais `panel` :

| Zone             | Programme reconstruit                                  |
| ---------------- | ------------------------------------------------------ |
| Couchage         | Lit simple de 2,2 × 2,5 m, armoire avec portes         |
| Salon            | Fauteuil, siège visiteur, table basse, console         |
| Tables latérales | Téléphone simplifié ; plateau avec théière et tasse    |
| Intimité         | Deux pans de cloison et un linteau, ouverture de 4,2 m |

La nursery, le berceau, la suspension, le fauteuil d'apparat sculpté, les colonnes cannelées, les cadres et le manteau d'Unma ne sont pas transposés. Aucun bébé, reine ou personnel n'est mis en scène dans le programme commun.

L'emprise extérieure héritée de 11 × 30 m et les accès au couloir restent en place. Le plafond de 4,4 m, les positions, les finitions neutres et les profils des meubles sont des choix de reconstruction. Les chambres de la rangée opposée inversent l'orientation du couchage, du fauteuil et de l'armoire. Les cloisonnements sont présents dans les collisions ; aucune porte intérieure non documentée n'est ajoutée.

Les sept anciens lits étirés d'environ 5 m sont remplacés par des couchages aux dimensions cohérentes avec celui reconstitué chez Unma. Les géométries détaillées remplacent les blocs visuels, tandis que le plan original continue à fournir les collisions. Le mode de provenance conserve ces blocs.

## Carte et contrôle visuel

Le plan individuel et la miniature de chaque chambre projettent les mêmes structures et portes que la visite. Les volumes reconstitués sont dessinés en pointillés. Le plan du 02 propose un lien vers le véritable repas de Duazul chez Camilla, avec sa référence.

Le contrôle visuel compare les références de Duazul au décor correspondant du 1002, puis vérifie la cohérence du programme commun avec celui d'Unma et les limites ci-dessus. Il ne prétend pas reproduire case par case un appartement privé qui n'est pas établi par les pages examinées.

## Vérifications

- **110 tests ciblés réussis** : programme commun des reines, Unma, invariants du blueprint, vues manga, apparences et résolution des cartes.
- **ESLint ciblé réussi** ; aucun ajout aux listes d'exemption et fichiers applicatifs sous les bornes du dépôt.
- **Contrôle des types réussi**, zéro erreur et trois avertissements préexistants dans la route d'infiltration.
- **Compilation de production réussie**, avec les avertissements existants de découpage des bundles.
- **13 tests du cliquet et de documentation réussis** ; `doc-lint: OK`.
- Carte du 02 ouverte depuis la miniature du bloc : onze structures, porte réelle, pointillés de reconstitution et lien vers le repas en 1002 vérifiés.
- Visite du 02 contrôlée en développement puis en compilation de production : salon, téléphone, thé, table basse, siège visiteur, couchage, armoire et passage intérieur. La version compilée évite les rechargements des travaux simultanés d'autres chats.
- Géométries des sept chambres vérifiées finies, dans leurs enveloppes et sans chevauchement entre meubles au sol ; collisions conservées.

La chambre 05 de la rangée opposée a également été parcourue en production : passage, tête du lit et portes de l’armoire orientés vers l’intérieur. Captures de contrôle conservées hors du dépôt pour le plan du 02, son salon, son couchage et le couchage du 05.
