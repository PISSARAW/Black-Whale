# Autres locaux de l’armée royale — audit de fidélité

## Périmètre et références vérifiées

Cette passe couvre les quatre chambrées de l’armée royale, les quatre salles
associées des Hunters provisoires, leur passage au pont 1-B et la section locale
de l’armée royale au pont 3. La salle de conférence, déjà auditée, reste inchangée.

Les pages ont été examinées visuellement, pas déduites des anciens noms du modèle :

- **Chapitre 363**, schéma résidentiel initial (page de lecture 2 du scan consulté,
  double page 49–50 du tome 35) : une flèche nomme les quartiers des soldats et
  associés à côté du quartier princier, vers le passage aux niveaux inférieurs.
  Le schéma ne dessine ni huit chambrées ni douze lits par chambre.
- **Chapitre 380**, coupe annotée du navire (page de lecture 10 du scan consulté,
  tome 36) : la section locale de l’armée royale figure dans la zone
  gouvernementale du pont 3, avec la police centrale et les organismes juridiques.
  L’ancienne attribution de cette coupe au chapitre 358 était erronée.
- **Chapitre 358** : la coupe générale et les passages gardés confirment le rôle
  de l’armée, sans fournir de plan des chambres ni de mobilier pour ces locaux.
- **Chapitre 380, fin du chapitre** : le retour de Mizaistom à l’accueil du
  commissariat ne constitue pas une vue spécifique du bureau de l’armée.
  Ses sièges et son aménagement ne sont donc pas recopiés dans la section locale.

Références de lecture : [chapitre 363](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_363),
[chapitre 380](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_380),
[chapitre 358](https://ww3.mangafreak.me/Read1_Hunter_X_Hunter_358).
Les numéros de lecture identifient ces scans, sans revendiquer une pagination
imprimée non vérifiée.

## Correction retenue

La carte locale `/ship` fournit le programme existant de huit salles et
quatre-vingt-seize symboles de couchettes. Ce programme est conservé comme
**carte du projet**, sans le présenter comme un plan de chambrées publié dans
le manga. Les huit emprises sont de provenance `map`, le passage de provenance
`inferred`. Les sources des lits précisent cette limite.

Les finitions deviennent sobres, les plafonds simples, les teintes neutres.
Les tuyaux et quadrillages contrastés ne sont plus ajoutés aux chambrées.
Les textures procédurales générales du moteur restent interprétatives.
Le passage cesse de recevoir les boiseries génériques du pont royal.
Le contrôle visuel a révélé des portes encore dorées : elles sont remplacées
par des vantaux simples et un cadre neutre, avec une étiquette `inferred` et le
rôle `functional-reconstruction`. Leur animation et leurs accès sont conservés.
Les luminaires, couleurs et matériaux restent des reconstructions fonctionnelles,
identifiées par les étiquettes de preuve. Aucun casier, râtelier, bureau,
insigne militaire, écran tactique ni personnage n’est ajouté.

Les lits des Hunters avaient un matelas étiré en largeur et un oreiller posé sur
le grand côté : leur repère est maintenant tourné de 90°, tout en gardant leur
emprise au sol. Les lits simples visibles atteignent environ 0,62 m ; leur volume
de collision est ramené de 1,70 m à 0,66 m. Aucun étage de lit superposé n’est
inventé à partir des symboles du plan. Les profils détaillés portent le rôle
`metric-estimate` et la provenance `inferred`, distincts des empreintes `map`.

La section locale reçoit uniquement une enveloppe sobre et un éclairage
reconstitué. Elle reste sans mobilier : la coupe atteste un service, pas son
aménagement. Son emprise métrique et ses accès hérités restent des estimations. Les poteaux
structurels générés par le moteur pour cette grande portée sont également
reconstitués ; la coupe ne les dessine pas dans cette pièce.

## Carte et contrôle visuel

Le plan local projette les neuf emprises et les quatre-vingt-seize structures du
blueprint. Il ne possède plus son propre quadrillage de lits ni de pastilles de
soldats anonymes. La carte et les collisions partagent donc les mêmes positions,
orientations et encombrements.

Dix vues d’inspection donnent accès aux huit salles, au passage et à la section
locale. Leurs libellés distinguent explicitement reconstruction et intérieur non
montré ; ce ne sont pas dix nouvelles cases de manga. Les caméras sont ancrées
dans les allées, hors des lits, sans ajouter d’occupants.

## Vérification finale

- Inspection visuelle des quatre chambrées militaires et des quatre salles des
  Hunters, du passage et de la section locale, confrontée aux limites des pages
  358, 363 et 380 examinées. Nouveau passage visuel après retrait des portes dorées.
- Contrôle de la carte locale `/ship` : huit salles, passage et 96 empreintes,
  avec la limite documentaire lisible sur le dessin.
- 43 tests ciblés de rendu, de certification et de portes, dont six spécifiques
  aux quartiers militaires, réussis ; 80 tests de régression du blueprint, des
  apparences et des couloirs réussis.
- Typage : zéro erreur, quatre avertissements préexistants dans l’infiltration.
  ESLint ciblé, compilation de production et 13 tests de bornes/documentation réussis.
- Le test global des vues manga conserve l’échec préexistant du cadrage
  `cineplex-auditorium-screen` dans une marche du Cineplex ; les dix nouveaux
  ancrages sont vérifiés séparément, hors mobilier.

Les captures de contrôle sont conservées hors du dépôt. Cet audit n’attribue
aucune chambre intérieure supplémentaire à une case inexistante.
