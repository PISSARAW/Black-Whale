# La lumière tient ses classes — supprimer la pénalité `inferredLamps`

**Date :** 2026-08-03 · **Statut :** Décidé, à appliquer (la correction a été écrite puis
écrasée par une session d'implémentation concurrente sur `mesh.ts` — voir le prompt
d'exécution en fin de note). **Corrige :** une inversion du système de classes constaté
dans la marche. **S'inscrit dans :** la doctrine de `docs/tour-immersion.md`
(« la lumière est le système de classes ») et `docs/tour-2.0.md`.

---

## 1. Le constat

Des pièces de la Tier 1 sortent du bake plus sombres que des pièces de la Tier 5.
Mesuré sur `data/ship/blueprint.json` (puissance effective des pools =
pont × catégorie × provenance) :

- Plafond de la Tier 5 : `tier-5-area-37564` (public, panel) à **0.793**.
- **20 espaces de la Tier 1 sont dessous — 18 parce qu'ils sont `inferred`** et punis
  ×0.22 par `LIGHT.inferredLamps` (`mesh.ts`). Ce sont les couloirs : le couloir
  principal, les promenades, le vestibule du salon du Roi — toute la circulation du
  pont royal à **0.202**, trois fois plus sombre que des quartiers du hold (0.605).
- Les 2 restants sont la chambre funéraire des princes (`ceremonial`, ×0.5, panel) —
  voulus : « le cérémoniel, c'est une source et beaucoup de noir ».
- L'escalier entier est brouillé. Médianes par pont : **1.265 / 0.525 / 0.999 /
  0.169 / 0.385**. La Tier 4 (55 % inférée) est plus sombre que la Tier 5 ; la
  Tier 2 (couloirs 8/8 inférés) plus sombre que la Tier 3. La pénalité frappe au
  prorata de ce que les plans n'ont pas dessiné, pas au prorata de la classe.

## 2. La cause : deux fichiers, deux doctrines

`light.ts` (en-tête) : « rien dans le blueprint ne dit comment une pièce est
éclairée, et rien ne doit le dire — c'est **dérivé**, exactement comme
`columnPositions` : un couloir de cent mètres serait éclairé. »

`mesh.ts` (`LIGHT.inferredLamps: 0.22`) : « les plans ne mettent pas de lampe dans
un couloir que personne n'a dessiné. »

Les deux ne peuvent pas être vrais : les plans ne mettent de lampe *nulle part* —
la lampe est toujours une dérivation, pour une pièce inférée comme pour une
dessinée. Numériquement c'est le ×0.22 qui gagne, et il casse la seule affirmation
que les ponts sont construits pour faire : on voit, en descendant l'escalier,
qu'on change de monde.

## 3. La décision

**Supprimer `inferredLamps`.** La provenance reste visible là où elle est une
affirmation sur les *surfaces* : la teinte froide de `colourFor` et le fill un peu
plus mince (`inferredFill: 0.86`, conservé). Elle ne touche plus la grille de
lampes, qui appartient au pont et à la catégorie.

Écartés : convertir la pénalité en lampes mortes (`dead` monté pour l'inféré) —
des tubes morts sur le pont royal contredisent « tenue des luminaires par pont » ;
adoucir 0.22 → ~0.7 — réglage empirique, l'inversion reste possible aux marges.

## 4. Les éditions (à rejouer telles quelles)

Dans `apps/web/src/lib/tour/mesh.ts` :

1. `LIGHT` : supprimer la ligne `inferredLamps: 0.22,` et réécrire le commentaire
   du bloc inféré — garder trace de l'argument : la pénalité a existé, pourquoi
   elle est partie (l'argument `columnPositions`, l'inversion Tier 1/Tier 5).
2. `RoomLight`, constructeur : `this.lamps = (inferred ? LIGHT.inferredLamps : 1) *
   lamplight.power` → `this.lamps = lamplight.power`.
3. Le pass des luminaires (`if (!reveal)`) : supprimer
   `const burn = space.provenance === 'inferred' ? LIGHT.inferredLamps : 1` et le
   ×burn sur `glow` — le quad brûle à `lamplight.glow` tel quel.
4. Deux commentaires qui citent la pénalité : la doc de `fittingColors` dans
   `TierMesh`, et celle de `daylight()` (« a room the reconstruction invented gets
   a fifth of its lamplight ») — à réécrire sans elle.

Dans `apps/web/src/lib/tour/mesh.test.ts` :

5. Le test des luminaires qui attend `brightest / full ≈ 0.22` pour l'inféré →
   attendre `≈ 1` pour tout le monde (le luminaire brûle à la force du bake).
6. Le test « gives a room the reconstruction invented less light » tient toujours
   (le fill fait la différence) ; y **ajouter le verrou de classe** :
   `expect(asInferred!).toBeGreaterThan(asPlanned! * 0.8)` — la provenance peut
   amincir le fill, jamais confisquer les lampes. (Avant correction ce ratio
   tombe bien sous 0.8 ; après, ≈ 0.86+.)

L'invariant demandé — « le couloir de chaque pont plus clair que celui du pont en
dessous, pénalités comprises » — est alors couvert : `light.test.ts` (« falls
monotonically ») tient l'ordre des ponts, et le verrou n° 6 interdit à la
provenance de le défaire.

## 5. Vérification

`pnpm vitest run apps/web/src/lib/tour/light.test.ts apps/web/src/lib/tour/mesh.test.ts`
— et le garde-fou « couloir sans luminaire reste noir » n'est pas concerné : un
espace sans lampe reste sans lampe, la correction ne change que la force de
celles qui existent.

Après correction, médianes attendues : 1.265 / 0.840 / 0.999 / 0.560 / 0.488.
Le résidu Tier 2 < Tier 3 est un fait de *catégories* (la Tier 3 porte le
cineplex, l'hôpital, le casino — du `public`/`medical` sourcé qui brûle fort) :
c'est une affirmation voulue, pas une inversion de classe.

---

## Prompt d'exécution (pour la session qui tient `mesh.ts`)

> Applique `docs/tour-classes-lumiere.md` : supprime `LIGHT.inferredLamps` de
> `apps/web/src/lib/tour/mesh.ts` (constante, `this.lamps` dans `RoomLight`,
> `burn` des quads de luminaires, et les deux commentaires qui la citent —
> `fittingColors` et `daylight()`), en gardant `inferredFill` et la teinte
> `colourFor` intacts. Dans `mesh.test.ts`, le test des luminaires attend
> désormais `brightest/full ≈ 1` pour toutes les provenances, et le test
> « invented less light » gagne le verrou
> `expect(asInferred!).toBeGreaterThan(asPlanned! * 0.8)`. Ne touche à rien
> d'autre dans ces fichiers. Lance `light.test.ts` et `mesh.test.ts`.
