# La lumière égale sur les cinq ponts

Suite de `tour-classes-lumiere.md`. Celui-là avait retiré la dernière pénalité qui
inversait l'échelle de classe ; il en restait trois, et la plus visible n'était pas
une pénalité du tout mais une loterie.

Constat de départ : les couloirs du Tier 1 étaient les plus sombres du navire —
éclairement moyen au sol 0,55 contre 0,69 / 0,71 / 0,70 / 0,66 pour les Tiers 2 à 5 —
et deux pièces identiques du même pont ne s'éclairaient pas pareil.

## 1. La grille des lampes était celle de la coque

`ceilingLamps` posait ses lampes en `(i + 0.5) * spacing` en coordonnées navire.
Ce qu'une pièce recevait dépendait donc de la position de ses cloisons modulo le
pas. **93 espaces sur 318** n'attrapaient aucun centre de cellule et tombaient sur
le repli `interiorPoint` : une lampe unique pour les 2 205 m² du couloir arrière du
Tier 5, une pour les 1 764 m² du couloir avant du Tier 4. Et des voisins identiques
divergeaient sans raison lisible — les deux couloirs résidentiels royaux, 147 m²
chacun, prenaient une lampe quand les traverses d'à côté en prenaient sept.

**Correction** : la grille garde son pas nominal — ce que `REACH_RATIO` et la
fenêtre de cellules de `RoomLight.pool` exigent — mais elle est centrée sur la
pièce. Un couloir est éclairé par son axe quelle que soit sa largeur, une cabine
reçoit sa lampe au-dessus du plancher et non dans un coin.

Perdu au passage : les lampes d'un couloir alignées sur celles du hall où il
débouche, ce qui n'était vrai que des pièces que la loterie favorisait.

Conséquence dans `mesh.ts` : la fenêtre de `pool` passe de `-1…+2` à `-2…+2`. La
version asymétrique n'était juste que parce que la phase des lampes était connue.

## 2. La décroissance courait encore sur la diagonale

La correction précédente de `lampFalloff` avait déplacé la _coupure_ sur le plan
mais laissé la _forme_ sur la ligne oblique. Le tirant lampe-plancher vaut ~4,65 m
sur tous les ponts, la portée passe de 18 m en cale à 7,9 m au Tier 1 : le tirant
mangeait 23 % de la plage en bas et 59 % en haut.

|        | portée | tirant | valeur sous la lampe |
| ------ | ------ | ------ | -------------------- |
| Tier 1 | 7,88   | 4,65   | 0,242                |
| Tier 5 | 18,00  | 4,15   | 0,601                |

L'échelle à l'envers, 2,5×, pour la vieille raison à un nouvel endroit : le Tier 1
suspend ses lampes au plus près, et une lampe proche avait le moins de plage à
dépenser.

**Correction** : la forme est sur le plan seul et sans échelle, `(1 - plan/reach)²`.
Intégrée sur une grille de pas `spacing` elle donne le même flux au mètre carré
quel que soit le pas, puisque la portée suit le pas. Ce qui laisse `power` — la
table des ponts — seul juge de la classe.

La hauteur devient son propre terme : inverse du carré, ce que fait une source
ponctuelle, écrêté à `REFERENCE_DROP = 5 m`. Une pièce ordinaire ne paie rien ; les
sept mètres du Roi paient environ la moitié. Une pièce haute reste plus sombre —
elle n'est plus d'une autre classe.

`LAMP_THROW = 0.55` remet l'exposition d'ensemble où elle était : moyenne pondérée
par l'aire sur les 318 espaces, **0,773 après contre 0,777 avant**. Seule
l'_égalité_ bouge.

## 3. L'occlusion facturait la largeur du couloir

`openReach = 2.4 m` avait été choisi dans un hall puis appliqué à tout le navire.
Un couloir de quatre mètres n'est jamais à plus de deux d'une cloison : _tout_ son
sol prenait la remise de coin. L'obscurité d'un coin devenait l'obscurité d'être
dans un couloir, ce que l'occlusion ambiante n'a pas à dire.

**Correction** : `RoomLight` plafonne `openReach` par la demi-largeur de la pièce,
estimée aux lampes — points les plus éloignés des murs par construction. Un hall
ne bouge pas ; un couloir de quatre mètres passe à 2 m et se lit ouvert en son
milieu.

## 4. Résultat

Couloirs, éclairement moyen au sol :

|                   | avant | après    |
| ----------------- | ----- | -------- |
| Tier 1 (> 200 m²) | 0,67  | **0,77** |
| Tier 2            | 0,69  | 0,75     |
| Tier 3            | 0,72  | 0,68     |
| Tier 4            | 0,70  | 0,71     |
| Tier 5            | 0,66  | 0,65     |

Écart entre couloirs d'un même pont (Tier 1) : 0,42–0,77 avant, **0,57–0,85** après,
et ce qui reste s'explique — une petite coursive inférée contre une promenade
ouverte — au lieu d'être une question de phase. Pièce la plus sombre du navire :
0,38 avant, **0,47** après.

Le résidu Tier 3 sous Tier 4 est le terme de hauteur qui fait son travail : le
Tier 3 porte 6 m de plafond contre 4,5 m au Tier 4. C'est une affirmation voulue.

## 5. Verrous ajoutés

- `geometry.test.ts` : le nombre de lampes d'une pièce ne change pas quand on la
  translate d'une phase quelconque de sa grille ; aucune pièce longue sur une seule
  lampe ; un couloir plus étroit que sa grille reçoit une rangée sur son axe.
- `light.test.ts` : une lampe vaut la même chose sous elle-même sur les cinq
  grilles du navire, et à la même fraction de sa portée — c'est ce qui rend le flux
  indépendant du pas.
- `mesh.test.ts` : aucune pièce n'a de plancher que les lampes n'atteignent pas
  (coin le plus sombre ≥ 25 % du point le plus clair, hors créneau de mur) ; et les
  huit salles du cineplex, dessinées identiques, s'éclairent identiquement — mesuré
  sur la forme de leur distribution, l'albédo de `colourFor` différant d'une pièce
  à l'autre.
