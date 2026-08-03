# L'heure du bord — la lumière des deux fenêtres à l'heure du chapitre

**Date :** 2026-08-03 · **Statut :** Proposé · **S'inscrit dans :** `docs/tour-2.0.md`
(post-phases 0-4), `docs/adr-003-la-visite-habitee.md` (phase 1 livrée) et le
chantier 4 de `docs/adr-001-le-canon-compile.md`. Répond à la remarque « le tour
est devenu vraiment beau, mais vraiment sombre aussi ».

---

## 0. La question, et ce que la doctrine en laisse

Le Black Whale navigue toute la journée. Techniquement, le jour il devrait être plus
éclairé — et la doctrine répond : non, pas *lui*. Le jour n'entre dans ce navire que
par **deux ouvertures sur 314 espaces** : la baie du pont d'observation (ch. 380) et
la grande fenêtre du Roi (ch. 382). Partout ailleurs le voyage se passe dans une
coque, éclairée aux luminaires, à midi comme à minuit — c'est une affirmation sur le
navire, pas un réglage. Un mode « matin » qui éclaircirait un couloir de la Tier 5
serait une envmap qui ne dit pas son nom, et le garde-fou tient : **un couloir sans
luminaire reste noir à toute heure.**

Ce qui *peut* porter l'heure, ce sont les deux fenêtres. Et l'heure n'est pas à
inventer : **le tour la connaît déjà.** Depuis ADR-003, la marche projette un
événement précis — `selectEvent` sous le cap de spoiler du lecteur, puis
`getWorldState` — et les personnages qu'elle place à bord y sont *à cette heure-là* :
l'arc s'horodate (neuf captions, deux réveils — le réveil de Fugetsu du ch. 374 lit
TUESDAY 01:27 AM quand la caption compte 37 h 30 de mer, et les deux tombent d'accord
à trois minutes), et `voyage-clock.ts` fait déjà cette arithmétique pour `/ship`.
Si Kurapika veille en 1014 à une heure du matin, le ciel derrière la baie
d'observation ne peut pas être un ciel de midi : **la lumière doit suivre la même
projection que les présences.** C'est le même argument qui a interdit de re-dériver
les positions côté client — une seule réponse, deux surfaces qui la lisent.

Ainsi la luminosité du bord change avec le chapitre et le temps passé : le lecteur
qui avance son cap, ou saute d'événement en événement (`?eventId`), voit la
traversée avancer aussi dans la vitre. L'état dessiné par le manga — le ciel couvert
du ch. 380 — reste l'état de référence : « midi couvert » **est** le rendu actuel,
et les autres heures en sont dérivées, jamais l'inverse.

Et ce qui répond à « trop sombre » sans toucher au canon, c'est l'exposition. Le
navire est sombre parce qu'il l'affirme ; mais l'écran, la pièce et les yeux du
visiteur ne sont pas dans le blueprint. Une exposition réglable dans
`TourComfortPanel` est le même geste que `nightLight` : de l'accessibilité, pas du
décor — monotone, sans rotation de teinte, elle ne peut pas réordonner le chaud et
le froid, donc elle ne peut pas mentir.

## 1. État vérifié (2026-08-03)

- `packages/domain/src/voyage-clock.ts` — l'horloge du voyage existe : heures depuis
  la corne (heure 0 = dimanche midi), `clockOf`/`weekdayOf`/`formatVoyageTime`, et
  surtout **trois niveaux de preuve** (`stated` / `derived` / `bracketed`) que
  `bracket()` calcule sur la chronologie curatée. « Flattening them into one number
  is how a timeline starts lying » — la lumière devra respecter la même échelle.
- `apps/web/src/routes/tour/+page.server.ts` — la marche charge déjà
  `selectEvent(events, { eventId: url.searchParams.get('eventId') })` puis
  `timeline.getWorldState`. L'événement est là ; seul son *temps* ne traverse pas
  encore vers le client (le payload est un cast list, à dessein).
- `mesh.ts:370-432` — `WINDOW_GLOW = [0.62, 0.86, 1.28]`, `SEA_GLOW` dérivé à 45 %,
  `HORIZON = 1.7`, `WINDOW_REACH = 18`, `WINDOW_SAMPLE = 2.5`, `WINDOW_WEIGHT = 0.4`.
  Tout est constant : l'heure n'existe pas dans le rendu.
- `mesh.ts:1148-1193` (`pane`) — la vitre est cuite en deux bandes de couleurs par
  sommet **dans le buffer des luminaires** (MeshBasic, « a lamp must not be lit »).
- `mesh.ts:610-631` (`daylight`) — la flaque des fenêtres est sommée **dans le même
  attribut `color`** que la lumière des luminaires : indissociable à l'exécution.
- `godRays.ts` — `uTint` et `SHAFT_PEAK` constants ; `uStrength` déjà piloté par
  frame dans `TourScene.svelte` (`aimShafts`).
- `TourRenderer.ts` — `ACESFilmicToneMapping`, `toneMappingExposure` jamais touché :
  le bouton d'exposition existe déjà dans three.js, il n'est juste pas branché.
- `comfort.ts` — gabarit complet pour un nouveau réglage : champ typé, plage,
  défauts LIVELY/CALM, validation `readNumber`, persistance, panel.
- `surfaceDetail.ts` — précédent d'injection `onBeforeCompile` dans le Lambert.
- Le split un-mesh-par-espace (0.8 de tour-2.0) est livré : les deux pièces à
  fenêtre peuvent porter seules un matériau variant, sans toucher aux 312 autres.

## 2. `sky.ts` — la table des heures

Une fonction pure `skyOf(timeOfDay)` sur l'heure locale du bord
(`(hours + 12) % 24`, l'arithmétique de `clockOf`), dans le patron exact de
`DECK_LIGHT`/`hullRumble` : des états posés, une interpolation linéaire entre eux,
le tour du cadran refermé (22 h 30 rejoint 5 h 30 par la nuit). Rien ne lit ni
horloge ni événement ici — les tests lui donnent l'heure.

| Heure   | État             | `glow` (ciel, au-dessus du blanc)   | Shafts (`peak`) | Source                                  |
| ------- | ---------------- | ----------------------------------- | --------------- | --------------------------------------- |
| 05 h 30 | nuit finissante  | `[0.030, 0.045, 0.075]`             | 0               | dérivé : le ciel couvert, sans soleil   |
| 07 h 00 | aube             | `[0.98, 0.74, 0.58]`                | 0.40            | dérivé : le même ciel, soleil bas       |
| 10 h 00 | matin couvert    | `[0.70, 0.84, 1.18]`                | 0.50            | interpolation vers l'état de référence  |
| 13 h 00 | **midi couvert** | `[0.62, 0.86, 1.28]` — **actuel**   | **0.55**        | **ch. 380 — le seul état dessiné**      |
| 17 h 30 | après-midi       | `[0.74, 0.80, 1.08]`                | 0.50            | interpolation                           |
| 19 h 30 | soir             | `[1.18, 0.64, 0.42]`                | 0.45            | dérivé : soleil bas, l'autre bout       |
| 21 h 30 | nuit             | `[0.030, 0.045, 0.075]`             | 0               | dérivé                                  |

- `sea` reste **dérivé à 45 % du ciel** à toute heure — c'est la relation honnête
  de `SEA_GLOW`, elle ne devient pas fausse le soir.
- `uTint` des god rays = `glow` normalisé sur son canal le plus fort, comme
  aujourd'hui ; `peak` remplace la constante `SHAFT_PEAK` dans `aimShafts`.
- La nuit n'éteint pas la fenêtre en dur : elle la descend sous le seuil des
  shafts (0.9) et sous tout ce qu'un luminaire éclaire — la vitre devient ce
  qu'elle est la nuit, un rectangle à peine plus clair que sa laque (`0x14181e`).
- L'aube et le soir sont chauds, ce que le manga ne dessine pas — mais qu'un ciel,
  même couvert, fait à ces heures. Même statut que `SEA_GLOW` : dérivé d'une
  physique que personne ne conteste, marqué comme tel dans le fichier.

## 3. Quelle heure, quand le canon ne la donne pas

La règle suit `basis`, parce que la lumière est une affirmation comme une autre :

| `basis` de l'événement projeté | Ce que montre la vitre                                      |
| ------------------------------ | ----------------------------------------------------------- |
| `stated`                       | `skyOf` à l'heure dite — le réveil de Fugetsu fait foi      |
| `derived`                      | pareil — l'arithmétique est sourcée, le `≈` reste sur le HUD |
| `bracketed`                    | **l'état de référence (midi couvert)** — pas d'heure inventée |

Prendre le milieu d'un intervalle « Day 4 – Day 8 » serait habiller une supposition
en pendule. Quand le canon ne date pas la scène, la fenêtre montre l'état que le
manga dessine — exactement ce que le tour montrait avant ce plan — et le HUD montre
l'intervalle, donc l'affirmation reste lisible. Un span `stated` (Woody, 12:15-12:30)
prend son début, comme partout ailleurs.

Le HUD, justement : l'heure du bord s'affiche dans l'overlay de la marche via le
`formatVoyageTime` existant — « Day 3 · Tuesday · 01:27 », « ≈ Day 5 »,
« Day 4 – Day 8 » — près du nom du pont. C'est la carte de provenance de la
lumière : le visiteur voit *pourquoi* la baie est noire.

## 4. Chantiers

### A. L'exposition au visiteur *(~½ j — le geste qui répond à « trop sombre », livrable seul et en premier)*

- `comfort.ts` : champ `exposure`, plage `[0.75, 1.6]`, défaut 1 (le rendu actuel),
  LIVELY = CALM = 1, validation, persistance — le calque exact de `walkPace`.
- `TourScene` : `renderer.toneMappingExposure = $comfort.exposure` — avant la courbe
  filmique, donc les sources au-dessus du blanc saturent toujours en premier et le
  système de preuve chaud/froid est intact à tout réglage.
- `TourComfortPanel` : un curseur « Exposition », à côté de « Lumière de nuit ».

### B. L'heure dans le payload *(~½ j)*

`+page.server.ts` étend ce qui traverse : le `VoyageTime` de l'événement projeté
(basis, heures, bornes) réduit au strict — un `hours: number | null` déjà arbitré
par la règle du §3, plus le libellé `formatVoyageTime` pour le HUD. La règle
`bracketed → référence` s'applique **côté serveur**, là où le temps est calculé,
pour que deux clients ne puissent pas arbitrer différemment. Test d'acceptation,
calqué sur ADR-003 : même heure que `/ship` au même événement.

### C. La vitre paramétrée *(~½ j)*

Sortir les triangles du `pane` du buffer des luminaires vers un petit mesh par
fenêtre (quelques dizaines de triangles, deux pièces) : MeshBasic, couleurs par
sommet **relatives** (ciel = 1, mer = 0.45), et `material.color` = `glow` de
l'heure. Un `material.color.set()` au changement d'événement, zéro rebuild.

### D. La flaque découplée *(~1 j — le seul vrai chantier)*

`daylight()` cesse d'écrire dans `color` et écrit un attribut scalaire `aSky`
(la fraction de fenêtre reçue par le sommet, poids et openness déjà appliqués).
Les meshes des deux pièces à fenêtre — et eux seuls — prennent un Lambert patché
`onBeforeCompile` (précédent : `surfaceDetail.ts`) : `couleur += aSky * uSkyGlow`.

- À `uSkyGlow = WINDOW_GLOW`, le rendu est celui d'aujourd'hui — c'est le test.
- 312 espaces sur 314 : ni attribut, ni patch, ni coût. Budgets de `mesh.test.ts`
  intacts hors des deux pièces (l'attribut ajoute 4 o/sommet là où il existe).
- Le bake reste pur et déterministe : `aSky` ne dépend pas de l'heure, seul
  l'uniform en dépend.

### E. Le branchement *(~½ j)*

`TourScene` relie l'heure reçue aux trois consommateurs : `material.color` des
vitres (C), `uSkyGlow` des deux pièces (D), `uTint`/`peak` des shafts — plus le
HUD du §3. Changer d'événement est un saut, pas une heure qui passe : la lumière
change comme `jumpTo` change de pont, sans fondu qui mimerait un crépuscule que
personne n'a regardé. Si un jour le ticker de la marche avance l'événement
projeté, la lumière suivra le même fil sans travail nouveau — source unique.

Dans `TourComfortPanel` : **« Heure du bord : canon · matin · midi · soir ·
nuit »**, défaut `canon` — la doctrine de `quality` mot pour mot : la projection
choisit le défaut, le visiteur règle. `midi` est la sortie de secours de quiconque
veut l'état sourcé et rien d'autre ; c'est aussi l'override que les captures et
les tests utilisent.

## 5. Vérification

1. `sky.test.ts` — pure : continuité sur 24 h (pas de saut > ε entre deux minutes),
   `skyOf(13) === WINDOW_GLOW` exactement, nuit sous le seuil des shafts, `sea`
   toujours à 45 %.
2. Arbitrage du §3 côté serveur : `stated`/`derived` → heure, `bracketed` → null ;
   même réponse que `/ship` au même événement (le test d'ADR-003, étendu au temps).
3. `mesh.test.ts` — `aSky` nul (ou absent) partout hors des deux pièces à fenêtre ;
   budgets d'octets tenus ; le bake de minuit est le bake de midi (même buffer).
4. Le garde-fou doctrinal existant — couloir sans luminaire noir — passe à toute
   heure par construction : rien hors des deux pièces ne lit l'heure.
5. Smoke Playwright : l'override `nuit`/`midi` du panel rend l'heure injectable
   sans param nouveau ; un passage sur le pont d'observation dans les deux états ;
   le HUD affiche le libellé du temps au format de `data/CONVENTIONS.md`.

## 6. Rejetés

- **L'heure locale du visiteur** — ⛔ : c'était la première version de ce plan.
  Écartée parce qu'une heure de nulle part contredit les présences — Kurapika
  veillant en 1014 à 01:27 sous un ciel de l'après-midi du visiteur — et parce que
  le canon a une horloge que le tour projette déjà. L'heure du bord est un fait de
  la timeline, pas du fuseau du lecteur.
- **Éclairer le navire selon l'heure** — ⛔ définitif : le jour n'a que deux portes
  d'entrée ; le reste est le même refus que `scene.environment` dans tour-2.0.
- **Baisser les luminaires la nuit** — ⛔ : rien ne source un couvre-feu, et le
  système de classes n'a pas d'heure ; les machines tournent, les coursives brûlent.
- **Le milieu d'un intervalle `bracketed`** — ⛔ : « flattening them into one
  number is how a timeline starts lying » vaut pour la lumière aussi.
- **Un soleil dessiné, un disque, une lune dans la vitre** — ⛔ : le panel du
  ch. 380 dessine du nuage ; la vitre reste une valeur, pas une image.
- **Nouvelles fenêtres pour montrer davantage le cycle** — ⛔ : une ouverture
  entre par le blueprint, sourcée, ou n'entre pas (la voie de `shaftAnchors`,
  déjà écrite pour ce jour-là).

## 7. Séquence

```
A. Exposition confort        ~½ j   (indépendant — à livrer d'abord)
B. L'heure dans le payload   ~½ j ┐
C. Vitre paramétrée          ~½ j  ├─ E. Branchement + HUD + panel  ~½ j
D. Flaque découplée (aSky)   ~1 j  ┘
```

Total ≈ 3 jours. A répond seul à la remarque d'origine ; B-E font que la lumière
du bord raconte la traversée : au banquet la baie est un midi couvert, à la nuit
du ch. 374 la seule pièce du navire qui avait un dehors n'en a plus — et le
lecteur qui avance dans les chapitres voit l'heure tourner avec eux.
