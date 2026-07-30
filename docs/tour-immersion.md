# Rendre la visite habitable

Plan de travail pour `/tour` — direction retenue : **lumière habitée**, avec les trois
axes d'évasion demandés (être un corps à bord, l'échelle écrasante, l'oppression du
huis clos). Écrit le 2026-07-30, contre le dépôt à cette date.

Tous les chiffres ci-dessous sont **mesurés**, pas estimés : chaque section indique
comment. Les prototypes ont tourné sur `data/ship/blueprint.json` réel via le vrai
`buildShip()` / `buildTierMesh()`.

---

## 0. Où en est le rendu, en chiffres

| | valeur mesurée |
|---|---|
| Niveaux | 40 (5 ponts + 35 intérieurs) |
| Espaces | 314 |
| Structures | 721 |
| **Triangles, vaisseau entier** | **24 592** |
| Triangles, pont le plus lourd (tier-1) | 6 492 |
| Buffers, vaisseau entier | 3,1 Mo |
| Surface bâtie | 192 039 m² de sol, 157 842 m² de mur, 29 333 m de mur |
| Volume : min → max | 48 m³ → 65 856 m³ — entrepôt Cha-R (rapport **1 372×**) |
| Espaces avec une fenêtre | **2 sur 314** |

Le premier chiffre commande tout le reste. **Le vaisseau entier fait 24 592
triangles.** Un GPU d'entrée de gamme en avale deux millions par frame sans
transpirer. Il n'y a pas de problème de puissance à résoudre : il y a un problème
d'information. Chaque pièce du Black Whale reçoit aujourd'hui *exactement* la même
lumière que toutes les autres — un ambient, un hémisphérique, une lampe frontale
attachée au visiteur — donc chaque pièce ressemble à toutes les autres. Le cachot du
pont 5 et le salon du Roi sont éclairés par la même source, qui est vous.

C'est ça qui empêche l'évasion : pas le nombre de polygones, le fait que le vaisseau
n'a pas d'intérieur propre. Il a un visiteur avec une torche.

Le budget est libre à ~40×. Tout ce plan tient dedans.

---

## Vague 0 — Les normales (prérequis, invisible aujourd'hui, fatal demain)

Aujourd'hui le matériau est `MeshLambertMaterial({ side: DoubleSide })` et l'essentiel
de l'image vient de l'ambient : **l'orientation des faces ne compte pas**. Dès qu'une
lumière vient du plafond, elle compte pour tout.

Trois défauts vérifiés en exécutant `buildTierMesh` / `buildSolidMesh` sur le
blueprint réel :

| défaut | mesure | conséquence sous une lumière zénithale |
|---|---|---|
| Chapeaux de solides orientés vers le bas | **2 734 triangles, sur les 721 structures** | tous les dessus de table, de lit, de cercueil, la scène du banquet et l'estrade du trône passent au noir |
| Chapeaux de colonnes vers le bas | 328 triangles | invisible (à ras du plafond), mais faux |
| Murs dont la normale sort de la pièce | 57 sur 4 131 (1,4 %) | 57 pans éclairés par l'arrière |
| Sols / plafonds | corrects (715 / 715) | — |

Et un quatrième, plus gros, qui est déjà visible :

> **803 paires de murs coplanaires, soit 8 489 m — 28,9 % de la longueur de cloison
> du vaisseau — sont dessinées deux fois.**

`wallSegments(space, doorways)` tourne par espace et parcourt les arêtes du *propre*
contour de la pièce. Deux pièces mitoyennes émettent donc chacune leur pan sur la
même ligne, à la même profondeur. En `DoubleSide`, c'est du z-fighting sur près d'un
tiers des cloisons — le scintillement qu'on voit en longeant un couloir.

**Correctif (une trentaine de lignes) :**

```ts
// mesh.ts — extrudeSolid, les deux chapeaux
const cap = triangulate(outline)
for (let i = 0; i < cap.length; i += 3) {
  const a = outline[cap[i]]
  const b = outline[cap[i + 1]]
  const c = outline[cap[i + 2]]
  // Renversé : `triangulate` rend ses triplets dans le sens du contour, et un
  // contour de solide est anti-horaire en [x, z], ce qui donne une normale vers
  // le bas. Un dessus de table regarde le plafond.
  builder.triangle([a[0], top, a[1]], [c[0], top, c[1]], [b[0], top, b[1]], colour)
  if (structure.base > 0) {
    builder.triangle([a[0], bottom, a[1]], [b[0], bottom, b[1]], [c[0], bottom, c[1]], colour)
  }
}
```

```ts
// mesh.ts — quad(), qui doit maintenant savoir de quel côté est la pièce
quad(start: Vec2, end: Vec2, bottom: number, top: number, colour: Rgb, inside?: Vec2): void {
  // La normale de (start→end) est (-dz, 0, dx). Si le point intérieur de la pièce
  // n'est pas de ce côté, on retourne le pan : en FrontSide, un mur qui tourne le
  // dos à sa propre pièce n'est plus dessiné du tout.
  const flip = inside ? sideOf(start, end, inside) < 0 : false
  const [s, e] = flip ? [end, start] : [start, end]
  ...
}
```

Puis, dans `TourScene.svelte` :

```ts
const material = new THREE.MeshBasicMaterial({
  vertexColors: true,
  side: THREE.FrontSide, // au lieu de DoubleSide
})
```

**Ce que ça achète, tout de suite, avant toute lumière :**

- le z-fighting sur 8 489 m de cloison disparaît ;
- chaque face de cloison appartient désormais à *une* pièce, donc peut prendre la
  couleur et la lumière *de cette pièce* — un couloir éclairé côté couloir, la cabine
  derrière éclairée par sa propre applique. C'est la condition matérielle de toute la
  vague 1 : sans elle, une cloison ne peut pas être deux choses à la fois ;
- moitié moins de fragments rastérisés.

**Test à ajouter** dans `mesh.test.ts` — pur, sans GPU, dans l'esprit du fichier :

```ts
it('faces every surface into the room it belongs to', () => {
  for (const plan of ship.plans.values()) {
    const mesh = buildTierMesh(plan)
    for (let i = 0; i < mesh.positions.length; i += 9) {
      // le centroïde du triangle, poussé d'un centimètre le long de sa normale,
      // doit tomber dans le volume d'une pièce du pont
      expect(insideSomeSpace(plan, nudged(mesh, i))).toBe(true)
    }
  }
})
```

**Risque :** faible. Le seul piège est le `hatsu` qui dessine des solides détachés
(`buildSolidMesh`) — même correctif, même fonction.
**Coût :** ~1 h.

---

## Vague 1 — La lumière habitée

C'est le cœur, et l'argument est simple : **sur le Black Whale, la lumière est le
système de classes.** Le pont 1 loge le Roi et ses princes, le pont 3 les passagers
ordinaires, le pont 5 la soute et les ressorts. Aujourd'hui les cinq ponts sont
éclairés à l'identique, ce qui est une affirmation fausse sur le vaisseau — au même
titre qu'un mur sans épaisseur. Le précédent écrit est `columnPositions`
(`data/ship/README.md:101-106`) : les piliers ne sont pas stockés, ils sont *dérivés*,
parce qu'une halle de cette portée serait bâtie sur piliers. Une coursive de cent
mètres serait éclairée. On la dérive de la même manière.

### 1.1 — Des luminaires dérivés

Nouveau, dans `geometry.ts`, calqué ligne pour ligne sur `columnPositions` :

```ts
/** Écartement des luminaires, par pont. C'est là qu'est le système de classes. */
export const FIXTURE_SPACING = 9

/**
 * Où une pièce porte ses appliques.
 *
 * Rien dans le blueprint ne dit qu'un couloir est éclairé, pas plus qu'il ne dit
 * qu'une halle de sept mille mètres carrés a des piliers. Les deux sont vrais du
 * vaisseau plutôt que de la donnée, donc les deux se dérivent — et le rendu et le
 * moteur de son lisent la même fonction, si bien qu'une lampe qu'on voit est une
 * lampe qu'on entend bourdonner.
 */
export function fixturePositions(footprint: Polygon, spacing = FIXTURE_SPACING): Vec2[] {
  // grille centrée sur la boîte englobante, cellules de `spacing`, un point au
  // centre de chaque cellule dont le centre tombe dans le contour ; repli sur
  // interiorPoint pour une pièce plus petite qu'une cellule.
}
```

**Mesuré :** 2 558 luminaires sur tout le vaisseau à 9 m d'écartement. Pièce la plus
chargée : la Coursive tribord du pont 3, 82 luminaires.

Impossible en temps réel — le pont 1 seul en compterait 389, et three.js compile un
shader par nombre de lumières. **La lumière doit donc être cuite dans l'attribut de
couleur.** Ce qui, dans ce dépôt, est une chance et pas une contrainte : le bake est
pur, il tourne dans `mesh.ts`, et il se teste sans contexte WebGL exactement comme le
reste du pipeline le fait déjà.

### 1.2 — La grille de classes

Le seul tableau qui compte. `spacing` en mètres, `temp` en kelvins, `power` relatif :

| pont | qui | écart | température | puissance | tenue |
|---|---|---|---|---|---|
| tier-1 (72 m) | Roi, princes | 7 m | 2 700 K `0xffd2a0` | 1,15 | stable |
| tier-2 (54 m) | VIP | 8 m | 3 000 K `0xffdcb8` | 1,05 | stable |
| tier-3 (36 m) | passagers | 11 m | 4 000 K `0xf0f0e8` | 0,85 | stable |
| tier-4 (18 m) | passagers bas | 13 m | 5 000 K `0xe4ecf4` | 0,70 | léger battement |
| tier-5 (0 m) | soute, machines | 16 m | 6 500 K `0xd8e4f0` | 0,55 | battement + une lampe morte sur douze |

Modulé ensuite par catégorie d'espace, sur la même échelle :

```ts
const LIGHT: Record<SpaceCategory, { spacing: number; hue: number; power: number }> = {
  quarters:       { spacing: 0.8, hue: 0xffd0a0, power: 1.1 },  // dense et chaud
  ceremonial:     { spacing: 1.6, hue: 0xffe0a8, power: 0.5 },  // une seule source, le reste dans le noir
  public:         { spacing: 0.9, hue: 0xffc98a, power: 1.3 },  // le casino, le cinéplexe : on éclaire pour éblouir
  medical:        { spacing: 0.7, hue: 0xe8f4ee, power: 1.2 },  // froid, uniforme, sans ombre — c'est le pire
  prison:         { spacing: 1.4, hue: 0xcfd8e0, power: 0.9 },  // des flaques dures, du noir entre
  mafia:          { spacing: 1.5, hue: 0xd8a464, power: 0.5 },
  corridor:       { spacing: 1.0, hue: 0xdfe8f0, power: 0.8 },
  infrastructure: { spacing: 1.5, hue: 0xffb050, power: 0.7 },  // sodium, plafonds hauts, colonnes de lumière
  storage:        { spacing: 1.7, hue: 0xffb050, power: 0.6 },
  evacuation:     { spacing: 1.2, hue: 0xff8040, power: 0.8 },  // le rouge de secours
  military:       { spacing: 1.0, hue: 0xf2f4f0, power: 0.9 },
  administrative: { spacing: 1.0, hue: 0xf2f4f0, power: 0.9 },
  residential:    { spacing: 1.2, hue: 0xf0e8dc, power: 0.8 },
  room:           { spacing: 1.1, hue: 0xf0e8dc, power: 0.9 },
}
```

Résultat attendu : on **voit** en descendant l'escalier qu'on change de monde. C'est
littéralement l'argument du Contest de succession, et il ne coûte rien.

### 1.3 — Le bake

Nouveau fichier `lib/tour/light.ts`, pur, testable :

```ts
export interface Lamp { at: Vec2; y: number; power: number; colour: Rgb }

/** Les luminaires d'une pièce, dérivés de son contour, de son pont, de sa catégorie. */
export function lampsIn(space: Space, tier: Tier): Lamp[]

/**
 * L'éclairement en un point, pour une normale donnée.
 *
 * Décroissance en carré adoucie, plafonnée à 25 m — au-delà, une applique de
 * couloir contribue moins d'un millième et n'est plus qu'une boucle.
 */
export function irradianceAt(p: Vec3, n: Vec3, lamps: Lamp[]): Rgb

/**
 * L'assombrissement de coin.
 *
 * Pas une AO d'écran : la distance au mur le plus proche de la pièce, et au sol et
 * au plafond, prise sur la plus petite des trois. 0,35 dans l'angle, 1 à 1,4 m.
 * Les murs sont rangés dans un casier de 2 m, sans quoi la Coursive tribord ferait
 * 82 000 tests de distance par sommet.
 */
export function occlusionAt(p: Vec3, room: RoomBuckets): number
```

Et dans `mesh.ts`, la couleur devient par **sommet** au lieu de par triangle :

```ts
// avant : builder.triangle(a, b, c, colour)
// après : builder.triangle(a, b, c, (v, n) => shade(albedo, v, n))
//   où shade = albedo × (irradiance(v, n, lamps) + FILL) × occlusion(v)
```

`FILL` est le seul terme non directionnel qui reste : une lueur d'appoint très basse
(0,015) qui empêche une cloison sans applique en face d'elle d'être un trou noir
absolu.

### 1.4 — Les luminaires sont *visibles*

Le détail qui rend tout le reste lisible et qui coûte 2 triangles pièce : chaque
luminaire dérivé est aussi un **quad émissif** collé au plafond, dessiné en couleur
pure (au-dessus de 1, la courbe ACES s'en charge). 2 558 quads = **5 116 triangles**
sur tout le vaisseau.

C'est l'élément le plus rentable du plan entier. On lève la tête dans une coursive et
on voit la rangée d'appliques filer sur cent quarante mètres : **la longueur du
vaisseau devient comptable**. Une pièce éclairée sans lampe visible reste une boîte ;
une rangée de lampes est une architecture.

### 1.5 — Tessellation

Une lumière cuite par sommet a besoin de sommets. Un pan de mur de 20 × 5 m en a
quatre. Prototype mesuré, avec découpe des sols par **découpage de grille**
(Sutherland–Hodgman contre chaque cellule) et des murs par grille exacte ; les
plafonds restent grossiers, parce qu'un plafond est presque parallèle à ses propres
lampes et ne reçoit rien — c'est le quad émissif qui le raconte.

| grille | triangles vaisseau | pire pont | Mo / pire pont | build / pire pont |
|---|---|---|---|---|
| aujourd'hui | 24 592 | 6 492 | 0,70 | ~4 ms |
| 3,5 m | 85 282 | 17 068 | 1,23 | 40–70 ms |
| **3,0 m** | **105 774** | **21 344** | **1,54** | **47–103 ms** |
| 2,5 m | 141 299 | 29 904 | 2,15 | 90–180 ms |

*(mesuré sur ce conteneur, monothread, sans indexation des sommets ; Mo = position
+ couleur seules, l'attribut `normal` étant supprimé — voir juste en dessous)*

**Recommandation : 3,0 m.** ×4,3 en triangles, on reste 20× sous tout seuil qui
compte, et le pire pont se construit en ~100 ms — une seule fois, mis en cache par
`decks[]` comme aujourd'hui. La pièce la plus lourde du vaisseau (l'entrepôt Cha-R,
5 488 m² sous 12 m) fait alors 3 142 triangles, hors solides.

> Note de mesure : la boucle d'occlusion doit ranger les murs de la pièce dans un
> casier de 2 m. Sans ça, la Coursive tribord (7 000 m², des centaines de pans)
> passe de 53 ms à 209 ms à elle seule — c'est un O(sommets × murs) qui explose
> exactement sur les pièces qui comptent.

Deux économies à prendre en même temps :

1. **Supprimer l'attribut `normal`.** Avec `MeshBasicMaterial`, three.js ne le lit
   pas. −33 % de buffer et d'upload : le pire pont pèse **1,54 Mo** de position et de
   couleur, plus ~50 Ko d'arêtes — soit, à peu de chose près, le budget en octets
   déjà écrit dans `mesh.test.ts`. Le bake a besoin des normales *pendant* la
   construction, pas après : elles restent locales à `mesh.ts`.
2. **Indexer** sols et murs (les sommets d'une grille sont partagés) : ~−60 % de
   sommets. Optionnel, à faire seulement si le premier chargement gêne.

### 1.6 — Le matériau et les lumières réelles

```ts
// TourScene.svelte
renderer.toneMapping = THREE.ACESFilmicToneMapping   // conservé, indispensable ici
renderer.toneMappingExposure = 1

const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.FrontSide })

// Plus d'AmbientLight, plus d'HemisphereLight, plus de DirectionalLight rasante.
// Et surtout : plus de lampe frontale.
```

**Supprimer la lampe frontale est le geste central de cette vague.** Tant qu'une
source de 18 unités est vissée sur la tête du visiteur, chaque pièce est éclairée par
lui et aucune pièce n'est éclairée par elle-même. C'est ce qui écrase les cinq ponts
sur la même image.

Ce qui reste de dynamique, et rien d'autre :

- une **veilleuse** très faible sur le visiteur (`PointLight`, intensité 1,2,
  distance 8, decay 2) — filet de sécurité pour un escalier sans applique, réglable
  jusqu'à zéro dans le panneau de confort ;
- **l'aura Nen** : quand une technique est levée, une `PointLight` de la couleur de la
  technique. Elle devient alors la seule lumière colorée du vaisseau, et le Nen
  *éclaire* au lieu de dessiner un contour. Gratuit — le mécanisme des shells existe
  déjà (`syncShells`), il suffit d'y accrocher une lumière.

`syncSight` (l'aveuglement des Trois Singes) devient plus simple et plus fort : au
lieu d'éteindre trois lumières globales, il pousse `toneMappingExposure` vers 0 et
referme le brouillard. Le vaisseau reste allumé et vous ne le voyez plus, ce qui est
exactement ce que les singes prennent.

### 1.7 — Budgets de test à relever

`mesh.test.ts` bloquera. Les nouveaux seuils, posés comme les anciens (≈2× ce que le
vaisseau dessine) :

```ts
const MAX_DECK_TRIANGLES = 45_000   // était 15 000 ; pire pont mesuré 21 344
const MAX_DECK_BYTES = 3_600_000    // était 1 600 000 ; ~1,6 Mo sans les normales, marge ×2
const MAX_ROOM_TRIANGLES = 12_000   // était 8 000 ; pire pièce mesurée : l'entrepôt
                                    // Cha-R, 3 142 hors solides
```

**Coût vague 1 :** 2–3 jours. C'est l'essentiel du travail et l'essentiel du résultat.

---

## Vague 2 — Être un corps à bord

### 2.1 — La vitesse

`WALK_SPEED = 6` m/s, c'est 21,6 km/h : 4,3× la marche humaine. `SPRINT_SPEED = 16`,
c'est 57,6 km/h — une fois et demie Usain Bolt. Tant que le visiteur traverse le salon
du Roi en 32 secondes, le vaisseau ne peut pas être grand.

```ts
const WALK_SPEED = 1.5     // marche soutenue
const SPRINT_SPEED = 4.8   // course tenable
```

| pièce | portée | à 6 m/s | à 1,5 m/s |
|---|---|---|---|
| Salon du Roi | 193 m | 32 s | 129 s |
| Coursive tribord (pont 4) | 140 m | 23 s | 93 s |
| Entrepôt Cha-R | 112 m | 19 s | 75 s |

**L'objection est déjà réglée par le produit :** la visite a un voyage rapide — l'index
des pièces et le plan posent le visiteur où il veut par `jumpTo`. La marche n'a donc
jamais eu à couvrir de la distance. Elle n'a qu'à donner l'échelle, et pour ça elle
doit être lente. `paceOf(world.body)` reste un multiplicateur : Kurton et l'Enhancer
gardent exactement leur sémantique.

### 2.2 — L'inertie

Aujourd'hui la position est réécrite chaque frame à vitesse pleine : on démarre et on
s'arrête à l'instant. Un corps a une masse.

```ts
let velocity: Vec2 = [0, 0]
const ACCEL = 9      // m/s², ~0,17 s pour atteindre la marche
const FRICTION = 12  // m/s², l'arrêt est plus net que le départ

// dans tick()
const wanted: Vec2 = moving ? [dirX * speed, dirZ * speed] : [0, 0]
const rate = moving ? ACCEL : FRICTION
velocity = approach(velocity, wanted, rate * delta)
const target: Vec2 = [pointer[0] + velocity[0] * delta, pointer[1] + velocity[1] * delta]
```

`resolveMovement` est inchangé — il découpe déjà le déplacement en pas d'un rayon de
visiteur, et à 1,5 m/s il n'y a plus rien à traverser.

### 2.3 — Le roulis de pas

```ts
/**
 * Le pas.
 *
 * Une caméra qui glisse à hauteur d'œil constante est un drone, pas quelqu'un. La
 * verticale bat à deux fois la cadence (un pas par jambe), la latérale à la cadence
 * (le report de poids), et le roulis suit la latérale d'un quart de phase. Les
 * amplitudes sont volontairement petites : c'est en dessous du seuil conscient que
 * ça marche, au-dessus c'est du mal de mer.
 */
const STRIDE = 0.78          // m par pas
const BOB_VERTICAL = 0.042   // m
const BOB_LATERAL = 0.028    // m
const BOB_ROLL = 0.011       // rad, ~0,63°

phase += (Math.hypot(velocity[0], velocity[1]) / STRIDE) * Math.PI * delta
const gait = Math.min(1, Math.hypot(velocity[0], velocity[1]) / WALK_SPEED)
const bobY = Math.sin(phase * 2) * BOB_VERTICAL * gait * $comfort.headBob
const bobX = Math.sin(phase) * BOB_LATERAL * gait * $comfort.headBob
const roll  = Math.sin(phase - Math.PI / 2) * BOB_ROLL * gait * $comfort.headBob

// À l'arrêt, la respiration prend le relais : 0,22 Hz, 8 mm.
const breath = Math.sin(now / 1000 * 1.4) * 0.008 * (1 - gait) * $comfort.headBob
```

Appliqué **après** `eyesOf(world.body, EYE_HEIGHT)`, pas à la place : Kurton et les
techniques qui changent la hauteur d'œil gardent la main.

### 2.4 — Le champ à la course

+4° de FOV au sprint, amorti sur 0,25 s. Ça ne se remarque pas et ça se sent : c'est
le seul indice visuel qui dise que la course est un effort.

### 2.5 — Les pas s'entendent

`lib/audio/ambient.ts` a déjà tout ce qu'il faut : un `AudioContext`, un `voice()`
paramétrable, un envoi de réverbération, un filtre de sourdine que le Nen actionne
déjà. Un pas, c'est une enveloppe très courte sur du bruit filtré :

```ts
/** Un pas, timbré par ce sur quoi il tombe. */
export function playFootstep(surface: SpaceCategory, volume: number, running: boolean)
```

| catégorie | timbre | pourquoi |
|---|---|---|
| `infrastructure`, `storage`, `evacuation` | tôle, passe-haut 900 Hz, attaque dure | caillebotis |
| `quarters`, `residential` (ponts 1–2) | mat, passe-bas 400 Hz, très court | moquette |
| `ceremonial`, `administrative` | pierre, médium, longue queue | dalle |
| `corridor` | intermédiaire, queue selon le volume | — |
| `prison`, `military` | béton dur, sec | — |

L'envoi de réverbération est réglé par le **volume de la pièce** (voir 3.2). Le même
pas dans une cabine de 48 m³ et dans la salle de banquet de 34 700 m³ n'est pas le
même son, et c'est le canal le plus efficace pour l'échelle — plus que l'image.

### 2.6 — Confort

Trois clés nouvelles dans `Comfort`, avec la même discipline que l'existant (bornées,
relues champ par champ, valeurs par défaut prises sur `prefers-reduced-motion`) :

```ts
headBob: number    // 0…1, LIVELY 0.7, CALM 0
walkSpeed: number  // 0.75…2.5 ×, pour qui trouve 1,5 m/s trop lent
torch: number      // 0…1, la veilleuse ; LIVELY 0.35, CALM 1
```

`jumpOnly` continue de tout court-circuiter.

**Coût vague 2 :** 1 jour (dont une demi-journée pour les pas).

---

## Vague 3 — L'échelle écrasante

### 3.1 — Le brouillard suit la pièce

Un seul `Fog(0x050505, 6, 110)` pour des volumes qui vont de 48 à 65 856 m³. Dans une
cabine, un brouillard qui démarre à 6 m ne fait rien ; dans la salle de banquet, un
brouillard qui ferme à 110 m efface l'autre bout — ce qui est *exactement à l'envers*
de ce qu'il faut. Une petite pièce doit avoir de l'air (une brume proche dit
« confinement »), une grande doit garder sa profondeur.

```ts
/** Le brouillard que cette pièce mérite, de sa propre étendue. */
function airOf(space: Space, tier: Tier): { near: number; far: number } {
  const { long } = extentOf(space.footprint)   // describe.ts l'a déjà
  return { near: Math.max(0.6, long * 0.06), far: Math.max(18, long * 1.5) }
}
// interpolé sur ~0,7 s au franchissement d'un seuil, jamais commuté sec
```

`VIEW_DISTANCE` doit passer de 130 à **220 m** (la plus grande portée est le salon du
Roi, 193 m). `near` du frustum de 0,1 à 0,15 pour rendre la précision de profondeur.

### 3.2 — La réverbération suit le volume

`ambient.ts` synthétise déjà sa réverbération avec un `DelayNode` bouclé et un
passe-bas d'amortissement. Deux paramètres à piloter :

```ts
export function setRoomAcoustics(volume: number) {
  const size = Math.cbrt(volume)                       // 3,6 m → 40 m
  delay.delayTime.setTargetAtTime(clamp(size / 260, 0.014, 0.16), now, 0.3)
  feedback.gain.setTargetAtTime(clamp(size / 90, 0.08, 0.62), now, 0.3)
  damp.frequency.setTargetAtTime(1400 + size * 90, now, 0.3)
}
```

Le rapport de volumes mesuré est de **1 372×**. Rendu en audio, c'est la différence
entre un placard et une cathédrale, et l'oreille le lit instantanément — plus vite que
l'œil.

### 3.3 — La poussière dans les grands vides

Au-dessus de ~8 000 m³ : un nuage de `Points` additifs, ~500 particules dérivant
lentement dans le volume de la pièce, taille atténuée par la distance. Coût : un
`BufferGeometry` de 500 sommets et une mise à jour de position par frame. C'est le
seul indice qui rende visible l'*air* d'une salle de 22 m sous plafond — et les deux
espaces les plus hauts du vaisseau, la Baie des ressorts et sa passerelle (niveau
`interior-hull-suspension`, à l'intérieur du Niveau technique du pont 5), font
précisément 22 m.

Bonus quasi gratuit : sous chaque quad émissif d'une pièce de plus de 8 m sous
plafond, un cône additif très transparent (8 triangles). Une colonne de lumière dans
la poussière. L'entrepôt Cha-R — 5 488 m² sous 12 m, le plus grand volume du vaisseau
à 65 856 m³, éclairé au sodium par la table de 1.2 — est fait pour ça.

### 3.4 — La hauteur se lit

Plafonds quasi noirs + murs éclairés par le haut + rangées d'appliques visibles : la
hauteur devient comptable sans qu'on ajoute quoi que ce soit. C'est déjà le produit de
la vague 1 ; il n'y a rien à faire ici que de ne pas l'annuler avec un ambient trop
haut.

**Coût vague 3 :** 1 jour.

---

## Vague 4 — L'oppression du huis clos

### 4.1 — Les embrasures ont une épaisseur

**368 embrasures** sur tout le vaisseau. Chacune est aujourd'hui un trou dans un plan
d'épaisseur nulle : on franchit une feuille de papier. Un jambage de 0,3 m, un
linteau, un seuil — c'est le geste qui dit « acier » plus fort que n'importe quelle
couleur.

```ts
/**
 * L'ébrasement d'une baie.
 *
 * Le blueprint ne dit pas qu'une cloison a une épaisseur, pas plus qu'il ne dit
 * qu'une halle a des piliers. Un mur d'épaisseur nulle est pourtant lui aussi une
 * affirmation sur le vaisseau, et elle est fausse : on ne perce pas une feuille dans
 * une coque. L'ébrasement est donc dérivé, comme le reste — et ses joues rejoignent
 * `plan.walls`, sans quoi on verrait un chambranle qu'on traverserait.
 */
export const REVEAL_DEPTH = 0.3
export function revealOf(door: Doorway, height: number): { faces: Polygon[]; walls: WallSegment[] }
```

Les joues sont posées **à l'intérieur** de l'ouverture de 3 m : la largeur passable
tombe à 2,7 m, très au-dessus des 0,8 m du visiteur (`VISITOR_RADIUS = 0.4`). Coût :
368 × ~10 = **3 680 triangles**, et l'invariant du dépôt (« ce qu'on heurte est ce
qu'on dessine ») est préservé par construction, donc testable.

### 4.2 — Les deux fenêtres

Le chiffre le plus fort du blueprint : **314 espaces, 2 fenêtres.**

| | pièce | pont | taille | source |
|---|---|---|---|---|
| `tier-3-observation-deck-window` | Pont d'observation | tier-3 | 6 m de haut | ch. 380, `panel` |
| `tier-1-king-living-quarters-living-great-window` | Salon royal | tier-1 | 3,2 m | ch. 382, `panel` |

Les deux sont sourcées `panel` — Togashi les dessine. Et toutes deux sont aujourd'hui
typées `painting`, donc rendues en laque noire `0x1d1a16` : la même chose qu'un tableau
accroché au mur, et il y en a vingt-neuf autres. Le vaisseau qui emporte deux cent
mille personnes vers le Continent Obscur a exactement deux ouvertures sur l'extérieur,
elles sont l'une des rares choses que le manga montre vraiment, et elles sont rendues
comme des cadres.

Proposition :

- un `StructureKind` de plus, `'window'`, et les deux structures re-typées dans
  `blueprint.json`. C'est une affirmation sur le vaisseau, donc c'est de la donnée et
  pas une dérivation — la doctrine du dépôt tranche dans ce sens ;
- rendue en **émissif froid** (le ciel du Continent Obscur, `0x8fa8c8`, très bas mais
  au-dessus de zéro) ;
- et **elle entre dans le bake** comme une source surfacique. Les deux seules lumières
  du vaisseau qui ne sortent pas d'un luminaire.

Effet : sur 314 pièces, il y a deux endroits où l'extérieur existe, et on les sent en
y entrant. C'est l'asymétrie la plus rentable disponible, et elle coûte deux lignes de
JSON plus une branche dans `extrudeSolid`.

### 4.3 — La rumeur de coque

Un lit très grave dans `ambient.ts` : une sinusoïde à 38 Hz plus du bruit rose
passe-bas, dont le niveau et la coupure suivent l'altitude du pont.

| pont | élévation | niveau | coupure |
|---|---|---|---|
| tier-5 | 0 m | 1,0 | 260 Hz |
| tier-4 | 18 m | 0,7 | 190 Hz |
| tier-3 | 36 m | 0,45 | 140 Hz |
| tier-2 | 54 m | 0,25 | 100 Hz |
| tier-1 | 72 m | 0,12 | 70 Hz |

C'est la réponse à « il n'y a pas de ciel » : ce qu'on entend à la place, c'est la
machine. Et ça donne au visiteur un sens de la profondeur — on *entend* qu'on descend.

### 4.4 — Le noir est noir

Une fois `AmbientLight` supprimé et le bake en place, un couloir sans applique en vue
est réellement noir, pas gris foncé. C'est ça, le huis clos : il n'y a pas de lumière
d'ambiance à bord d'un vaisseau, il n'y a que ce qui est allumé. Le brouillard reste à
`0x050505` et la couleur de fond aussi, donc le lointain se dissout dans la même
valeur — un couloir qui s'enfonce est un couloir dont on ne voit pas le bout.

**Coût vague 4 :** 1 jour.

---

## Ce qu'on ne fait pas, et pourquoi

- **Ombres portées** (`shadowMap`). 2 558 sources, aucune ne peut porter d'ombre en
  temps réel. Les ombres cuites demanderaient un lancer de rayons dans `mesh.ts` :
  faisable, ×10 sur le temps de construction, et l'occlusion de coin (1.3) rend 80 %
  de l'effet pour 2 % du coût.
- **Textures.** Aucune image dans le pipeline aujourd'hui, et c'est cohérent : le
  vaisseau est une reconstruction dessinée en aplats et en fil d'or, pas une
  photographie. Une texture de tôle serait une affirmation sur un revêtement que rien
  ne montre. Le grain, s'il en faut, se met en bruit dans le bake — c'est dérivé, donc
  honnête.
- **Post-traitement** (SSAO, bloom, DOF). Il faudrait `postprocessing` ou
  `EffectComposer`, une passe plein écran par effet, et sur un mobile à 1,5× de ratio
  c'est le seul poste qui coûterait vraiment. La courbe ACES fait déjà le tiers du
  travail d'un bloom sur les quads émissifs.
- **Des passagers.** Écarté par la question de départ, et à raison : deux cent mille
  silhouettes qui ne sont pas dans le manga seraient la plus grosse invention du site.
- **Le rendu encre / trame manga.** Écarté par la direction retenue. Reste sur la
  table pour plus tard ; il se poserait *par-dessus* la vague 1 sans la contredire.

---

## Ordre d'attaque

| | vague | coût | ce qu'on voit à l'écran |
|---|---|---|---|
| 1 | **0 — normales & FrontSide** | 1 h | le scintillement sur 8 489 m de cloison disparaît ; rien d'autre |
| 2 | **1.1–1.3 — luminaires dérivés + bake** | 1,5 j | chaque pièce s'éclaire elle-même ; les cinq ponts cessent de se ressembler |
| 3 | **1.4 — quads émissifs** | 2 h | ⭐ le meilleur rapport du plan : les rangées de lampes donnent sa longueur au vaisseau |
| 4 | **1.5–1.7 — tessellation, matériau, budgets** | 1 j | dégradés propres sur les murs, noirs vrais |
| 5 | **2.1–2.2 — vitesse & inertie** | 2 h | ⭐ le vaisseau devient immense, en deux constantes |
| 6 | **4.1 — ébrasements** | 4 h | ⭐ on franchit de la matière |
| 7 | **2.3–2.4 — roulis, respiration, FOV** | 4 h | on a un corps |
| 8 | **3.1 — brouillard par pièce** | 2 h | l'air change de pièce en pièce |
| 9 | **4.2 — les deux fenêtres** | 3 h | ⭐ le huis clos a deux exceptions, et on les sent |
| 10 | **2.5 + 3.2 + 4.3 — pas, réverbération, rumeur** | 1 j | ⭐ le canal le plus rentable pour l'échelle |
| 11 | **3.3 — poussière & colonnes de lumière** | 4 h | les grands vides ont de l'air |

Total : **6 à 7 jours**. Les cinq lignes ⭐ font ~70 % de l'effet ressenti pour ~2
jours : si tu ne veux qu'une chose, c'est 3 + 5 + 6 + 9 + 10.

## Les cinq chiffres à retenir

1. **24 592 triangles** pour tout le vaisseau — le GPU ne fait rien, il n'y a rien à
   optimiser, il y a à ajouter.
2. **2 734 dessus de solides** regardent vers le bas — à corriger avant toute lumière.
3. **28,9 % de la longueur de cloison** est dessinée deux fois, coplanaire.
4. **1 372×** entre le plus petit et le plus grand volume — et une seule acoustique.
5. **2 fenêtres sur 314 espaces** — le huis clos est déjà dans la donnée, il n'est
   simplement pas rendu.
