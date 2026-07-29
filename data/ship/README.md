# La reconstruction du Black Whale

`blueprint.json` est le vaisseau en tant que **géométrie**, et non en tant que
dessin. C'est ce que parcourt la visite virtuelle ([`/tour`](../../apps/web/src/routes/tour)).

Il ne remplace pas les plans SVG de `apps/web/src/lib/assets/maps` et ne touche
pas à la carte `/ship` : celle-ci répond à _qui est où à tel événement_,
celui-ci à _comment le vaisseau est bâti_. Aucun passager, aucun chapitre,
aucune chronologie n'entre ici.

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

Les ponts s'empilent dans l'ordre de la coupe du chapitre 349, le Tier 1 en
haut :

| Pont | `elevation` | Plafond par défaut |
| ---- | ----------- | ------------------ |
| 1    | 72 m        | 5 m                |
| 2    | 54 m        | 5 m                |
| 3    | 36 m        | 6 m                |
| 4    | 18 m        | 4,5 m              |
| 5    | 0 m         | 4,5 m              |

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

`doors` place une ouverture à la main plutôt qu'au milieu du mur partagé. Deux
usages :

1. Ouvrir l'entrée d'une enveloppe — rien d'autre ne peut le faire.
2. Poser une porte là où le plan la dessine : la porte des domestiques est dans
   l'angle près du salon, pas au centre de la cloison.

### Les portes ne sont pas stockées

Hors enveloppe et hors `doors`, deux espaces qui partagent une portion de mur
communiquent ; un espace qui n'en partage aucune est scellé. Les ouvertures sont calculées au chargement par
`deriveDoorways` à partir de la seule géométrie.

C'est délibéré : on ne peut pas laisser traîner une porte qui ne mène nulle
part après avoir déplacé une cloison de deux mètres. En revanche une salle
devenue inaccessible fait échouer `validateBlueprint`, donc la suite de tests.

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
| `inferred` | Rien ne la montre. Elle existe pour que le pont soit continu.         |

C'est la même exigence que `positionProvenance` dans
[`../CONVENTIONS.md`](../CONVENTIONS.md) : la reconstruction doit avouer ce
qu'elle invente. Les surfaces `inferred` sont rendues dans une teinte froide et
portent un badge dans l'interface — un couloir déduit ne doit jamais passer
pour du canon. `source` est obligatoire dans tous les cas ; pour `inferred`,
elle dit pourquoi l'espace a été ajouté, et ne doit pas citer de chapitre.

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

Trente-deux pièces ont ainsi leur intérieur : les quatorze appartements
princiers, les huit plans de salle qui comptent plus d'une pièce — quartier
de détention VIP, quartiers des soldats, bureau de la Justice, hôpital central,
cinéplexe, bureau Cha-R, cabines standard, cabines de première classe — puis
trois volumes qu'aucune boîte de pont ne peut contenir : le salon du Roi, que le
chap. 382 montre du sol au plafond ; la chambre funéraire, dont le plan de
salle donne une rotonde de vingt mètres là où le pont ne réserve qu'un tambour
de seize, où un cercueil de 2,2 m frôlerait le mur ; et la suspension de la
coque du chap. 406, dont les ressorts font trois fois la hauteur d'un pont. Le
pont 4 en ajoute deux du même ordre : la salle de conférence de l'Armée royale,
à qui le pont réserve 52 × 52 m quand son plan dessine une salle de 20 × 15
autour d'une seule table, et le bureau Xi-Yu et son entrée gardée. Le pont 3 en
ajoute quatre : la chambre 3101 et sa salle de bains anormale, le poste de
police et sa fontaine, le tribunal, et le bureau Heil-Ly. S'y ajoute un canot de
sauvetage : le chap. 383 en montre l'intérieur, et une capsule de cinq mètres
n'est pas une salle du pont mais un volume posé dessus, dans lequel on entre
par son écoutille. Les 23 autres plans locaux ne dessinent qu'une salle, que le
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
l'ameublement, et ces meubles portent donc la source du plan et sa provenance
`plan`. Les quatorze appartements sont le même plan : le jeu de meubles est
authoré une fois, dans le repère de l'appartement, et répété pour chaque prince.

Il vaut aussi pour ce qu'une **planche** meuble : le salon du Roi et ses sièges
appariés, ses tableaux et sa baie (chap. 382), la couchette, le lavabo et le
cabinet de la cellule de première classe (chap. 373), la couchette de la
cellule de haute sécurité (chap. 359). Le petit mobilier reste dehors : une
lampe qu'on ne peut pas traverser fait d'une chambre un labyrinthe.

Le second : **ce qu'une planche montre est ce que la pièce est** —

- la chambre funéraire est une couronne de quatorze cercueils autour d'un
  reliquaire (chap. 371) ;
- la salle de banquet est sa scène, l'estrade du trône et le buffet qui la sert
  (chap. 383) ;
- le réfectoire du pont 5 est ses longues tables en rangées (chap. 377) ;
- le pont des canots est les capsules alignées sur leurs berceaux (chap. 383) ;
- l'entrepôt du pont 5 est ses rangées de caisses, que son plan dessine et que
  la reconstruction pose dans les travées entre les piliers ;
- et l'espace entre la coque et le vaisseau est fait des ressorts qui portent
  l'un dans l'autre (chap. 406).

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
