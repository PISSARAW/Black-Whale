# ADR-002 : Découpage sous 500 lignes — plan et prompts d'exécution (catégorie A)

**Statut :** Proposé  
**Date :** 2026-08-02  
**Contexte d'exécution :** une IA exécute ce document en parallèle de l'ADR-001 (en cours). Cette version ne traite que la **catégorie A** : les fichiers que cet ADR possède et peut découper maintenant.  
**Entrée :** les 52 fichiers > 500 lignes brutes recensés le 2026-08-02.

---

## 1. Décision

Trois normes, appliquées au **code applicatif** (les catalogues i18n, les cartes SVG dessinées et les fichiers générés en sont exclus) :

1. **≤ 500 lignes brutes par fichier** (blancs et commentaires inclus) ;
2. **Complexité cyclomatique ≤ 10 par fonction** ;
3. **≤ 3 paramètres par fonction** — au-delà, un unique objet `options` typé.

Mécanisme d'application : **le cliquet ESLint**. Les règles `max-lines: 500`, `complexity: 10` et `max-params: 3` passent en `error` dans `eslint.config.js`, la liste d'exemptions legacy existante (22 fichiers, `eslint.config.js:174-204`) est étendue à l'état exact du jour — puis **ne peut plus que rétrécir** : chaque fichier découpé en est retiré dans le même commit, et un test CI échoue si la liste grandit.

Deux invariants de méthode, non négociables :

- **Zéro changement de comportement.** Le découpage déplace du code, il ne l'améliore pas. Toute envie de correction devient une ligne dans `docs/decoupage-notes.md`, jamais un edit.
- **Façade de ré-export.** Un fichier TS découpé devient un fichier qui ré-exporte ses anciens symboles depuis les nouveaux modules : **aucun import extérieur ne change** dans ce chantier. (Les `.svelte` n'ont pas de façade : on extrait des composants enfants et des modules d'état `.svelte.ts`, le parent garde son nom et son contrat de props.)

### Options considérées

| Option                                                  | Verdict                                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A. Big-bang (tout découper d'un coup)                   | ⛔ collision frontale avec l'ADR-001 en cours ; diff illisible ; risque maximal  |
| B. **Cliquet + lots par catégorie**                     | ✅ retenue — chaque lot livrable seul, conflit évité par partition claire        |
| C. ESLint seul sans plan (chacun découpe comme il veut) | ⛔ produit des découpes arbitraires (« part1/part2 ») qui empirent la lisibilité |

---

## 2. Catégorie A : à découper MAINTENANT

Ces 24 fichiers appartiennent à cet ADR. Aucun n'est concerné par l'ADR-001. Les autres catégories (B : coordination requise, C : remplacés par l'ADR-001, D : hors périmètre) sont dans la version complète de ce document si besoin.

| Fichier                                                     | Lignes | Lot | Cible de découpe                                                                            |
| ----------------------------------------------------------- | ------ | --- | ------------------------------------------------------------------------------------------- |
| `routes/ship/+page.svelte`                                  | 1 879  | R1  | `lib/components/ship/*` + `lib/state/shipView.svelte.ts`                                    |
| `lib/components/investigation/InvestigationCaseView.svelte` | 1 785  | R2  | `lib/components/investigation/*Tab*.svelte` + `lib/investigation/caseSession.svelte.ts`     |
| `routes/reconstruction/+page.svelte`                        | 1 701  | R1  | `lib/components/reconstruction/*` existant + `lib/reconstruction/view.svelte.ts`            |
| `lib/audio/hatsuSounds.ts`                                  | 1 816  | AU  | `lib/audio/hatsu/*` (synth, impacts, chains, guardians, ambientCasts, façade index.ts)      |
| `lib/components/map/markerProjection.ts` (+ test 793 l)     | 1 430  | MP  | `lib/components/map/projection/` (types, anchors, packing, trajectories, certainty, façade) |
| `routes/characters/[slug]/+page.svelte`                     | 1 194  | R1  | composants enfants + état local                                                             |
| `routes/compare/+page.svelte`                               | 1 074  | R1  | composants enfants + typage des props frontières                                            |
| `packages/ability-modules/src/contagion/game.ts`            | 1 585  | PK  | `deck.ts`, `table.ts`, `phases.ts`, `verdict.ts`, façade `game.ts`                          |
| `lib/tour/apparitions.ts` (+ test)                          | 1 827  | TS  | `lib/tour/apparitions/` (registry, lifecycle, vues déjà extraites, façade)                  |
| `lib/tour/morena.ts` (+ test)                               | 1 034  | TS  | `lib/tour/morena/` (seats, piles, phases, transcript, façade)                               |
| `lib/tour/geometry.ts` (+ test)                             | 942    | TS  | modules géométriques par responsabilité                                                     |
| `routes/timeline/+page.svelte`                              | 873    | R1  | composants enfants + état local                                                             |
| `routes/+layout.svelte`                                     | 859    | R1  | composants layout + `lib/state/layout.svelte.ts` ; **en dernier du lot R1**                 |
| `routes/characters/+page.svelte`                            | 768    | R1  | composants enfants (filtres, grille, carte)                                                 |
| `routes/tour/sources/+page.svelte`                          | 765    | R1  | composants enfants                                                                          |
| `routes/relationships/+page.svelte`                         | 756    | R1  | composants enfants (graphe, légende, détail)                                                |
| `routes/tour/morena/+page.svelte`                           | 692    | R2  | composants enfants + `lib/tour/morena/`                                                     |
| `lib/strategy/simulation.svelte.ts`                         | 681    | PK* | `lib/strategy/simulation/` ; *ou attendre sa semaine mode, sinon traiter comme paquet       |
| `packages/nen-engine/src/engine.ts`                         | 599    | PK  | sous-modules du moteur, façade conservée                                                    |
| `routes/reconstruction/v3/+page.svelte`                     | 590    | R2  | composants enfants                                                                          |
| `lib/audio/ambient.ts`                                      | 572    | AU  | `lib/audio/ambient/` (sources, mixer, convolution, façade)                                  |
| `packages/ability-sdk/src/effects.ts`                       | 563    | PK  | effets par famille, façade conservée                                                        |
| `lib/audio/steps.ts`                                        | 534    | AU  | `lib/audio/steps/` (synthèse, impulsion, façade)                                            |
| `routes/tour/+page.svelte`                                  | 512    | R2  | composants enfants + état local                                                             |

---

## 3. Plans de découpe cibles

Cibles indicatives — l'exécutant peut ajuster les noms, pas les principes (modules cohésifs par responsabilité, jamais `part1.ts`).

- **`routes/ship/+page.svelte`** → `lib/components/ship/` : `ShipCursorBar.svelte`, `ShipTierTabs.svelte`, `ShipMarkerLayer.svelte`, `ShipDetailPanel.svelte`, `ShipFilters.svelte` + état `lib/state/shipView.svelte.ts`. La page ne garde que la composition et le câblage aux données du load.
- **`routes/reconstruction/+page.svelte`** → `lib/components/reconstruction/` existe déjà : y extraire panneau par panneau ; état dans `lib/reconstruction/view.svelte.ts`.
- **`InvestigationCaseView.svelte`** → un composant par onglet (`CaseEvidenceTab`, `CaseInterviewTab`, `CaseDeductionTab`, `CaseVerdictPanel`), état de session dans `lib/investigation/caseSession.svelte.ts`. S'aligne sur les modules V3 (`knowledge` / `reasoning` / `interview` / `hatsuSystem`).
- **`lib/audio/hatsuSounds.ts`** → `lib/audio/hatsu/` : `synth.ts` (oscillateurs/enveloppes), `index.ts` (façade + routage), `impact.ts`, `chains.ts`, `guardians.ts`, `ambientCasts.ts`…
- **`markerProjection.ts`** → `lib/components/map/projection/` : `types.ts`, `anchors.ts` (dont `localSpotAnchors`), `packing.ts` (`packMarkersForZoom`), `trajectories.ts`, `certainty.ts`, façade `markerProjection.ts`. Le test de 793 l se découpe en miroir.
- **`contagion/game.ts`** → dans le module : `deck.ts`, `table.ts`, `phases.ts`, `verdict.ts`, `game.ts` façade. C'est un **paquet** — API publique strictement inchangée ; `ability-modules` a 29 tests qui font foi.
- **`apparitions.ts`** → finir le mouvement déjà commencé : `apparitions/registry.ts`, `apparitions/lifecycle.ts` + vues déjà extraites ; façade conservée.
- **`morena.ts`** → `morena/` : `seats.ts`, `piles.ts`, `phases.ts`, `transcript.ts` — en gardant l'en-tête doctrinal (« The rules are not here ») sur la façade.
- **`compare/+page.svelte`** — c'est aussi le nid des `any` (32) : le découpage type les frontières au passage (types de props explicites), sans toucher la logique.
- **Routes restantes du lot R1/R2** : même patron — extraire 2-4 composants enfants par page, état dans un `.svelte.ts`, page = composition.

Ordre des lots : **MP → AU → R2 → R1 → PK → TS** (du plus isolé au plus proche des zones actives ; R1 contient `+layout.svelte`, à faire quand aucun travail spoiler/i18n n'est en vol).

---

## 4. Prompt d'exécution

```text
Tu travailles dans le monorepo Black Whale (SvelteKit 5 + TypeScript strict +
pnpm + Turborepo). Ta mission : exécuter un lot de docs/adr-002-decoupage-500.md
(catégorie A uniquement). Lis d'abord ce document en entier, en particulier
§1 (normes), §2 (fichiers de la catégorie A) et §3 (plans cibles).

RÈGLES ABSOLUES
1. Refactor de DÉPLACEMENT uniquement : zéro changement de comportement, zéro
   « amélioration », zéro renommage d'export public, zéro changement de
   signature publique. Toute envie de correction → une ligne ajoutée à
   docs/decoupage-notes.md, rien d'autre.
2. Cibles : chaque fichier touché ≤ 500 lignes brutes ; complexité cyclomatique
   ≤ 10 par fonction ; ≤ 3 paramètres par fonction (au-delà : un unique objet
   options typé, en conservant l'appelant à l'identique via la façade).
3. Fichiers .ts : le fichier d'origine devient une façade qui ré-exporte les
   nouveaux modules — AUCUN import extérieur ne doit changer. Fichiers .svelte :
   extraire des composants enfants et des modules d'état .svelte.ts ; le parent
   garde son nom, sa route et son contrat de props.
4. Ce dépôt commente le POURQUOI, systématiquement. Chaque commentaire suit le
   code qu'il explique dans son nouveau module ; n'en supprime aucun, n'en
   invente aucun.
5. Ne touche JAMAIS à un fichier hors de la catégorie A du §2. Si un fichier
   du lot porte une modification de moins de 24 h sur main par un autre chantier,
   passe au suivant.
6. Découpe par coutures RÉELLES (types / constantes / helpers purs /
   sous-systèmes nommés), jamais en « part1/part2 ». Suis le plan cible du §3 ;
   tu peux ajuster les noms, pas les principes.

PROCÉDURE PAR FICHIER
a. Lis le fichier EN ENTIER avant d'écrire quoi que ce soit.
b. Écris le plan des modules cibles (nom → responsabilité → symboles déplacés)
   en tête de ton travail, puis extrais par étapes qui compilent chacune.
c. Découpe le fichier de test en miroir dans le même commit.
d. Retire le fichier de la liste d'exemptions legacy d'eslint.config.js.
e. VÉRIFIE, et ne conclus pas sans ces preuves :
   - pnpm --filter <workspace> typecheck  → vert
   - pnpm --filter <workspace> test        → même nombre de tests verts qu'avant
   - pnpm lint                             → vert (le fichier n'est plus exempté)
   - wc -l sur chaque fichier touché       → tous ≤ 500
   - si le fichier sert une route : pnpm exec playwright test (specs existants)
f. Un fichier source = un commit, message : "split(<zone>): <fichier> →
   <n> modules, façade conservée".

INTERDIT DE TERMINER en laissant : un test rouge, un fichier > 500 lignes dans
le périmètre du lot, un import extérieur modifié, ou la liste d'exemptions
ESLint plus longue qu'au départ.
```

---

## 5. Conséquences

**Plus facile :** chaque fichier lisible en une session ; `compare` perd son nid de `any` ; la revue humaine redevient possible sur les routes.

**Plus difficile / coûts :** ~30-40 commits mécaniques dans l'historique (à ajouter à `.git-blame-ignore-revs`) ; les façades ajoutent un niveau d'indirection temporaire (levées plus tard, hors de ce chantier).

**Critère de clôture :** tous les fichiers de la catégorie A sont ≤ 500 lignes brutes, la liste d'exemptions ESLint ne contient plus que les catégories B et C, et `pnpm lint`, `pnpm typecheck`, `pnpm test` sont verts.
