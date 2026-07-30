# La reconstruction du Black Whale

`blueprint.json` est le vaisseau en tant que **géométrie**, et non en tant que
dessin. C'est ce que parcourt la visite virtuelle ([`/tour`](../../apps/web/src/routes/tour)).

Il ne remplace pas les plans SVG de `apps/web/src/lib/assets/maps` : ceux-ci
répondent à _qui est où à tel événement_, celui-ci à _comment le vaisseau est
bâti_. Aucun passager, aucun chapitre, aucune chronologie n'entre ici. Les deux
ne sont pas indépendants pour autant — la visite doit être ces plans-là, à
hauteur d'homme, et c'est ce que règle la section suivante.

## L'ordre d'autorité : manga → `/ship` → visite

La visite est censée être la version qu'on parcourt des plans que `/ship`
dessine. Trois rangs, dans cet ordre :

1. **Le manga tranche.** Une planche ou un plan du vaisseau l'emporte sur tout,
   y compris sur une carte `/ship` qui dirait le contraire — le pont
   d'observation était dessiné en terrasse au-dessus d'une mer, le plan le met
   à tribord du pont 3, c'est le plan qui gagne.
2. **Là où aucune page ne parle, `/ship` tranche.** Ce que le plan de salle
   dessine, la pièce le tient : le banc du magistrat de la cour suprême, les
   huit suites du bloc VVIP. Ces volumes portent la provenance `map`, un rang
   sous les dessins, parce qu'une carte `/ship` est la lecture de ce dossier et
   pas le trait de Togashi.
3. **Là où ni l'un ni l'autre ne dit rien, rien n'est posé.** Les suites VVIP
   restent nues : ni planche ni carte n'y dessine de meuble, et un meuble
   inventé serait du décor. La règle se lit dans les deux sens — les chambrées
   des soldats, elles, sont meublées, parce que leur plan y dessine douze
   couchettes par salle, et les laisser vides aurait été retrancher au plan.

Le corollaire vaut dans l'autre sens : quand la visite tient plus que la carte
parce qu'une planche le montre — la salle de projection et ses quinze volumes
contre un rectangle — c'est **la carte** qu'il faut refaire.

## Repère et échelle

Les plans de ponts sont dessinés dans un `viewBox` de 1000 × 600. Une unité de
ce `viewBox` vaut **0,35 m**.

Ce facteur est fixé par la **taille des pièces**, pas par la longueur du
vaisseau : les plans sont schématiques, ils disent ce qui jouxte quoi, pas
combien ça mesure. Lus au pied de la lettre à 1 m par unité, ils donnent une
salle de banquet de 450 m de long — un volume que personne ne peut parcourir. À
0,35, on obtient un appartement princier de 16,6 × 7,5 m et une salle de banquet de
157 × 25 m sous 9 m de plafond, et les proportions des plans sont conservées
exactement. La coque reconstruite fait alors **318 m de long sur 175 m de large**
au pont 3, le plus étendu des cinq : c'est la taille de la reconstruction, pas
une mesure du Black Whale.

```
x = (svg.x - 500) × 0,35     x d'avant en arrière, proue en -x
z = (svg.y - 300) × 0,35     z en travers, z = 0 est l'axe du navire
y = elevation                +y vers le haut
```

**Quel axe est lequel, ce sont les coques qui le disent**, et elles le disent
deux fois. Chacune est un corps parallèle entre deux calottes arrondies aux
extrémités de `x`, et chaque calotte est symétrique par rapport à `z = 0` : des
flancs droits et deux bouts ronds, c'est-à-dire une proue et une poupe. Et les
deux calottes diffèrent l'une de l'autre — 28,9 m d'effilement à l'avant du pont
3, 34,1 m à l'arrière — là où une coque symétrique par rapport à son axe ne
saurait distinguer un bord de l'autre. Quant au sens, le seul local que quelqu'un
ait placé dans les dents de la baleine, le bureau de la famille Xi-Yu « section
avant », est en `x −63 … −7` : la proue est en `−x`.

Ce dossier a longtemps lu ces axes à l'envers, et plusieurs **noms de pièces le
portent encore** : `Forward Corridor`, `Aft Promenade`, `Starboard Forward
Floor` désignent l'axe court comme s'il allait de la proue à la poupe. Rien
n'est déplacé pour autant — la géométrie est le relevé des plans et elle est
juste ; ce sont les noms qui parlent d'un navire tourné d'un quart de tour. La
seule chose que l'erreur avait réellement faussée, c'est la coupe d'ensemble,
qui était prise en travers du navire : voir [La coupe
longitudinale](#la-coupe-longitudinale).

Le corollaire est **la vitesse de marche**, et il est dans
`apps/web/src/lib/tour/navigation.ts` : `WALK_SPEED = 2,1 m/s`, la course à
6 m/s. L'échelle a été choisie pour que ces pièces soient des pièces qu'on
parcourt à pied ; un visiteur qui traverse à 6 m/s — quatre fois la marche
humaine — rend à la salle de banquet la taille que le facteur 0,35 lui refusait,
et les 157 m publiés ici ne veulent plus rien dire à l'écran. La foulée
(`STRIDE`) est la même constante qui compte les pas et le tangage de la tête,
tous deux comptés sur la **distance parcourue** et non sur l'horloge, et la trame
de tôles du pont (`PLATE_PITCH`) passe sous le pied une fois par foulée : c'est
elle qui donne à l'œil de quoi mesurer une halle.

Les ponts s'empilent dans l'ordre de la coupe du chapitre 349, le Tier 1 en
haut :

| Pont | `elevation` | Plafond par défaut |
| ---- | ----------- | ------------------ |
| 1    | 128 m       | 5 m                |
| 2    | 96 m        | 5 m                |
| 3    | 63 m        | 6 m                |
| 4    | 31,5 m      | 4,5 m              |
| 5    | 0 m         | 4,5 m              |

### L'écart entre deux ponts est compté, pas choisi

Ces élévations viennent des **41 ponts** du navire, et c'est le seul chiffre du
dossier qui puisse les donner : la coupe du chap. 349 dit dans quel ordre les
cinq tiers s'empilent, jamais de combien. Le compte se pose une fois :

- la reconstruction tient **7 planchers** : les cinq tiers, plus les deux ponts
  du paquebot (`tier-1-b`, `tier-1-c`) ;
- **10 restent au-dessus** du dernier, dans la superstructure que le chap. 369
  montre étagée d'une douzaine de niveaux et dont on tient trois ;
- **24 se répartissent dans les quatre bandes** entre les tiers, soit **six
  ponts par bande**.

Un pont du navire vaut **4,5 m**, la hauteur sous plafond des deux ponts bas du
blueprint. Six ponts font donc **27 m** entre le plafond d'un tier et le
plancher du suivant, et la coque monte à **144 m** pour 318 m de long.

Le pas de 18 m que ce dossier a longtemps porté ne tenait pas ce compte : il
laissait 12 à 13 m entre deux tiers, c'est-à-dire trois ponts là où il en fallait
six, et une coque de 88 m — un navire trois fois et demie plus long que haut,
quand la page en dessine un deux fois. La proportion de la page et le nombre de
ponts du manga disaient donc la même chose, contre le pas de 18 m ; c'est la
coupe reprise dans le bon axe qui a rendu le désaccord visible.

Le pont 1 n'est pas un plancher mais un paquebot, et il porte trois ponts à lui
seul : voir [Les ponts du paquebot](#les-ponts-du-paquebot).

## Les cartes de ponts sont générées

Les cartes de ponts de `/ship` — `apps/web/src/lib/assets/maps/tier-*.svelte`,
une par pont et non par tier — ne se retouchent pas à la main. Elles se
régénèrent :

```
python3 scripts/generate-deck-maps.py
```

Elles sont dessinées dans le repère ci-dessus, qui est celui du blueprint : une
pièce atterrit donc sur la carte exactement là où la reconstruction la met, et
toutes les pièces y atterrissent, pas la douzaine qu'une carte dessinée à la
main avait la place de nommer. Ce qui reste écrit à la main, c'est
`apps/web/src/lib/map/mapAssetRegistry.ts` : quelle région ouvre quel plan de
salle.

C'est ce qui fait que `/ship` et `/tour` ne peuvent plus se contredire — ils
projettent la même source. Encore faut-il que le fichier généré et commité
suive : `apps/web/src/lib/assets/maps/deckMaps.test.ts` relit chaque carte et la
confronte au blueprint, coque comprise, coin par coin. Déplacez une emprise
sans relancer le script et c'est un test qui tombe, pas un lecteur qui s'en
aperçoit.

## La coupe longitudinale

La vue d'ensemble de `/ship` est elle aussi générée, et depuis le même fichier :

```
python3 scripts/generate-section-map.py
npx prettier --write apps/web/src/lib/assets/maps/black-whale-overview.svelte
```

C'est le dessin que les plans de pont ne savent pas faire. Un plan de pont dit
ce qui jouxte quoi sur un étage ; la coupe du chap. 349 dit ce qui est **au-dessus
de quoi**, et la reconstruction n'avait rien qui l'énonçait. La vue d'ensemble
qu'elle remplace était cinq dalles dessinées à la main : elle ne nommait aucune
pièce, elle ne sortait d'aucune donnée, et sa baleine était une silhouette.

La coupe est prise dans l'axe, `z = 0`, regard vers tribord, proue à gauche.
Elle a **son échelle**, dérivée, et le script l'imprime en tournant : 0,349 m
par unité, à un millimètre de celle des plans de pont, parce que la coque
remplit la largeur de ce dessin comme elle remplit la leur.

Ce plan-là n'est pas un détail. La coupe a d'abord été prise sur `x = 0`, qui
est une **coupe au maître-couple** : elle montrait les 175 m de large de la
baleine là où la page montre ses 318 m de long, et personne ne l'a vue parce que
les deux axes se rétrécissent de la même façon vers les ponts extrêmes. Ce sont
les coques qui tranchent, et l'argument est dans [Repère et
échelle](#repère-et-échelle). Ce qui a changé en la reprenant dans le bon axe :
la proue s'effile au lieu d'être un chanfrein, la poupe porte le décrochement du
pont 5 que la page dessine près du gouvernail, et le navire est trois fois et
demie plus long que haut au lieu de deux.

Elle distingue trois choses, et c'est toute la question :

- les pièces que la coupe **traverse** : pleines, libellées là où le libellé
  tient, et cliquables ;
- les pièces qu'elle **longe**, à bâbord ou à tribord : dessinées derrière et
  en sourdine. Ce sont elles, les bandes de texture dont la double page du
  chap. 349 est remplie — de vraies pièces, et non une trame ;
- les ponts que la reconstruction **ne tient pas** : la bande entre le plafond
  d'un pont et le plancher du suivant. Le vaisseau en compte 41 et la visite en
  parcourt cinq, donc six ponts — 27 m de navire — dorment entre chacun d'eux.
  Cette bande est ce qui fixe les élévations plutôt que l'inverse ; rien ne la
  dessinait, donc rien ne la disait. Rien n'y est posé non plus : la coupe montre que la place
  est pleine, et ne dit pas un mot de ce qui la remplit.

Une pièce qui **pose un mur** dans l'axe n'est pas coupée par lui. Le tribunal
et le poste de police partagent ce mur-là, un de chaque côté : compter le
contact pour une coupe les mettait tous les deux dans la coupe, et l'un sur
l'autre.

Deux traits ne sortent pas du blueprint et sont écrits dans le script avec leur
source : la **flottaison**, relevée sur la page du chap. 349, qui est un fait du
navire et non d'une pièce ; et l'**œil**, que la même page place bas et à
l'avant, et qui n'ouvre rien.

### Le pont 1 est un paquebot, et on en tient un étage

L'extérieur de nuit du **chap. 369** montre le vaisseau du pont 1 du dehors :
une coque percée de deux ou trois rangs de hublots, et par-dessus une
superstructure étagée en gradins, une dizaine de niveaux sur le bloc le plus
haut. Le pont 1 n'est donc pas un plancher, c'est un navire à ponts multiples.

Un seul de ses étages a un plan de sol dessiné, et c'est la chaîne
ininterrompue **Quartiers du Roi → Salle de réception → Quartiers princiers**,
avec son vestibule (chap. 383) et son poste gardé (chap. 382 / 363) entre les
blocs. Elle court sur 192 m des 249 m de la coque du pont 1 : aucun gradin ne
fait cette longueur, donc **le pont royal est un pont bas du paquebot**, au
niveau de la coque ou juste au-dessus. Ça se pose comme fait et ça contraint
l'empilement.

Tout le reste de ce que le blueprint met sur le pont 1 — casino, bloc VVIP,
chambrées, quartier de détention, Cour suprême, canots, chambre funéraire — ne
sort d'aucun plan de sol : soit de la coupe du chap. 349, qui nomme le **tier**
et pas l'étage, soit d'une planche qui montre la **pièce** et pas son plancher,
soit du plan `/ship` lui-même. Les poser au niveau de la salle de banquet est
une affirmation que personne n'a dessinée, et c'est le blueprint qui la fait
aujourd'hui, en donnant `elevation: 72` à ses 85 espaces sans un seul lien
vertical entre eux. Deux choses la contredisent déjà de l'intérieur : la
chambre funéraire dépasse de 13,6 m la coque de son propre pont, par le travers,
et quatre pièces y réclament 7 à 9 m de plafond sur un pont qui en annonce 5.

La coupe dit donc ce qu'elle sait et pas plus : la bande au-dessus du dernier
pont du paquebot est **ouverte en haut**, dégradée jusqu'au bord du dessin. La
fermer à une hauteur serait affirmer la taille du paquebot, et la page en donne
la forme, pas l'échelle.

### Les ponts du paquebot

Le pont 1 est donc découpé. `parentTierId` dit lesquels de ces ponts sont un
seul tier : `tier-1` est le pont royal, `tier-1-b` et `tier-1-c` sont deux ponts
au-dessus de lui, et tous les autres ponts du navire sont un tier à eux seuls et
portent `null`.

| Pont       | Élévation | Ce qu'il porte                                     |
| ---------- | --------- | -------------------------------------------------- |
| `tier-1-c` | 141,1 m   | casino, bloc des reines                            |
| `tier-1-b` | 137,6 m   | chambrées, quartier de détention, Cour suprême     |
| `tier-1`   | 128 m     | la chaîne royale, les canots, la chambre funéraire |

Trois règles, et elles se lisent dans l'ordre :

1. **Ce qu'un dessin met sur un plancher y reste.** La chaîne royale est un seul
   pont parce qu'une page la dessine ainsi, d'un bout à l'autre.
2. **Le reste est empilé par taille**, le plus grand au plus bas. Aucune page ne
   dit lequel de ces blocs est à quel étage : ce classement est le fait de la
   reconstruction, et la `source` de chaque pont le dit en toutes lettres, sans
   citer de chapitre — un pont `inferred` qui citerait une planche prétendrait à
   une preuve qu'il n'a pas.
3. **Ce qui touche le bordé ne monte pas.** Les canots sont à `x ±133`, au-delà
   de la proue et de la poupe du pont 1 (`−126,87 … 122,5`), et la chambre
   funéraire à `z −83,6` quand le pont 1 s'arrête à `−70` par le travers. Un
   pont en gradin est plus court par définition : ils restent en bas.

Le premier pont au-dessus du pont royal ne commence pas 3,5 m plus haut mais à
**137,6 m**, au-dessus des 9 m de la salle de banquet. Ce n'est pas un
arrangement : c'est la raison pour laquelle un paquebot met ses volumes à double
hauteur en bas de sa pile.

La **coque de chaque pont dérive de ce qu'il porte** — son emprise plus une
marge de circulation, écrêtée à celle du pont 1. Les gradins sortent donc du
contenu et non d'un profil relevé au décimètre sur un tramé : un pont qui porte
deux blocs est plus court que celui qui porte quatorze appartements, et c'est
tout ce que la silhouette du chap. 369 est en mesure de soutenir.

Trois choses ont dû être **inventées**, et portent toutes `inferred` :

- **les planchers laissés vides** sur le pont royal. Un bloc qui monte
  n'emporte pas son sol : `/tour` tire ses portes des murs partagés, et le trou
  couperait la promenade bâbord du reste du navire ;
- **une coursive par pont**, sans laquelle un pont n'est pas un plancher mais
  des salles qui ne se rencontrent jamais. Elles se tiennent au-dessus de la
  coursive tribord que le pont royal porte déjà, pour que les escaliers tombent
  d'aplomb ;
- **deux escaliers**. Un pont que personne n'atteint est un décor, et
  `validateBlueprint` le refuse.

La traverse du pont des hôtes passe **derrière** le bloc des reines et non le
long de ses chambres : une chambre de reine n'ouvre que sur son couloir, donc
une coursive posée contre son mur extérieur atteint un mur et pas une porte.

Rien de tout ceci ne touche `data/locations` : un passager tient son pont du
préfixe `tier-1-` de son slug de lieu, jamais du blueprint. `deck: 1`,
`shipLocation.tier: 1` et les cinq boutons de `/ship` sont inchangés — le
découpage est de la géométrie.

`sectionMap.test.ts` tient ce dessin au blueprint comme `deckMaps.test.ts` tient
les plans de pont, bande de ponts non reconstruits comprise. Il tient aussi
`tierOverviewY` et `tierOverviewBand` de
`apps/web/src/lib/components/map/markerProjection.ts` : en coupe, un pont a la
hauteur qu'il a vraiment, et une foule qui s'étale sans le savoir met des
passagers dans un pont où ils ne sont pas.

## Structure

- **`tiers`** — un pont : son élévation, sa hauteur sous plafond par défaut et
  le tracé de sa coque, échantillonné depuis les courbes de Bézier du plan.
- **`spaces`** — un volume que le visiteur peut traverser. `footprint` est un
  polygone simple fermé (le dernier point n'est pas répété), concave autorisé.
  `ceiling` à `null` reprend celui du pont.
- **`links`** — les liaisons **verticales** seulement (escaliers, sas, cloisons
  entre ponts). Ce sont les seules connexions qui portent une position, parce
  que les deux espaces ne partagent aucun mur.

Les **piliers** ne sont pas stockés non plus : `columnPositions` en pose une
grille dans tout espace de plus de 420 m², parce qu'une salle de cette portée
serait bâtie sur poteaux et qu'un volume vide ne donne au visiteur aucun repère
de distance. Le rendu et les collisions lisent la même fonction : un pilier
qu'on voit est un pilier qu'on contourne.

Deux dérivations de plus, du même ordre et déclarées ici pour la même raison —
elles sont vraies du **vaisseau** et non de la donnée :

- **Les luminaires** (`ceilingLamps`, écart de 8 m). Rien dans le blueprint ne
  dit qu'un couloir est éclairé, pas plus qu'il ne dit qu'une halle a des
  poteaux. Aucune géométrie n'est ajoutée : `mesh.ts` cuit leur éclairement dans
  l'attribut de couleur que le pont téléverse déjà. Une pièce `inferred` n'en
  reçoit presque rien — les plans n'ont jamais posé de lampe dans un couloir que
  personne n'a dessiné —, ce qui rend la provenance sensible en marchant plutôt
  que lisible dans une légende.
- **La trame de tôles** (`plateSeams`, `PLATE_PITCH` de 1,2 m), posée sur la
  grille du vaisseau et non sur celle de la pièce, pour que les cours traversent
  une porte au lieu de recommencer à chaque seuil : le bordé a été posé avant les
  cloisons.

L'**air** et l'**acoustique** de chaque pièce se dérivent aussi, dans
`apps/web/src/lib/tour/atmosphere.ts` : la densité du brouillard vient de la plus
longue corde du contour, le RT60 de l'équation de Sabine sur le volume et la
surface que le blueprint donne déjà. Là encore, aucun champ nouveau — un cabinet
de 12 m² sonne à 0,5 s et une coursive de 6 500 m² à 4 s, et c'est la donnée
existante qui le dit.

Il en va de même des **structures** : leurs faces rejoignent les murs de la
pièce, sauf pour ce qui est suspendu au-dessus de la tête. Un solide dont le
dessous dégage 2,10 m est dessiné là où il pend et n'arrête personne au sol —
sans quoi la mezzanine du casino condamnerait les boutiques qu'elle abrite, les
loges de la salle de projection barreraient les allées latérales qu'elles
surplombent, et le rideau de scène serait un mur en travers de l'avant-scène.
C'est `blocksTheFloor` qui tranche, et un test vérifie les deux sens.

### Les deux niveaux d'une pièce

Un pont est un plan, partout où rien ne dit le contraire — et rien ne le dit
presque partout. Deux planches le disent pourtant, et elles ne parlaient jusqu'ici
à aucun champ du dossier.

**`floor`** est la marche. La salle de banquet est entrée par le bout du service,
et le sol des tables est une marche plus haut : ça ne se dit pas d'un polygone,
une empreinte n'a qu'une hauteur. Les deux niveaux sont donc deux espaces, et
`floor` est ce qui en fait deux niveaux plutôt que deux salles côte à côte. Le
bout du service porte `-0,6` et un plafond relevé d'autant, pour que le plafond
file de niveau au-dessus des deux — c'est ce que la planche dessine. Ce qui suit
en découle et n'est écrit nulle part ailleurs :

- la **contremarche** est dessinée dans l'ouverture, depuis le côté haut : sans
  elle le sol des tables finirait en l'air au-dessus de l'autre ;
- le visiteur **monte** dessus au lieu d'y être téléporté — la hauteur d'œil
  rejoint le sol de la pièce où il se tient en un cinquième de seconde, la durée
  d'une foulée sur une marche, parce qu'une vue qui saute d'un demi-mètre est
  exactement ce que `$lib/tour/comfort` refuse ;
- au-delà de `STEP_UP` (0,60 m) entre deux pièces qui partagent une porte,
  `validateBlueprint` refuse : ce n'est plus une marche mais une chute déguisée
  en porte, et ce qu'il faut alors est un `link` avec un escalier dessus.

**`lantern`** est le même argument une surface plus haut. L'atrium du poste de
police n'a pas un plafond plus haut : il a un **lanternon** au milieu, et lire sa
hauteur comme celle de la pièce perd à la fois le caisson et l'échelle qu'il donne
à tout ce qui est dessous. Un lanternon est un rectangle du plafond soulevé de sa
`rise` : la bordure reste où le plafond était, le panneau monte, et les quatre
côtés entre les deux sont ce que l'œil mesure d'en bas. C'est un **vide** : rien
n'entre dans la liste des collisions, on marche dessous comme sous un plafond
plat. La pièce doit être rectangulaire — c'est ce dans quoi une planche en dessine
un, et c'est ce que la découpe du plafond sait faire.

### Les enveloppes

Un appartement princier, ce sont sept pièces derrière **une seule** porte.
L'appartement lui-même est posé isolé dans la cour que ferme la cloison
intérieure : toutes ses faces donnent sur un sol qu'on parcourt, et aucune ne
s'ouvre — un prince rejoint sa suite par la porte numérotée qui lui est
assignée et par nulle part ailleurs. Le secteur est fermé par un mur à
l'arrière pour que le poste de garde de l'avant en reste la seule entrée.

`envelope` dit ça une fois pour toutes. Deux espaces d'enveloppes différentes ne
communiquent jamais — sauf si une entrée de `doors` l'énonce. Sans cette
notion, il aurait fallu sceller une trentaine de murs un par un et se souvenir
de le refaire à chaque retouche du plan.

### Les portes explicites

`doors` place une ouverture à la main plutôt qu'au milieu du mur partagé. Trois
usages :

1. Ouvrir l'entrée d'une enveloppe — rien d'autre ne peut le faire.
2. Poser une porte là où le plan la dessine : la porte des domestiques est dans
   l'angle près du salon, pas au centre de la cloison.
3. Ouvrir un mur **sur toute sa longueur**, quand le plan ne dessine pas là un
   mur. C'est le cas des cellules : le plan du quartier de détention VIP comme
   celui de la cellule de haute sécurité tracent toute la façade de chaque
   cellule en barreaux. L'ouverture fait donc la largeur de la façade, il ne
   reste aucun mur à cet endroit, et ce qui ferme la cellule est la grille qui
   s'y dresse — une structure de type `bars`, percée d'une porte au milieu.

### Les portes ne sont pas stockées

Hors enveloppe et hors `doors`, deux espaces qui partagent une portion de mur
communiquent ; un espace qui n'en partage aucune est scellé. Les ouvertures sont calculées au chargement par
`deriveDoorways` à partir de la seule géométrie.

C'est délibéré : on ne peut pas laisser traîner une porte qui ne mène nulle
part après avoir déplacé une cloison de deux mètres. En revanche une salle
devenue inaccessible fait échouer `validateBlueprint`, donc la suite de tests.

Le revers est qu'une ouverture calculée peut tomber sur ce qui se dresse contre
le mur : la salle de banquet et la promenade bâbord partagent un mur, et la
porte que la géométrie y centrait ouvrait au milieu de la scène. C'est un
`seal` — la scène occupe ce mur sur toute la profondeur de la salle, et on
entre par le vestibule. Un mur aveugle est une affirmation sur le navire, donc
il est écrit, avec sa raison, plutôt que deviné.

### `locationId`

Rattache un espace à `data/locations/locations.json`, pour que la visite et le
catalogue parlent du même lieu. `null` signifie que le catalogue ne tient
aucune fiche pour cet espace — le plus souvent parce que la reconstruction l'a
inventé, parfois parce qu'une planche montre un lieu que le catalogue n'a pas
encore, comme le poste gardé à l'entrée des quartiers princiers. Plusieurs
espaces peuvent partager un `locationId` : le pont des canots a une moitié
bâbord et une moitié tribord pour une seule fiche.

### `provenance` — ce que le manga soutient vraiment

| Valeur     | Sens                                                                  |
| ---------- | --------------------------------------------------------------------- |
| `panel`    | Une planche montre la salle ; sa forme y est relevée.                 |
| `plan`     | Elle figure sur la coupe du vaisseau, qui n'en donne pas l'intérieur. |
| `map`      | Aucune page ne la montre ; le plan de salle de `/ship` la dessine.    |
| `inferred` | Rien ne la montre, pas même la carte. Elle est là pour la continuité. |

C'est la même exigence que `positionProvenance` dans
[`../CONVENTIONS.md`](../CONVENTIONS.md) : la reconstruction doit avouer ce
qu'elle invente. Les surfaces `inferred` sont rendues dans une teinte froide et
portent un badge dans l'interface — un couloir déduit ne doit jamais passer
pour du canon. `source` est obligatoire dans tous les cas ; pour `inferred`,
elle dit pourquoi l'espace a été ajouté, et ne doit pas citer de chapitre. Une
source `map` non plus : elle nomme le plan `/ship` dont elle sort.

`sourceFr` la double en français, comme `nameFr` double `name` — de même
`reasonFr` pour les `doors` et les `seals`. Ces phrases ne sont pas des notes
internes : [`/tour/sources`](../../apps/web/src/routes/tour/sources) les publie
telles quelles, espace par espace, et c'est la page qui répond à _« d'où sortez-vous
tout ça ? »_. Une source laissée en anglais s'y lirait comme une note de bas de
page étrangère sur une page française ; `validateBlueprint` la refuse donc, et
un test vérifie en plus qu'une même source anglaise n'est jamais traduite de
deux façons.

## Les intérieurs

Le plan des ponts dessine les chambres des princes comme une colonne de petites
boîtes. C'est un diagramme de voisinage, pas un relevé : le plan d'appartement
donne sept pièces à chaque prince, et sept pièces n'entrent pas dans une boîte
de 17 × 5 m. Les deux dessins ne sont pas à la même échelle, et ils ne l'ont
jamais été.

Plutôt que d'en déformer un pour le faire entrer dans l'autre, la visite garde
les deux. Le pont conserve **exactement** l'empreinte que le plan dessine — la
carte `/ship` et la visite montrent le même pont 1 — et l'intérieur est un
**niveau à part**, tracé à sa taille réelle, dans lequel on entre par la porte.
C'est la structure de `/ship` (plan de pont → plan de salle), en volume.

Trente-six pièces ont ainsi leur intérieur : les quatorze appartements
princiers, les neuf plans de salle qui comptent plus d'une pièce — quartier
de détention VIP, cellule de haute sécurité, quartiers des soldats, bureau de la
Justice, hôpital central, cinéplexe, bureau Cha-R, cabines standard, cabines de
première classe — puis
trois volumes qu'aucune boîte de pont ne peut contenir : le salon du Roi, que le
chap. 382 montre du sol au plafond ; la chambre funéraire, dont le plan de
salle donne une rotonde de vingt mètres là où le pont ne réserve qu'un tambour
de seize, où un cercueil de 2,2 m frôlerait le mur ; et la suspension de la
coque du chap. 406, dont les ressorts font trois fois la hauteur d'un pont. Le
pont 4 en ajoute deux du même ordre : la salle de conférence de l'Armée royale,
à qui le pont réserve 52 × 52 m quand son plan dessine une salle de 20 × 15
autour d'une seule table, et le bureau Xi-Yu et son entrée gardée. Le pont 3 en
ajoute quatre : la chambre 3101 et sa salle de bains anormale, le poste de
police et sa fontaine, le tribunal, et le bureau Heil-Ly. Le pont 2 en ajoute
un : la planque des Heil-Ly, dont le plan donne cinq pièces derrière une porte
que le chap. 356 dit dissimulée sans dire où. S'y ajoute un canot de
sauvetage : le chap. 383 en montre l'intérieur, et une capsule de cinq mètres
n'est pas une salle du pont mais un volume posé dessus, dans lequel on entre
par son écoutille. Le pont 4 en ajoute un dernier, qui ne sort d'aucun plan de
salle : le bloc des passagers ordinaires, dont une planche signale le portail
d'un `SRCL 9041 – 9488` et montre derrière lui une coursive à portes des deux
côtés. Les 22 autres plans locaux ne dessinent qu'une salle, que le pont porte
déjà.

Chaque plan a **sa propre échelle**, choisie sur ce que ses pièces doivent
mesurer pour être parcourues — une cabine standard de 6 m — c'est-à-dire
précisément la mesure que les plans de pont schématiques ne portent pas. Quand
une planche, elle, donne cette mesure, c'est elle qui l'emporte : la couchette
de la cellule de première classe occupe la moitié de son mur au chap. 373, ce
qui donne une cellule de 5,5 × 4,5 m là où le plan lu à sa propre échelle en
donnait une de 12,5 × 10. Tout le quartier de détention est descendu avec elle.

Le rapport des côtés vient du plan lui aussi, et pas seulement les tailles :
l'appartement princier est **en portrait**, 21 × 25 m, parce que son plan l'est
— il a longtemps été carré, ce qui était une affirmation sur l'appartement que
rien ne soutenait.

Un niveau d'intérieur porte `kind: "interior"` et `parentSpaceId`, la pièce dont
il est le dedans. Un `link` de type `door` les relie. Ce lien est le seul à
porter **deux** positions, `at` et `atTo` : ses deux extrémités vivent dans des
repères différents, le pont d'un côté et l'intérieur de l'autre, qui a sa
propre origine.

Le plan d'appartement cloisonne la cuisine de tous les côtés. Une cuisine où
personne ne peut entrer est un lapsus de dessin, pas une affirmation sur le
vaisseau : la visite ouvre la seule porte qu'elle doit avoir, sur la salle à
manger qu'elle dessert. C'est consigné dans le `reason` de la porte.

## Les structures

`structures` pose un solide **dans** un espace : on le voit, on le contourne,
on ne le traverse pas.

La visite ne **décore** pas : elle n'invente jamais la place d'une chaise. Elle
ne pose un volume que dans deux cas.

Le premier : **un dessin l'y met**. Le plan d'appartement princier dessine les
lits, les canapés, la table à manger et la cuisine — c'est un relevé, pas de
l'ameublement, et ces meubles portent donc la source du plan. Ce plan-là est
encarté sur la double page du chap. 363, celle de la zone d'habitation vue en
coupe, avec ses sept pièces nommées : salle du personnel, cuisine, salle à
manger, salon, chambre du prince, salle d'eau. C'est donc une planche, et la
provenance est `panel` — elle a longtemps porté `plan` par excès de prudence,
ce qui revenait à ranger un dessin de Togashi au rang de la coupe qui n'entre
dans aucune pièce. La même page dessine **deux cloisons**, et c'est la
disposition que le pont 1 tient maintenant. La première, extérieure, est celle
que les gardes longent : leur chemin de ronde fait le tour du bloc, et le poste
gardé de l'avant en est la seule entrée. La seconde, intérieure, porte les
quatorze **portes numérotées**, impairs à tribord et pairs à bâbord. Derrière
elle, les quatorze appartements ne se touchent pas : ce sont quatorze boîtes
posées dans une cour, avec un écart entre elles qu'on parcourt, un dégagement
de 3 m entre chaque porte numérotée et la porte de l'appartement qui lui fait
face, et un couloir au dos des deux rangées. C'est ce qui donne à chaque
appartement **une seule** entrée : ses trois autres faces regardent la cour.
La reconstruction a longtemps rangé ces boîtes en deux terrasses accolées le
long de deux coursives, ce qui faisait de la page un diagramme de voisinage
alors qu'elle dessine des volumes séparés. Les quatorze appartements sont le
même plan : le jeu de meubles est authoré une fois, dans le repère de
l'appartement, et répété pour chaque prince.

Quelques-uns en portent davantage, et c'est l'ordre d'autorité qui le veut : là
où une planche entre dans une pièce, elle l'emporte sur le plan, et ce qu'elle
montre s'ajoute au jeu commun pour ce seul appartement.

- Le **1014**, celui de Woble : le chap. 360 montre son salon tel que Kurapika
  le trouve — le téléphone mural par lequel il appelle Biscuit, l'armoire et la
  table de présentation le long du mur tribord, le fauteuil canné, les deux
  sellettes à sculpture, les tableaux encadrés du mur lambrissé. Le chap. 367
  descend dans sa cuisine — le plan de travail sous ses éléments hauts vitrés,
  et un plancher là où le reste de l'appartement est carrelé — et le chap. 371
  se tient dans sa salle à manger pendant que Kurapika y arrête une servante :
  deux longues tables couvertes de plateaux-repas, et non la petite table du
  plan. Là aussi la planche **corrige** au lieu d'ajouter.
- Le **1010**, celui de Kacho : le chap. 376 dessine sa cuisine deux fois — les
  éléments hauts au-dessus du plan, la plaque et son four encastré, le retour de
  plan le long du mur tribord — et son salon, où on la fait asseoir sur ses
  devoirs devant un mur lambrissé à tableaux. La rangée de placards bas n'est
  pas du décor : le morse de Senritsu en désigne un, cuisine, à gauche, en bas,
  au fond.
- Le **1003**, celui de Zhang Lei : le chap. 365 montre sa salle à manger, où
  il reçoit la reine Oito. Le jeu commun y posait une table de 1,6 × 2,4 ; la
  planche en donne une longue table sculptée avec un fauteuil à haut dossier à
  chaque bout, et autour la crédence, la statue sur sa sellette, le cadre au
  mur et le guéridon. C'est le cas où la planche ne complète pas le plan mais
  le corrige : la table du 1003 est **refaite**, pas doublée, parce que deux
  tables ne peuvent pas tenir la même place.
- Le **1005**, celui de Tubeppa : le chap. 366 montre son salon rendu à son
  travail — le bureau devant lequel elle s'assied, son siège, les tableaux
  blancs couverts d'équations le long du mur tribord, le panneau de feuilles
  épinglées. Le jeu commun n'est pas touché : il tient l'autre bout de la
  pièce, et c'est bien ce que la planche montre — un salon dont un bout est
  devenu un cabinet de travail, pas un salon remplacé.

Les autres appartements gardent le jeu du plan, parce qu'aucune page ne les
montre. Ce n'est pas une inégalité de traitement : c'est le dossier qui dit ce
qu'il sait, pièce par pièce.

Il vaut pour tout plan de salle, pas seulement celui des princes : les douze
couchettes que chaque chambrée de soldats et chaque salle des Hunters
provisoires dessine, le lit que chaque chambre de reine porte contre le mur
opposé à sa porte, les deux piliers de la zone 37564, les galeries et la
colonnade de l'atrium du poste de police. Ces volumes-là portent la provenance
`map` et nomment le plan dont ils sortent. Le plan de salle est schématique, lui
aussi : il dit combien de couchettes et en quelles rangées, pas à quel
centimètre — la reconstruction garde le compte et les rangées, et écarte les
allées de quoi passer, exactement comme elle donne un pas de six mètres aux
tables du banquet.

Il vaut aussi pour ce qu'une **planche** meuble : le salon du Roi et ses sièges
appariés, ses tableaux et sa baie (chap. 382), la couchette, le lavabo et le
cabinet de la cellule de première classe (chap. 373), la couchette de la
cellule de haute sécurité et la table basse où repose la boisson de Beyond,
avec, de l'autre côté des barreaux, le banc de la garde, sa table, son étagère
et son poste mural (chap. 359). Le petit mobilier reste dehors : une lampe
qu'on ne peut pas traverser fait d'une chambre un labyrinthe. Deux exceptions,
et elles ont la même raison que l'entrave de Beyond : le téléphone mural du
1014 et l'interphone du poste de garde. Ce qui se joue dans ces deux pièces-là
se joue debout devant eux.

Le second : **ce qu'une planche montre est ce que la pièce est** —

- la chambre funéraire est une couronne de quatorze cercueils autour d'un
  reliquaire (chap. 371) ;
- la salle de banquet est sa scène, l'estrade du trône, les tables rondes du
  banquet inaugural (chap. 359) et le buffet qui la sert (chap. 383) ; les
  soixante-douze tables sont posées en quatre rangées, l'allée du trône laissée
  libre entre la deuxième et la troisième — la planche montre des rangées de
  tables rondes, la reconstruction leur donne un pas de six mètres ;
- le réfectoire du pont 5 est ses longues **planches basses** en rangées
  (chap. 377), et pas un banc autour : la vue d'ensemble montre les convives
  assis à même le pont le long d'elles, et l'estrade de la Brigade au milieu est
  basse pour la même raison. La reconstruction leur avait donné des tables à
  0,75 m et des bancs à 0,45 — c'était meubler une cantine, pas lire la planche ;
  les bancs sont retirés et les tables descendues à 0,35 m. La salle est aussi sa
  **charpente** (chap. 371) : fermes, passerelles et gaines si haut au-dessus de
  la foule que les 4,5 m du pont ne peuvent pas les porter — la salle reçoit 9 m,
  au même titre que la mezzanine vaut ses 8 m au casino, et la poussière qui
  flotte dans les grands vides du vaisseau y descend avec. Le couloir qui y mène
  n'est plus déduit : le chap. 371 le légende « couloir de passage vers le grand
  réfectoire », et y dessine l'échafaudage qu'une bande a mis en travers pour
  faire payer le passage, l'étal du clan Buor à côté, et les passagers campant le
  long des parois. La légende ne dit pas lequel des deux bouts de la salle elle
  désigne ; la reconstruction le place à l'avant et l'écrit ;
- le pont des canots est les capsules alignées sur leurs berceaux (chap. 383) ;
- la salle de projection est sa scène à cadre sous rideau, ses loges et son
  parterre (chap. 359) ;
- une salle du cinéplexe est son **écran** : le plan n'en dessine pas
  l'intérieur, mais il nomme les huit salles d'après l'écran qu'elles portent,
  et une salle appelée « Screen 4 » sans écran serait une pièce vide. L'écran se
  dresse sur le mur qui fait face à l'entrée. Les fauteuils, eux, restent
  dehors : aucun dessin n'en pose la place ;
- une capsule de sauvetage est sa couronne de sièges autour du mât (chap. 383) ;
- l'entrepôt du pont 5 est ses rangées de caisses, que son plan dessine et que
  la reconstruction pose dans les travées entre les piliers ;
- la zone 37564 est son **plafond** : le chap. 366 la dessine bondée, et ce
  qu'il y a à voir est au-dessus des têtes — les gaines et les chemins de
  câbles à nu, et le panneau qui pend sous eux. Ces volumes-là sont accrochés
  au-dessus de 2,10 m : on marche dessous, ils n'arrêtent personne. La même
  planche vaut pour ce qu'elle ne dessine **pas** : le sol est nu, les
  passagers s'assoient dessus. Le vide de cette salle n'est plus un silence du
  dossier, c'est une planche qui l'affirme — et c'est pour ça qu'il est écrit
  ici plutôt que laissé à deviner ;
- la cour des princes est aussi ce qui court **au-dessus** d'elle : le réseau de
  service que le cafard de Bill parcourt de suite en suite du chap. 367 au 369,
  et par une grille duquel le chap. 368 fait regarder la reine Oito. Il est posé
  sur le tracé que la feuille du chap. 369 dessine — une collectrice dans l'axe
  du bloc, une antenne en travers de la cour entre deux rangées, une dérivation
  par appartement — à la hauteur exacte où les grilles sont percées, pour qu'il
  arrive où elles sont. Ce n'est **pas** un niveau qu'on parcourt : la gaine est
  dessinée du point de vue d'un cafard, sa section est celle d'un cafard, et lui
  donner deux mètres sous plafond pour que la visite puisse y entrer serait
  inventer une coursive que rien ne montre. On marche dessous, comme sous les
  gaines du 37564 ;
- le casino VIP est sa salle de jeu, les devantures autour et la mezzanine
  au-dessus (chap. 405) — c'est la mezzanine qui lui donne ses 8 m sous
  plafond, aucune salle à galerie ne tenant sous les 5 m du pont ;
- le pont d'observation est la baie par laquelle il regarde dehors
  (chap. 380) : la planche la dessine incurvée, le plan des ponts dessine en
  biais le mur qui la porte, et la baie suit le mur ;
- une cellule est sa **grille** : les plans de détention dessinent toute la
  façade de chaque cellule en barreaux, et la cellule de haute sécurité est en
  outre l'entrave murale à laquelle le chap. 350 enchaîne Beyond Netero ;
- et l'espace entre la coque et le vaisseau est fait des ressorts qui portent
  l'un dans l'autre (chap. 406).

Une grille (`kind: "bars"`) est stockée comme **un seul** volume — sa `size`
donne la longueur de la travée et l'épaisseur de l'écran — parce que c'est ce
qu'elle fait : on la contourne, et on passe par la porte laissée à côté. Elle
est en revanche **dessinée** comme la rangée de montants qu'elle est, sous son
bandeau : une cellule dans laquelle on ne voit pas est une réserve. Les deux ne
peuvent pas diverger, `grilleBars` posant chaque montant à l'intérieur du
contour que les collisions lisent déjà.

Une bouche d'aération (`kind: "vent"`) est stockée comme le reste des services,
accrochée bien au-dessus des têtes : on ne la contourne pas, et elle n'ôte rien
au sol de la pièce. Elle est pourtant ce que la zone d'habitation **est**. Le
chap. 367 lâche le cafard de Bill dans les égouts qui courent sous le secteur,
et chaque prince sur lequel il renseigne ensuite est vu par une de ces grilles,
juste sous le plafond. Quatorze appartements ferment par quatorze portes qui
n'ouvrent nulle part ailleurs — c'est ce que dit `envelope` — et la grille est
le trou dans ce raisonnement : c'est par celle de la grande chambre du prince
Momoze que la reine Oito assiste à son meurtre au chap. 368. Le réseau lui-même
n'est pas un espace : rien ne le dessine à l'échelle d'un homme, et personne n'y
marche. Ce qui est dessiné, ce sont ses ouvertures, et ce sont elles qui sont
posées.

Les laisser de côté aurait dessiné un tambour vide, une halle vide et un hangar
vide — et affirmé en creux que les planches ne montrent rien.

Une structure porte donc **sa propre source** : la pièce peut reposer sur un
chapitre et ce qui s'y dresse sur un autre. C'est le cas de la chambre
funéraire, montrée au chap. 358 et dessinée ronde au chap. 371.

| Champ      | Sens                                                              |
| ---------- | ----------------------------------------------------------------- |
| `spaceId`  | L'espace où elle se dresse ; son niveau en découle.               |
| `at`       | Le centre, dans le repère du niveau.                              |
| `size`     | L'encombrement en `x` et en `z`, avant rotation.                  |
| `rotation` | En degrés, autour de son propre centre.                           |
| `sides`    | `null` pour un rectangle, sinon un polygone régulier à `n` côtés. |
| `base`     | Sa hauteur d'accrochage : 0 si elle pose au sol.                  |
| `height`   | Ce dont elle s'élève, mesuré depuis `base`.                       |

`sides` évite d'écrire quatorze quadrilatères à la main : les cercueils sont un
rectangle tourné vers le centre, les ressorts un seizième de cercle. `base` sert
à ce qui est accroché plutôt que posé — les tableaux du salon du Roi et la
grande baie du fond, que le chap. 382 dessine à hauteur d'homme et au-dessus.

Les faces d'une structure entrent dans **la même liste de murs** que celles de
la pièce : un ressort qu'on voit est un ressort qu'on contourne, exactement
comme un pilier. `validateBlueprint` refuse une structure qui déborde de sa
pièce, qui se dresse sur un pilier, qui occupe le point où le visiteur arrive,
ou qui se plante devant une porte — les portes étant déduites des murs
partagés, rien dans la pièce ne sait qu'elles sont là, et un comptoir posé en
travers laisserait une ouverture dessinée, franchie par le contrôle de
connexité, et close pour le visiteur. Deux
structures ne peuvent pas non plus se chevaucher, sauf si l'une contient
entièrement l'autre : c'est un mât sur son socle, pas deux volumes qui se
disputent le même sol.

### Le français

Chaque `source` et chaque `reason` a son pendant `sourceFr` / `reasonFr`, et
`nameFr` accompagne `name`. Une entrée non traduite — ou identique à l'anglais —
fait échouer les tests : sans ça, une fiche non traduite arriverait au lecteur
francophone sous forme de prose anglaise au milieu du panneau.

## Modifier le vaisseau

Ce fichier s'édite à la main, comme le reste de `data/`. Après toute
modification :

```bash
pnpm --filter @black-whale/web test
```

`validateBlueprint` vérifie qu'aucun espace n'en chevauche un autre sur le même
pont, que chaque `locationId` existe, que toute salle du catalogue présente à
bord est reconstruite, et que **le vaisseau entier reste connexe** — de la
chambre funéraire du pont 1 aux entrepôts du pont 5.
