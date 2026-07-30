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
0,35, on obtient un appartement princier de 12 × 7 m et une salle de banquet de
157 × 25 m sous 9 m de plafond, et les proportions des plans sont conservées
exactement. La coque reconstruite fait alors 175 m : c'est la longueur de la
reconstruction, pas une mesure du Black Whale.

```
x = (svg.x - 500) × 0,35     +x vers tribord
z = (svg.y - 300) × 0,35     +z vers la poupe
y = elevation                +y vers le haut
```

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
| 1    | 72 m        | 5 m                |
| 2    | 54 m        | 5 m                |
| 3    | 36 m        | 6 m                |
| 4    | 18 m        | 4,5 m              |
| 5    | 0 m         | 4,5 m              |

## Les cartes de ponts sont générées

Les cinq cartes de ponts de `/ship` — `apps/web/src/lib/assets/maps/tier-*.svelte`
— ne se retouchent pas à la main. Elles se régénèrent :

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
suive : `apps/web/src/lib/assets/maps/deckMaps.test.ts` relit les cinq cartes et
les confronte au blueprint, coque comprise, coin par coin. Déplacez une emprise
sans relancer le script et c'est un test qui tombe, pas un lecteur qui s'en
aperçoit.

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

### Les enveloppes

Un appartement princier, ce sont sept pièces derrière **une seule** porte. Ses
pièces jouxtent celles du voisin sur toute la cloison mitoyenne, et aucune de
ces cloisons n'est percée : un prince rejoint sa suite par le couloir gardé et
par nulle part ailleurs.

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
de 12 × 7 m. Les deux dessins ne sont pas à la même échelle, et ils ne l'ont
jamais été.

Plutôt que d'en déformer un pour le faire entrer dans l'autre, la visite garde
les deux. Le pont conserve **exactement** l'empreinte que le plan dessine — la
carte `/ship` et la visite montrent le même pont 1 — et l'intérieur est un
**niveau à part**, tracé à sa taille réelle, dans lequel on entre par la porte.
C'est la structure de `/ship` (plan de pont → plan de salle), en volume.

Trente-quatre pièces ont ainsi leur intérieur : les quatorze appartements
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
par son écoutille. Les 22 autres plans locaux ne dessinent qu'une salle, que le
pont porte déjà.

Chaque plan a **sa propre échelle**, choisie sur ce que ses pièces doivent
mesurer pour être parcourues — une cabine standard de 6 m, une cellule de 10 —
c'est-à-dire précisément la mesure que les plans de pont schématiques ne
portent pas.

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
dans aucune pièce. La même page range les quatorze appartements en deux
rangées de sept de part et d'autre du couloir gardé, impairs à tribord, et
c'est la disposition que le pont 1 tient. Les quatorze appartements sont le
même plan : le jeu de meubles est
authoré une fois, dans le repère de l'appartement, et répété pour chaque prince.

Trois en portent davantage, et c'est l'ordre d'autorité qui le veut : là où une
planche entre dans une pièce, elle l'emporte sur le plan, et ce qu'elle montre
s'ajoute au jeu commun pour ce seul appartement.

- Le **1014**, celui de Woble : le chap. 360 montre son salon tel que Kurapika
  le trouve — le téléphone mural par lequel il appelle Biscuit, l'armoire et la
  table de présentation le long du mur tribord, le fauteuil canné, les deux
  sellettes à sculpture, les tableaux encadrés du mur lambrissé.
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
- le réfectoire du pont 5 est ses longues tables en rangées (chap. 377) ;
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
