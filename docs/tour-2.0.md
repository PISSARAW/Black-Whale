# Tour 2.0 — plan d'amélioration graphique et interactive de la visite

**Date :** 2026-08-03 · **Statut :** Livré (phases 0-4) · **Remplace :** les deux proposals externes
(« Amélioration Graphique de la Tour » et « Visite 2.0 »), filtrés contre le code réel
et la doctrine du dépôt. **S'inscrit dans :** le chantier 4 de
`docs/adr-001-le-canon-compile.md` ; s'appuie sur l'audit `/tour` du 2026-07-30 et
sur `docs/tour-immersion.md`.

---

## État de livraison (2026-08-03)

| Phase                              | État | Où                                                                                               |
| ---------------------------------- | ---- | ------------------------------------------------------------------------------------------------ |
| 0.1-0.6, 0.8                       | ✅   | `mesh.ts` (`toLinear`), `TourScene.svelte`, `visibility.ts` (`visibleSpaces`, `VIEW_DEPTH`)      |
| 0.7 — blueprint en `import()`      | 🟡   | `buildShip()` est déjà paresseux (`shared ??=`) ; le JSON reste statique — voir la note ci-après |
| 1 — paliers explicites             | ✅   | `quality.ts`, exposé dans `TourComfortPanel`, persisté par `comfort.ts`                          |
| 1 — SMAA                           | ✅   | `TourRenderer.ts`, dernière passe                                                                |
| 1 — vignette + grade               | ✅   | `postGrade.ts`, une seule `ShaderPass`, sans LUT                                                 |
| 1 — god rays ×2                    | ✅   | `godRays.ts` — masque d'occlusion pris sur le seuil de luminance de la vitre                     |
| 2 — détail triplanaire             | ✅   | `surfaceDetail.ts`, `onBeforeCompile` du Lambert                                                 |
| 2 — UV/textures, IBL, meubles GLTF | ⛔   | refusés, cf. §3                                                                                  |
| 3 — distorsion de l'air            | ✅   | `auraRefraction.ts`, `high` uniquement, coupée par `prefers-reduced-motion`                      |
| 3 — poussière réactive             | ✅   | `dust.ts` (`disturbDust`), déplacement borné par le dégagement échantillonné                     |
| 4 — inspection de provenance       | ✅   | `exhibit.ts`, `TourExamineCard.svelte`, touche **P** et bouton (tactile)                         |
| 7.1 — smoke Playwright             | ✅   | `tests/tour.spec.ts`, projets `chromium` et `mobile`                                             |
| 7.2 — captures de référence        | ⛔   | abandonné : sans GPU sur le runner, une capture teste le pilote de la CI, pas la visite          |
| 7.3 — budget de frame              | ⏸    | non fait                                                                                         |

**Sur 0.7.** Le coût que le correctif visait — `buildShip()` au chargement du
module — n'existe plus : `theShip()` construit à la première demande. Ne reste
que l'import statique du JSON, et le rendre dynamique demanderait de rendre
`theShip()` asynchrone dans une quinzaine d'appelants dont deux `+page.server.ts`.
Le rapport gain/rupture s'est inversé depuis l'audit ; à reprendre séparément.

**Sur SMAA.** Le bug d'AA était plus large que ne le disait la §2 : le composer
rend hors écran sur _tous_ les chemins, pas seulement le haut de gamme, donc
l'`antialias` du canvas n'a jamais atteint la vitre nulle part. La passe est donc
conditionnée au pointeur (`smaa: !coarse`) et non au palier — un desktop `low` en
a autant besoin qu'un `high`, et le téléphone est la seule machine qui doit s'en
passer.

---

## 0. Le filtre : la doctrine décide, pas l'esthétique

Le tour a une règle écrite (README, `data/ship/README.md`) : **il ne décore pas**.
Chaque élément visuel est une affirmation sur le navire, chaque détail dérivé porte
un argument (piliers : un toit sans soutien est une affirmation fausse ; joints de
tôle : un pont est de la tôle ; cadres de portes : l'épaisseur est affirmée au seul
endroit où elle se voit). Il n'y a **pas de lumière ambiante à bord, donc pas dans
la marche** : `MeshLambertMaterial` + couleurs cuites par sommet pour la structure,
`MeshBasicMaterial` pour les luminaires (« a lamp must not be lit »).

Tout item des deux proposals a été jugé là-contre, et contre l'état vérifié du code.

### État vérifié (2026-08-03)

- `TourRenderer.ts` : `EffectComposer` + `RenderPass` + `UnrealBloomPass` gaté par
  `isHighEndGPU()`, `ACESFilmicToneMapping`, pixelRatio ≤ 1,5, target HalfFloat
  **avec depth texture** déjà alloué sur le chemin haut de gamme.
- **Bug découvert** : sur ce chemin haut de gamme, le composer rend dans un
  `WebGLRenderTarget` custom → l'`antialias` natif du canvas ne s'applique pas.
  **Les meilleurs GPU n'ont aujourd'hui aucun anti-aliasing.**
- Le raycasting « à ajouter » existe (`THREE.Raycaster`, `TourScene.svelte:2901`) ;
  la visée aussi (`aimedSolid()`, `pageTargets`, `TourTargetIndex`).
- Les huisseries « à ajouter » existent (368 ouvertures, cadres 30 cm).
- Les défauts de l'audit du 30/07 tiennent toujours, en tête : `hex()` sans
  conversion sRGB→linéaire (`mesh.ts:50-54`) — **tous les albédos ~5× trop
  clairs** —, un pont = un seul mesh fusionné (culling inopérant), fuite GPU au
  cast, blueprint importé statiquement.

---

## 1. Phase 0 — Rendre juste avant de rendre beau _(préalable, ~2-3 j)_

Les correctifs 1-8 de l'audit `/tour`, dans l'ordre du rapport gain/effort :

| #   | Correctif                                                                                  | Fichier                       | Effet                                                                           |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------- |
| 0.1 | Conversion sRGB→linéaire dans `hex()`                                                      | `mesh.ts:50-54`               | la cause du « cube gris » ; **toute colorimétrie ultérieure en dépend**         |
| 0.2 | Garde `untrack` sur `position`/`heading`                                                   | `TourScene.svelte:852`        | minimap ne repeint plus 60×/s                                                   |
| 0.3 | `changedTouches[0]` au lieu de `touches[0]`                                                | `TourScene.svelte:724,729`    | regard tactile + fin du cast involontaire                                       |
| 0.4 | `preventDefault` conditionné à `pointerLockElement`                                        | `TourScene.svelte:660`        | fin du piège clavier Espace                                                     |
| 0.5 | Rotation caméra au clavier                                                                 | `TourScene.svelte` (`look()`) | visite utilisable sans souris                                                   |
| 0.6 | `dispose()` du variant de pont écrasé                                                      | `TourScene.svelte:342/494`    | fin de la fuite ~800 Ko/cast                                                    |
| 0.7 | Blueprint en `import()` dynamique + `buildShip()` hors scope module                        | `blueprint.ts:10`             | SSR et hydratation allégés                                                      |
| 0.8 | **Un mesh par espace + portal culling** (`plan.doorways` est déjà le graphe de visibilité) | `mesh.ts:259-379`             | profondeur 1 ≈ 9 % des triangles du pont 1 ; **débloque tout le reste du plan** |

0.8 est le seul vrai chantier ; c'est aussi le prérequis des phases 2-4 (matériaux,
provenance par objet) — on ne touche `mesh.ts` qu'une fois.

## 2. Phase 1 — Post-processing honnête _(~2 j, après 0.1)_

| Item                       | Décision      | Détail                                                                                                                                                                                                                                        |
| -------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SMAA**                   | ✅ en premier | corrige le bug d'AA du chemin haut de gamme ; passe unique après le bloom                                                                                                                                                                     |
| **Vignette + grade léger** | ✅            | un seul `ShaderPass` combiné (pas deux passes) ; réglé **après** 0.1, sinon on étalonne un signal faux. Pas de LUT « thriller » lourde : elle écraserait la distinction chaud filament / froid fenêtres, qui est le système de preuve du tour |
| **God rays**               | 🟡 restreints | uniquement les **deux fenêtres du navire** (pont d'observation ch. 380, salon du Roi ch. 382) — les deux seuls endroits où l'extérieur existe. Partout ailleurs : refusé (décor)                                                              |
| **SSAO / N8AO**            | ⏸ différé     | inutile tant que les normales sont cassées (cf. `docs/tour-immersion.md`) ; le bake par sommet porte déjà l'occlusion du statique ; dépendance externe. À réévaluer après phase 0 et correction des normales                                  |
| **DoF autofocus**          | ⛔            | première personne + flou = cinétose ; contraire à l'esprit de `comfort.ts`. Si jamais : mode visée uniquement, opt-in, débrayé par `prefers-reduced-motion`                                                                                   |

## 3. Phase 2 — La matière sans assets _(~3 j, après 0.8)_

| Item                                          | Décision     | Détail                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Détail triplanaire procédural**             | ✅           | grain d'acier + rugosité légère modulant la couleur cuite, dans le shader (`onBeforeCompile` du Lambert). **Zéro UV, zéro image, zéro nouveau claim** : l'acier est déjà affirmé par les joints de tôle. Remplace le couple « UVs dans MeshBuilder + textures PBR » des proposals                                                                                                                  |
| **UVs + textures par catégorie de pièce**     | ⛔ en l'état | « moquette pour public / métal pour infra » = décor sans source. Si un jour une texture est _citée_ (un sol que le manga dessine), elle entrera par la voie normale : une donnée sourcée dans le blueprint, pas un thème par catégorie                                                                                                                                                             |
| **`scene.environment` / IBL**                 | ⛔ définitif | contredit frontalement « there is no ambient light aboard a ship and none in the walk ». Une envmap éclaire les couloirs sans luminaire, qui doivent rester noirs                                                                                                                                                                                                                                  |
| **Meubles GLTF placeholders + InstancedMesh** | ⛔ en l'état | un lit générique affirme un design que le manga n'a pas dessiné ; casse le bake par sommet, la collision unifiée (« what stops you is what is drawn ») et la provenance par structure. Voie de réouverture possible, plus tard : modèles **auteur** par structure _sourcée_ (le trône du ch. 383, les cercueils du ch. 371), un par un, avec leur source — jamais une bibliothèque de placeholders |
| **Plinthes / corniches**                      | 🟡 optionnel | défendable en version navale (surbaux, plinthes de tôle) avec le même argument que les joints ; gain faible, à faire seulement si 0.8 rend l'extrusion triviale                                                                                                                                                                                                                                    |

## 4. Phase 3 — Le Nen tangible _(~3-4 j)_

| Item                                     | Décision | Détail                                                                                                                                                                                                                                      |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Distorsion de l'air autour des auras** | ✅       | le target HalfFloat + depth existe déjà : passe de réfraction alimentée par `NenSceneAura`. L'aura devient une présence physique, pas un halo                                                                                               |
| **Poussière réactive**                   | ✅       | étendre `dust.ts` (déjà doctrinalement « mérité » : dix salles y ont droit, par volume et hauteur) : une impulsion de Nen ou le passage du visiteur déplace les motes. C'est de la preuve — l'aura rendue visible dans l'air — pas du décor |

## 5. Phase 4 — L'inspection de provenance _(~3 j, la vraie nouveauté)_

La meilleure idée des deux proposals, recadrée : **viser un objet, obtenir sa preuve.**

- Réutiliser `aimedSolid()`/`facingSolid()` (pas de nouveau Raycaster).
- Sur action « examiner » : carte de provenance — source (`panel` / `plan` / `map`),
  chapitre, ce que la structure affirme, badge de certitude — branchée sur
  `TourProvenancePanel` et cohérente avec `/tour/sources`.
- Réponse à la question ouverte n° 3 du proposal : ni porte qui s'ouvre, ni son —
  **une pièce à conviction**. C'est ce que le mobilier du tour est déjà ; il ne lui
  manque que le geste pour le demander.
- Micro-animations d'apparition : `svelte/motion` (pas framer-motion — React), avec
  respect de `prefers-reduced-motion` comme partout dans `comfort.ts`.
- Glassmorphism généralisé : ⛔ (`backdrop-filter` au-dessus d'un canvas WebGL =
  recomposition coûteuse, surtout mobile où le tactile sort à peine de 0.3).
  Un flou léger sur _cette seule carte_, desktop uniquement : acceptable.

## 6. Qualité, tiering et réglages

- Garder `isHighEndGPU()` comme détection, mais la **matérialiser en paliers
  explicites** (`low` / `high`) consommés par toutes les passes, et l'exposer dans
  `TourComfortPanel` — doctrine de `comfort.ts` : c'est au visiteur de régler,
  la détection ne fait que choisir le défaut.
- Mobile : palier `low` = SMAA off (AA natif suffit hors composer), pas de
  distorsion, poussière réduite ; l'objectif de l'audit reste : rendre le tactile
  _utilisable_ avant de le rendre beau.
- Réponses aux questions ouvertes n° 1-2 du premier proposal : oui au
  desktop-max/mobile-léger via ces paliers ; la direction artistique est déjà
  tranchée par `docs/tour-immersion.md` — « lumière habitée », réalisme sombre
  habité, pas de saturation anime.

## 7. Vérification (les deux proposals étaient insuffisants ici)

`pnpm test` n'exerce aucun rendu WebGL. Ajouter :

1. **Smoke Playwright `/tour`** (chantier 1 de l'ADR) : chargement, entrée en
   marche, un cast, un examen de provenance — sur projet `chromium` et `mobile`.
2. **Captures de référence** par phase (3 points de vue fixes : couloir sans
   luminaire — doit rester noir —, banquet hall, salon du Roi) comparées en CI ;
   c'est aussi le garde-fou anti-régression doctrinale.
3. **Budget de frame** : trace `renderer.info` (draw calls, triangles) affichée en
   dev ; seuil d'alerte si un palier `low` dépasse son budget.
4. Les tests existants (`mesh.test.ts`, `geometry.test.ts`, `hatsu.test.ts`)
   restent le filet des phases 0 et 2.

## 8. Séquence et effort

```
Phase 0 (correctifs + split par espace)   ~2-3 j + le chantier 0.8
   └─ Phase 1 (SMAA, grade, god rays×2)   ~2 j
   └─ Phase 2 (triplanaire)               ~3 j
        └─ Phase 3 (distorsion, poussière) ~3-4 j
        └─ Phase 4 (provenance)            ~3 j
```

Phases 3 et 4 parallélisables. Total ≈ 3 semaines effectives, chaque phase
livrable et visible seule.

### Rejetés — récapitulatif

`scene.environment`/IBL (contredit la doctrine, définitif) · meubles GLTF
placeholders (invente du canon) · textures par catégorie (décor sans source) ·
SSAO (normales cassées, différé) · DoF (cinétose) · glassmorphism généralisé
(coût compositing mobile) · nouveau Raycaster et nouveaux doorJambs (existent déjà).
