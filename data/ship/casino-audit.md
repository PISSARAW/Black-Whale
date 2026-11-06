# Casino VIP — rencontre de Tserriednich et Hisoka

La reprise suit la méthode du banquet : relire les cases, corriger le plan commun,
puis habiller les volumes parcourus. La source éditoriale est Yoshihiro Togashi /
Shueisha, chapitres 405 et 420. Le casino est distinct de la salle de loisirs VVIP
du chapitre 419.

## Références relues

Le [lecteur officiel du chapitre 420](https://mangaplus.shueisha.co.jp/viewer/7002689)
charge son interface mais ne fournit pas les images dans le navigateur de contrôle.
Les cases suivantes ont été observées dans les reproductions de consultation :

- [Entrée dans le casino](https://anna-movies.com/hunterhunter/assets/reference/chapter-420-wsj-pages-20260909/casino-arrival.webp) : plafond à caissons, grands lustres à pampilles, colonnes claires, mezzanine à parapet plein décoré de carrés en gradins, façades et bornes hautes.
- [Révélation d’Hisoka](https://anna-movies.com/hunterhunter/assets/reference/chapter-420-wsj-pages-20260909/hisoka-revealed.webp) : couronnement arrondi des machines, façade de pachinko et coupelles superposées de SWAMP BALL.
- [Activation du futur](https://anna-movies.com/hunterhunter/assets/reference/chapter-420-wsj-pages-20260909/future-activation.webp) : allée entre les bornes, moquette à motifs et dessus des machines.

Aucun scan n’est embarqué ni utilisé comme texture. Les volumes et motifs sont
une modélisation originale simplifiée.

## Corrections et représentation

Les dix-huit tables rondes de 80 cm deviennent des bornes hautes de 2,20 m, à
couronnement arrondi, fenêtres de jeu et commandes. Leurs identifiants historiques
`gaming-table-*` sont conservés pour les références existantes. Leur nombre,
leurs dimensions et leur disposition en deux rangées restent estimés. Les symboles
des jeux sont abstraits ; aucune règle de jeu n’est inventée.

SWAMP BALL reçoit un socle annelé, une façade à champ de clous, trois coupelles,
des montants et son nom en géométrie. Sa silhouette reste une approximation : les
illustrations imprimées et le détail du mécanisme ne sont pas reproduits. Son
enveloppe de collision rectangulaire de 3,20 × 4,20 m, sa hauteur de 3,60 m et sa
position sont des estimations. Le fauteuil voisin est reculé de 10 cm pour supprimer
un chevauchement de cette enveloppe.

Les colonnes centrales génériques traversaient notamment SWAMP BALL. Deux rangées
latérales les remplacent ; les centres des modèles et des collisions sont communs.
Leurs dix positions et leur espacement sont estimés. Les fûts ronds restent
contenus dans l’enveloppe de collision carrée de 90 cm.

La mezzanine sépare maintenant sa dalle de 28 cm de ses parapets de 1,05 m : un
ancien volume épais de 1,10 m tenait lieu des deux. Les devantures supérieures
reposent sur cette dalle et leurs panneaux suivent les structures du plan. Les
parapets en gradins, les corniches, la moquette, les caissons et les lustres
évoquent les motifs visibles. Les 8 m sous plafond, la dalle à 4,20 m et tous les
profils métriques sont estimés. Cette reprise ne déduit pas un nouvel escalier de
galerie d’une case qui ne le situe pas ; la liaison de secours existante est conservée.

Les couleurs ivoire, laiton et bordeaux interprètent le noir et blanc. Les lustres
réutilisent la modélisation du banquet ; leur répétition suit la grille de lumière
existante, avec une marge aux parois. Aucun éclairage permanent supplémentaire
n’est créé.

## Cohérence et inspection

Le plan local projette les structures, portes, colonnes et accès de secours de
`blueprint.json` au lieu de recopier des positions de mobilier. Deux cadrages du
chapitre 420 sont accessibles dans la visite : vue de la salle et vue de SWAMP
BALL. Leurs positions sont reconstituées et ne portent aucun numéro de tome.

L’habillage reçoit le plan réellement parcouru : une borne retirée par un Hatsu
ne laisse pas son modèle sur place. Les enveloppes visuelles remplacées sont
omises du rendu ordinaire, tandis que le plan de collision complet est conservé.
Le mode des provenances rétablit les volumes simples et masque l’habillage.
Les détails sont attachés à la salle, fusionnés en deux lots maximum et libérés
avec elle. Les contrôles vérifient leur budget de 150 000 triangles, leurs limites,
les silhouettes dans les collisions, les cadrages et le trajet de secours.
