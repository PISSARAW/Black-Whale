# Suite 1004 — Tserriednich, quatrième prince

Relecture du 11 novembre 2026 à partir du chapitre 366, page de lecture 10
(tome 35), du chapitre 385, pages 1, 5 et 7, et du chapitre 387, pages 1, 4
et 7 (tome 37), de Yoshihiro Togashi / Shueisha. Les scans servent uniquement
à la comparaison ; aucune image du manga n’est embarquée dans le projet.

## Parois, sol et portes

Le premier modèle étendait des stries verticales sombres sur toute la hauteur.
Les cases montrent des panneaux clairs contenant des motifs sombres, au-dessus
d’un soubassement finement strié. Cet agencement remplace les grandes boiseries
sombres. Les motifs de feuillage sont procéduraux et originaux, sans reproduction
du motif imprimé. Leur constructeur est partagé avec celui de Zhang Lei,
déplacé sans changement de son rendu.

Le sol clair forme un quadrillage rectangulaire de bandes sombres, particulièrement
visible au chapitre 385 page 1 et au chapitre 387 page 4. Le réseau diagonal doré
et les joints métalliques génériques sont retirés. Le quadrillage physique et
les fines moulures du plafond sont découpés dans le contour en L de la pièce ;
ils ne traversent plus ses angles rentrants. Le chapitre 366 page 10 établit le
plafond à petits panneaux, dont le rythme métrique reste estimé.

Les doubles portes ont deux grands panneaux biseautés et une traverse centrale
étroite dans chaque vantail. Les grandes plaques d’or génériques sont remplacées
par ces panneaux, des moulures claires et des diagonales de biseau simplifiées.
Leur animation et les ouvertures du plan parcouru sont conservées.

## Mobilier périphérique et pendule

Le centre reste libre pour l’entraînement. Le chapitre 385 page 7 montre des
assises tapissées, tables basses et meubles d’appoint fleuris en périphérie.
L’implantation et les dimensions des deux groupes d’assises sont reconstituées
dans le programme-type, avec des accès dégagés aux chambres et aux sanitaires.
L’ancienne identification d’un fauteuil en rotin n’était pas établie par cette case.

La pendule est une petite pièce ornementale à socle et côtés courbes, **posée
sur un meuble bas**, comme le montre son gros plan à la page 7. L’ancien objet
fusionnait mal le meuble et l’horloge, avec un cadran horizontal et une silhouette
de caisse à pendule inventée. Le meuble et l’horloge sont désormais déclarés
séparément ; le cadran vertical, ses repères et les aiguilles sont lisibles.
L’heure affichée n’est pas présentée comme un minutage canonique de la tentative
de Theta.

Le panoramique de la page 5 permet de garder les meubles hauts fermés, meubles
bas et un écran rectangulaire sur son support en bordure. Leur contenu et leurs
matériaux précis ne sont pas identifiés. L’étagère ouverte garnie d’objets
inventés devient un meuble bas fermé. Le cadre reste une décoration abstraite
simplifiée, sans lui attribuer un sujet absent des cases. Son habillage est
recentré dans la hauteur réellement déclarée.

## Vues des scènes et vues du plan

Le lien `tserriednich-living-training` est conservé et sa référence corrigée
vers le premier exercice d’aura du chapitre 366, page 10. Theta et Salkov
accompagnent le prince. Une seconde vue prend pour référence l’entraînement
au Zetsu du chapitre 385 : le prince et Theta se font face, sur un centre dégagé.
Les positions exactes restent une reconstitution. La bête gardienne n’est pas
ajoutée à cette image de Zetsu où elle est absente ; ce choix de cadrage ne
modifie aucun état Nen de la simulation.

Les personnages restent les silhouettes et costumes du catalogue général : ce
contrôle du décor ne valide pas leur tenue propre à chaque instant du manga.
Deux autres angles, sans personnages, rendent visibles la pendule et les assises.
Les sept vues restantes — salle à manger, vestibule, chambre, cuisine, pièce du
personnel, WC du personnel et salle de bains — sont explicitement légendées
« reconstitution » et restent sans personnages.

Ces sept pièces suivent le programme-type publié au chapitre 363 : lit double,
rangements, deux lits du personnel, table de repas, cuisine en L, baignoire,
lavabo et WC. Leur mobilier détaillé porte la provenance `map`. Les planches
relues n’établissent ni leurs finitions ni un îlot de cuisine ni le réfrigérateur
placé dans le comptoir de l’ancienne version. Les cloisons du plan publié gardent
leur provenance propre.

## Cohérence technique

Le plan local projette les structures du même modèle que la visite. Les volumes
grossiers ne doublent plus le mobilier détaillé, tout en restant présents pour
les collisions et dans la vue des preuves. Chaque structure emporte son propre
habillage lorsqu’elle est déplacée ou supprimée. Les détails des huit pièces
restent en deux lots maximum par pièce, sans lumière Three.js permanente ajoutée.
Les constructeurs communs servent aux sept pièces reconstruites.

## Limites et références

Onze vues sont capturées et relues dans
`test-results/tserriednich-apartment-visual/`, avec l’état initial dans `before/`.
Le contrôle a corrigé la paroi masquant le duo, le second canapé gênant la porte
de la salle d’eau et la bête gardienne masquant le premier exercice d’aura.
Son emplacement dans cette dernière vue reste une reconstitution. Les onze
navigations ne produisent aucune erreur JavaScript.

Les 76 tests ciblés passent, dont les régressions de Zhang Lei, Benjamin et
Camilla, ainsi que les 13 contrôles de structure et documentation et l’invariant
global du plan. ESLint ciblé et compilation de production passent. Au dernier
contrôle de types, cinq erreurs et quatre avertissements concernent les autres
chantiers (traduction, reconstruction, chasse et infiltration) ; aucun diagnostic
ne vise les fichiers de cette fidélisation. Les vues ont été retestées après
le dernier ajustement du premier exercice.

La hauteur de quatre mètres, les dimensions, le rythme des panneaux et l’implantation
précise des meubles dans le programme-type sont des estimations. Les couleurs
interprètent les sources en noir et blanc ; le dessin des moulures et fleurs est
simplifié. Les scènes de dialogue du bureau mafieux au début du chapitre 384 ne
sont pas utilisées pour meubler le 1004.

Références de lecture : [premier exercice, chapitre 366 page 10](https://www.scan-vf.net/hunter-x-hunter/chapitre-366/10),
[portes et sol, chapitre 385 page 1](https://www.scan-vf.net/hunter-x-hunter/chapitre-385/1),
[panoramique du mobilier, page 5](https://www.scan-vf.net/hunter-x-hunter/chapitre-385/5),
[assises et pendule, page 7](https://www.scan-vf.net/hunter-x-hunter/chapitre-385/7),
[reprise de la scène, chapitre 387](https://www.scan-vf.net/hunter-x-hunter/chapitre-387/1).
Source éditoriale : Yoshihiro Togashi / Shueisha.
