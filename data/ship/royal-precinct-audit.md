# Royal Precinct — contrôle des chapitres 417 à 420

Contrôle commencé le 5 novembre et terminé le 6 novembre 2026 par lecture des planches, puis confrontation
avec les polygones, portes, liens et marqueurs du site. Aucun scan n’est inclus
au dépôt. Les formes sont une reconstruction originale ; leurs dimensions ne
sont pas des mesures publiées par Togashi.

## Planches consultées

| Chapitre                       | Observation directe                                                                                                                                                                | Conséquence pour le modèle                                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 417, p. 6–7                    | Couloirs lambrissés, plafond à caissons, entrée numérotée 1001 ; ces scènes ne donnent pas un plan métrique du quartier.                                                           | Conserver des appartements distincts et des entrées sur les couloirs ; ne pas en déduire un nouvel étage royal.                                                        |
| 417, p. 12                     | La vue de galeries et le rapport de sécurité nomment le Tier 2.                                                                                                                    | Ne pas attribuer cette architecture au Royal Precinct.                                                                                                                 |
| 418, dernière planche          | Schéma du paquebot et de ses trois accès : A pour les royaux/V5, B pour les soldats et miliciens des mafias, C pour les passagers. A et C occupent les côtés opposés, B l’arrière. | Corriger l’inversion de B et C sur le pont royal ; conserver leurs identités et destinations au Tier 2. Le schéma indique des rapports de position, pas des distances. |
| 419, p. 17                     | Le plan situe les quartiers du Roi et des Reines, le banquet et la salle de loisirs VVIP ; celle-ci se trouve du côté de la passerelle vers le Tier 2 et de la descente.           | Replacer la salle de loisirs le long du quartier princier, sur le trajet vers A. Les proportions et les pièces sans nom ne sont pas des mesures certaines.             |
| 419, p. 18                     | Deux escaliers latéraux, une galerie supérieure, puis une vue extérieure du paquebot entouré d’eau ; la passerelle se rétracte.                                                    | Conserver deux liaisons verticales pour le hall et les passerelles rétractables. La hauteur exacte du hall et le niveau absolu de la galerie restent estimés.          |
| 419, fin ; 420, vues du casino | Machines de jeu, mezzanine, grande borne SWAMP BALL et sortie de secours.                                                                                                          | Conserver la continuité du parcours vers le casino ; ajouter SWAMP BALL à la visite, déjà dessinée dans le plan local. Sa position est schématique.                    |

Sources de lecture officielles : [chapitre 418](https://mangaplus.shueisha.co.jp/viewer/7002644),
[chapitre 419](https://mangaplus.shueisha.co.jp/viewer/7002645),
[chapitre 420](https://mangaplus.shueisha.co.jp/viewer/7002689).
Pour 417, retiré de la fenêtre gratuite des trois derniers chapitres, les
planches 6–9 et 12–13 ont été consultées dans un
[lecteur secondaire](https://toonkotsu.com/title/t5cyo9-hunter-x-hunter/1928465-chapter-417/1) ; la source
éditoriale reste Yoshihiro Togashi / Shueisha, chapitre 417.

## Corrections géométriques

- Les appartements 1009–1014 et leurs dégagements empiétaient sur le passage et
  le bloc anonyme arrière. Le quartier tient désormais entièrement devant eux.
- Les coordonnées de plusieurs portes et accès intérieurs appartenaient encore
  à l’ancienne orientation du plan. Elles sont replacées sur les murs réels.
- Chaque rangée des Reines est desservie par un couloir. La circulation n’exige
  plus de traverser des cloisons ou une autre suite.
- Les gaines suivent les dégagements du nouveau tracé ; le comptoir du poste et
  la galerie du banquet laissent libre le passage gardé.
- Les marqueurs, plans de pont, coupe et visite sont alignés sur le même plan.

## Ce qui reste reconstruit

La coque métrique, les dimensions des boîtes d’appartements sur le plan général,
les largeurs de couloir, la hauteur de la mezzanine intérieure,
les emplacements précis des passerelles, la position du casino au pont 1-C et
le palier de son escalier de secours ne sont pas établis au mètre près par ces
planches. Le hall de loisirs est posé à 30 × 25 m et 8 m de hauteur, avec une mezzanine à 2,8 m pour
s’intégrer au modèle ; ces chiffres ne sont pas canoniques.

Les fonctions des blocs non identifiés restent inconnues. Le placement des
suites VVIP dans le bloc avant est conservé comme hypothèse du modèle. Les
intérieurs détaillés des appartements gardent leurs plans propres : leur
redimensionnement schématique sur le pont ne change pas la taille des salons.

## Extérieur du paquebot dans la visite

La visite utilise ce contrôle des chapitres 418–420 pour sa reconstruction
extérieure originale : coque effilée entourée d'un bassin, superstructures en
retrait et trois passerelles rétractables. Les contours et hauteurs des ponts,
ainsi que les extrémités des passerelles, viennent du même `blueprint.json` que
les espaces visitables. Les enveloppes schématiques des ponts supérieurs sont
écrêtées par leur coque porteuse courbe pour éviter les surplombs artificiels
que produirait leur simple boîte englobante. Le bassin local ne déplace pas la ligne de flottaison
océanique définie dans `sea.ts`.

L'effilement sous le pont royal, la profondeur du bassin, les garde-corps et
le rythme des fenêtres sont des estimations visuelles. Les paliers A, B et C
sont présentés comme des quais ouverts ; leurs limites de collision et leurs
liens de traversée sont conservés. Les fenêtres de façade ne créent aucune
nouvelle pièce dans les plans.

La **« Vue du prince »** (`/tour?mangaView=royal-liner-prince-view`), proposée
aux trois accès du Tier 2, cadre le paquebot depuis un poste sur la promenade
arrière du modèle. Sa référence est le chapitre 419, p. 18, complétée par le
schéma du 418 et le contexte extérieur du 420. Le libellé précise **« cadrage
reconstitué »** : le recul et la hauteur de la caméra panoramique ainsi que
la focale ne sont pas attestés par la planche. Le visiteur reste ancré sur la
promenade ; marcher rétablit la caméra à hauteur d'homme à cet endroit.
Aucun numéro de tome n'est attribué à ces chapitres
dans cette vue. Les scans ne sont ni ajoutés au dépôt, ni utilisés en texture.

### Relecture visuelle et traversées continues

La vue extérieure du chapitre 420 a été relue directement dans la reproduction
[de la planche de sortie](https://anna-movies.com/hunterhunter/assets/reference/chapter-420-wsj-pages-20260909/alternate-descent.webp).
Elle montre une proue dégagée et pointue, plusieurs terrasses en retrait, une
superstructure centrale cylindrique à pinacles, des rangées de lumières et des
projecteurs sur le quai qui entoure le bassin. La façade extérieure reprend
ces traits en volumes originaux : cinq retraits de façade, bandeaux de balcons,
renfoncement rectangulaire du pont avant, couronnement et amortisseur annelé à
l'avant. Les dimensions, couleurs et répétitions sont estimées ; la fonction du
renfoncement du pont avant n'est pas identifiée. Les pièces visitées restent
celles du plan intérieur. Aucun scan n'est utilisé comme texture.

Le cadrage panoramique vient désormais de l'avant du modèle. Le quai et les
projecteurs sont visibles, et le niveau lumineux extérieur conserve la
lisibilité d'un navire sous projecteurs même lorsque le régime intérieur est
nocturne. Cet éclairage n'augmente pas celui des pièces fermées.

Les trois passerelles se traversent à pied, avec progression continue de la
position et de la hauteur entre les paliers existants. Les garde-corps bornent
le déplacement latéral. La touche E lance une traversée guidée ; une commande
de marche reprend le contrôle manuel et permet de faire demi-tour. Le mode de
confort sans marche conserve son raccourci de changement de niveau. Une
passerelle rétractée ne se traverse pas ; la rétraction est désactivée tant
qu'une traversée est en cours. Les ouvertures dans la peau extérieure laissent
passer le visiteur jusqu'aux intérieurs, sans bloquer sur les anciennes cloisons
des paliers. L'inclinaison résulte des hauteurs estimées du plan, pas d'une
mesure publiée dans le manga.
