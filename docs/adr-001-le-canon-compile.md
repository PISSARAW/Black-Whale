# ADR-001 : « Le canon compile » — architecture cible de Black Whale

**Statut :** Accepté (2026-08-03)
**Date :** 2026-08-03
**Décideur :** mainteneur unique du dépôt
**Périmètre :** l'ensemble du site (apps/web, apps/admin, packages/, data/, infrastructure/)

---

## Partie 1 — Analyse détaillée de l'architecture actuelle

### 1.1 Vue d'ensemble

```
                        ┌──────────────────────────────────────────────┐
                        │                 Hetzner (1 VM)               │
   navigateur ── 443 ──▶│ Caddy ──▶ web  (SvelteKit node, :3000)       │
                        │       └─▶ admin (SvelteKit node, :3002)      │
                        │              │            │                  │
                        │              ▼            ▼                  │
                        │        PostgreSQL 16  ◀── migrate (one-shot) │
                        │              ▲                               │
                        │        backup (dump quotidien, volume local) │
                        └──────────────────────────────────────────────┘

  Monorepo pnpm + Turborepo
  ├── apps/web            SvelteKit 5 — 24 routes, ~45 000 LOC src
  ├── apps/admin          SvelteKit 5 — back-office, ~2 150 LOC, 0 test
  ├── packages/           13 paquets : domain, database (Prisma),
  │                       world/timeline/identity/knowledge/perspective/
  │                       spoiler/nen/simulation/map-engine,
  │                       ability-sdk, ability-modules (82 modules)
  ├── data/               catalogue CC BY : characters (223), abilities (82),
  │                       events (134), chapters, locations, factions,
  │                       prophecies, ship/blueprint.json (~1,1 Mo)
  └── infrastructure/     compose prod, Caddyfile, deploy/backup/restore
```

Trois familles de vérité coexistent :

1. **`data/*.json`** — le catalogue canonique, versionné, sous CC BY 4.0. Depuis peu
   il contient aussi les événements (`events/events.json`, 134 entrées) que
   `backfill_timeline.mjs` lit au lieu de les porter en dur : c'est la bonne
   direction, actée par le point P3-20 de `docs/completude.md`.
2. **PostgreSQL** — 31 modèles Prisma. Presque tout y est *dérivé* : le contenu
   arrive par seed + backfills rejoués à chaque déploiement (`Dockerfile.migrate`).
   Les seules données **non reconstructibles depuis git** sont les branches de
   simulation des visiteurs (`WorldBranch`/`WorldEventRecord`/`WorldProjectionSnapshot`)
   et les écritures admin.
3. **Des registres TypeScript côté client** — `lib/nen/hatsuRegistry.ts` (82 profils),
   `lib/tour/*`, i18n hatsu — qui redéclarent le catalogue au lieu de le projeter.

### 1.2 Ce qui est déjà excellent (à ne pas casser)

- **Le modèle temporel** : événement canonique → `StoryCursor` → réducteur pur →
  projections (carte, timeline, perspectives). C'est le bon modèle pour un récit
  à information incomplète, et il est réellement implémenté (branches persistées,
  `planFor()` qui exécute les mêmes prédicats que `execute`).
- **L'infra** est le volet le plus mûr : secrets `${VAR:?}`, `no-new-privileges`,
  migration en *gate* hors du `up` (le stack précédent continue de servir si elle
  échoue), `backup.sh` qui valide son dump avant rotation.
- **La discipline** : 2 TODO, 0 `@ts-ignore`, strict TS partout, parité i18n
  parfaite, commentaires qui expliquent le *pourquoi*. 11 des 14 paquets ont un
  ratio test/source > 44 %.
- **La reconstruction du navire** : connexe, 0 salle inaccessible, ordre
  d'autorité documenté (`data/ship/README.md`).

Le problème n'est donc pas la qualité d'exécution — elle est rare — mais la
**topologie** : plusieurs déclarations du même fait, et des frontières de
paquets qui ne correspondent plus aux frontières réelles du code.

### 1.3 Défauts structurels, par axe demandé

#### A. Maintenabilité — la double pile Nen

Le défaut central, mesuré dans `docs/completude.md` §3.1 et toujours vrai :

| Pile | LOC | Sert | Tests |
| --- | --- | --- | --- |
| `ability-modules` + `ability-sdk` + `nen-engine` | ~9 000 | `/simulations`, le jeu de Morena, le loader d'`/abilities` | 77 |
| `lib/nen/*` (DOM) + i18n hatsu | ~7 400 | l'expérience hatsu des pages 2D | 4 comportementaux |
| `lib/tour/hatsu.ts` + `pageWorld*`/`pageCast*` + `TourHatsuHud` | **5 345 l** pour `hatsu.ts` seul (2 554 au 30/07 — **doublé depuis**) + sa boucle de simulation propre (`TourWorld`, ticker, steps) | la visite 3D | 105 Ko de tests (le mieux testé des trois) |
| `lib/arena/hatsu/*` + `lib/combat/` (725 l de réducteur) + `lib/hunt/nen/*` | ~1 500 | les modes arène / traque | partiels |

`apps/web/src/lib/nen/` et `lib/tour/` — la couche qui exécute les hatsu à
l'écran — n'importent **jamais** le moteur (un seul `import type` ; seuls
`/simulations` et, depuis peu, le loader d'`/abilities` passent par
`nenRuntime`). Le catalogue des 82 hatsu existe **cinq fois**
(`abilities.json`, modules, `hatsuRegistry.ts` — 82/82 entrées parallèles
vérifiées ce jour —, `hatsu-fr.ts`, `hatsu-status/{en,fr}.ts`) et a déjà
divergé : 27 `name` et 48 `owner` incompatibles entre modules et registre web.
S'y ajoutent les fichiers monstres (`GlobalHatsuEffects.svelte` ~3 000 l,
`hatsuInteractions.ts` ~2 460 l, `reconstruction/+page.svelte` 54 Ko) et les
paquets fantômes (`map-engine` et `config` : 0 consommateur ; `contracts`,
`ui`, `apps/worker` : répertoires vides).

#### B. Extensibilité — ajouter un hatsu coûte cinq éditions

Aujourd'hui, un hatsu nouveau = 1 entrée JSON + 1 module + 1 profil
`hatsuRegistry` + 2 fichiers i18n + souvent une implémentation DOM **et** une
implémentation 3D (67 des 82 techniques sont écrites deux fois). Les modules
déclarent pourtant `interactionManifest`, `ui.componentKey`, `allowedTargets`,
`overlays` — écrits précisément pour piloter l'UI — avec **0 consommateur**.
Depuis l'audit, deux couches de plus sont nées : `lib/arena/hatsu/` redéclare
en dur `cost`/`condition`/`risk` par technique (`arenaDefinition()`) — une
**sixième** déclaration de faits de catalogue — et `lib/hunt/nen/` porte sa
propre petite couche Nen. Toutes sont ancrées sur les `kind` de
`hatsuRegistry.ts`, jamais sur les modules. Le plan des 8 vagues de
`docs/hatsu-potentiel.md` multipliera ce coût s'il est lancé avant
l'unification (c'est la mise en garde déjà notée : « ne pas ajouter de hatsu
sans décider d'abord de l'unification »).

**Le contre-exemple qui prouve la cible :** le jeu de Morena. `tour/morena.ts`
s'ouvre sur « *The rules are not here. They live in
`@black-whale/ability-modules`* » — les règles vivent dans le module
`contagion` (dont `game.ts`), le tour ne fait que rendre. `TourScene.svelte`
et `apparitions.ts` importent déjà des types de `nen-engine`. Le pattern cible
existe donc dans le dépôt, appliqué au module le plus récent ; le chantier
consiste à l'étendre aux 81 autres.

#### C. Scalabilité et performance

- `TimelineEngine.getNearestSnapshot()` retourne `null` en dur
  (`timeline-engine/src/index.ts:220`, « Pas de snapshot implémenté en V1 ») :
  **chaque requête rejoue l'intégralité des événements** depuis l'origine. O(n)
  par vue aujourd'hui, O(n²) cumulé au fil de la densification du canon (P3
  prévoit de passer de ~2 événements/chapitre à bien plus).
- `blueprint.json` (~1,1 Mo brut) est importé **statiquement** par `/tour` et
  `/tour/sources`, et `buildShip()` s'exécute au scope module — au SSR **et** à
  l'hydratation.
- Rendu 3D : un pont = un seul `Mesh` fusionné → bounding sphere de 145 m,
  frustum culling inopérant, `DoubleSide` ; `aimedSolid()` coûte ~600 µs/appel
  (1 frame sur 6 quand une technique est levée) ; minimap repeinte 60×/s.
- Aucune stratégie de cache HTTP au-delà de `/fonts/*` : des pages presque
  entièrement dérivées de données immuables entre deux déploiements sont
  recalculées à chaque visite (avec replay complet, cf. ci-dessus).
- Le rate limiter est par processus — correct sur un nœud unique, à condition de
  le savoir (il le dit en commentaire) ; toute mise à l'échelle horizontale le
  casse silencieusement.

#### D. Fiabilité

- **0 test e2e** (un seul spec Playwright, `/hunt`), **0 test de composant**,
  `apps/admin` **0 test** — y compris toute la surface d'authentification — et
  sans script `test`, donc silencieusement sauté par `turbo test`.
- Les backfills (~4 300 LOC) sont **hors typecheck, hors lint strict, hors
  tests** — et rejoués en production à chaque déploiement.
- Aucun `+error.svelte` : 404/429/500 sortent en page brute.
- Aucune supervision (pas de Sentry, pas de logs structurés), aucun tag
  d'image, aucun chemin de rollback autre que `git checkout` + rebuild.
- CI : un seul job, pas de couverture, pas d'audit de dépendances, pas de
  `prisma migrate diff --exit-code` alors que dev (`db push`) et prod
  (`migrate deploy`) peuvent dériver ; un service Postgres démarré pour rien.

#### E. Complexité

- **31 modèles Prisma dont 4 morts** (`WorldEntity`, `SpatialObservation`,
  `LocationEdge`, `MapAssetManifest` : 0 occurrence) ; à l'inverse, relations,
  géométrie du navire et registre hatsu client vivent **hors** persistance.
- 9 micro-moteurs dont plusieurs de 76-264 LOC : la frontière de paquet coûte
  plus qu'elle ne protège (`spoiler-engine` : 3 exports sur 4 appelés
  uniquement par leur propre test).
- Le filtre spoiler est ré-appliqué **à la main dans chaque loader** ; il suffit
  d'un oubli pour fuiter (c'est arrivé : `/abilities` l'ignore encore, et la
  liste `/characters` ne l'a reçu que récemment).

#### F. Fidélité au canon

- La divergence des catalogues **est déjà une contradiction de canon publiée**
  (27 noms, 48 propriétaires incompatibles entre ce que dit `/simulations` et ce
  que dit le reste du site).
- Deux P0 de l'audit du 30/07 ont été réglés depuis, et bien : le **crédit
  CC BY 4.0** est au footer, et le **sélecteur de spoiler** existe
  (`SpoilerFilter` au layout racine + endpoint `/spoiler-limit`, avec
  validation du `redirectTo`). Mais l'application du cap reste **à la main
  dans chaque loader**, et `/abilities` (via `nenRuntime.listAbilities()`,
  sans profil) l'ignore toujours.
- Défauts de données détectés et jamais gardés par un test : 3 intérieurs à
  `elevation: 0` sous un pont à 72 m ; 20 structures mieux sourcées que la pièce
  qui les contient ; 25 espaces `inferred` citant « le plan ».

#### G. Sécurité

Le socle est bon (CSP stricte, cookies httpOnly, en-têtes doublés proxy+app,
sessions admin liées au mot de passe, réseau Docker privé). Restent :

- Les images de prod font `COPY --from=builder /app /app` : **sources,
  devDependencies et toolchain embarqués** — surface d'attaque et taille
  inutiles.
- Toute l'authentification admin a **0 test** ; les règles ESLint type-aware
  (`no-floating-promises`, `no-misused-promises`) sont désactivées sur une base
  fortement asynchrone.
- Pas d'audit de dépendances en CI, pas de Dependabot/Renovate.

#### H. Sauvegarde

- `backup.sh` est exemplaire dans sa logique… mais **les dumps ne quittent
  jamais l'hôte** : perdre le serveur Hetzner perd la base *et* ses 14 jours de
  sauvegardes.
- **La restauration n'est jamais testée automatiquement.**
- Le constat qui change tout : la base étant presque entièrement dérivable de
  git (seed + backfills), le seul irremplaçable est **l'état utilisateur**
  (branches de simulation, éditions admin). Rien ne le distingue aujourd'hui
  dans la stratégie de sauvegarde.

---

## Partie 2 — Décision proposée

### 2.1 Décision

Adopter l'architecture **« le canon compile »** : dans tout le dépôt, chaque
fait canonique n'a **une seule déclaration**, dans `data/` ; tout le reste —
base, registres UI, i18n, géométrie, panneaux « Pourquoi ? » — est une
**projection dérivée, générée ou compilée**, vérifiée en CI. Ce n'est pas une
réécriture : c'est l'achèvement du principe que le README revendique déjà
(« Nothing is stored twice ») et que trois couches violent.

### 2.2 Options considérées

#### Option A — Statu quo outillé (patchs ciblés, pas de refonte)

| Dimension | Évaluation |
| --- | --- |
| Complexité | Faible |
| Coût | ~2 semaines |
| Scalabilité | Inchangée (replay O(n) corrigeable ponctuellement) |
| Fidélité canon | Divergences colmatées mais structurellement rouvertes à chaque hatsu |

**Pour :** livre les P0/P1 vite ; zéro risque de régression.
**Contre :** la double pile Nen continue de croître (8 vagues de hatsu prévues) ;
chaque correction de divergence est à refaire ; la dette croît plus vite que le
remboursement.

#### Option B — « Le canon compile » (recommandée)

| Dimension | Évaluation |
| --- | --- |
| Complexité | Moyenne — refactor par coutures existantes, pas de big-bang |
| Coût | ~6-8 semaines réparties, chaque chantier livrable seul |
| Scalabilité | Snapshots + cache HTTP : lecture en O(delta) et souvent O(0) |
| Fidélité canon | Divergence **impossible par construction** + canon-lint en CI |

**Pour :** supprime la classe de bugs plutôt que ses instances ; réduit ~10 000
LOC dupliquées ; rend les 8 vagues de hatsu ~3× moins chères ; conserve stack,
hébergeur et modèle de données.
**Contre :** gel partiel des features pendant les chantiers 2-3 ; migration du
registre web = le refactor le plus délicat du dépôt (couche visuelle très fine).

#### Option C — Réécriture en services (API séparée, workers, CDN, multi-nœuds)

| Dimension | Évaluation |
| --- | --- |
| Complexité | Élevée |
| Coût | Plusieurs mois |
| Scalabilité | Excellente — mais pour un trafic que rien n'annonce |
| Fidélité canon | Neutre (ne résout pas la duplication par elle-même) |

**Contre :** un seul mainteneur, un serveur à 2 vCPU suffit à un site en lecture
quasi pure ; `apps/worker` vide est précisément la trace d'une ambition de ce
type restée lettre morte. Rejetée.

### 2.3 Architecture cible (Option B)

```
            ┌───────────────────────────────────────────────────────────┐
  ÉCRIRE    │ data/ — LA source canonique (CC BY, diffable, contribuable)│
            │ characters · abilities · events · chapters · locations ·  │
            │ factions · relations.json (nouveau) · ship/blueprint.json │
            └────────────────────────────┬──────────────────────────────┘
                                         │ validé par
            ┌────────────────────────────▼──────────────────────────────┐
  VÉRIFIER  │ packages/contracts (aujourd'hui vide → le remplir)        │
            │ Schémas zod du catalogue + types de projections partagés  │
            │ « canon-lint » en CI : slugs, autorité des sources,       │
            │ élévations, ordre chronologique, couverture spoiler       │
            └────────────────────────────┬──────────────────────────────┘
                                         │ compilé par
            ┌────────────────────────────▼──────────────────────────────┐
  COMPILER  │ packages/canon-compiler (ex-backfills .mjs → TS typé,     │
            │ testé, idempotent) : data/ ──▶ PostgreSQL (+ snapshots)   │
            │ ET data/ + manifests des modules ──▶ artefacts générés :  │
            │   hatsuRegistry.gen.ts · squelettes i18n · index de tour  │
            └────────────────────────────┬──────────────────────────────┘
                                         │ servi par
            ┌────────────────────────────▼──────────────────────────────┐
  SERVIR    │ apps/web — loaders minces : locals.canon (spoiler appliqué │
            │ une fois dans hooks.server) + cache HTTP versionné        │
            │ apps/admin — actions branchées, testées                   │
            │ UN registre d'exécution : ability-modules ; DOM et 3D     │
            │ sont des *renderers* de l'interactionManifest             │
            └───────────────────────────────────────────────────────────┘

  État utilisateur (non dérivable) : WorldBranch/WorldEventRecord + admin
  → dump dédié, exfiltré chaque nuit (Storage Box), restore testé en CI.
```

Les six principes :

1. **Une déclaration par fait.** Le catalogue hatsu n'existe qu'en deux
   endroits complémentaires : `abilities.json` (le *quoi* canonique) et le
   module (`le *comment* exécutable`), liés par `moduleKey` — déjà en place
   pour 82/82. `hatsuRegistry.ts`, les i18n hatsu et les tables du tour
   deviennent des **fichiers générés** (`*.gen.ts`, commités pour rester
   diffables, régénérés + vérifiés en CI). Toute divergence devient un échec de
   build, pas un bug de prod.
2. **Le contrat avant la donnée.** `packages/contracts` (vide aujourd'hui)
   reçoit les schémas zod de chaque fichier de `data/` et les invariants
   inter-fichiers : `ownerId` existe dans characters, autorité
   `manga → panel → plan → inferred` jamais inversée, `elevation` cohérente
   avec le niveau parent, chaque entité visible porte de quoi être filtrée par
   spoiler. Les trois familles de défauts de données trouvées à l'audit
   deviennent non-reproductibles.
3. **Le moteur est le seul interprète du Nen.** La couche DOM
   (`GlobalHatsuEffects`), la couche 3D (`tour/hatsu.ts`) et les contrats de
   jeu (`arena/hatsu`, `hunt/nen`) cessent de réimplémenter ou redéclarer les
   règles : ils rendent l'`interactionManifest` et les événements typés émis
   par les modules (primitives déjà listées dans `docs/hatsu-potentiel.md` :
   `ABILITY_REVOKED`, `EFFECT_STATE_CHANGED`, `postMortem`, `appearsAs`…).
   Nuance importante : les **simulations** du tour (`TourWorld`, ticker,
   Morena), de l'arène (`combat/reducer.ts`) et de la traque restent des
   moteurs de rendu/jeu distincts — c'est légitime, ce sont des *médias*
   différents. Ce qui doit être unique, c'est le **vocabulaire** (`kind`,
   ciblage, coûts, conditions) et les **faits de catalogue** qu'ils
   consomment. Modèle à suivre : Morena (règles dans le module `contagion`,
   tour simple renderer). Cible mesurable : 0 `cost`/`condition`/`rule` écrit
   en dur dans `apps/web`, mêmes tests comportementaux pour tous les rendus.
4. **Lire, c'est projeter — pas rejouer.** Implémenter `getNearestSnapshot`
   (le modèle `WorldProjectionSnapshot` existe) : le compiler matérialise un
   snapshot tous les N événements, `getWorldState` rejoue le delta. En
   complément, cache HTTP : les pages canon sont immuables entre deux
   déploiements à cap de spoiler donné →
   `Cache-Control: public, s-maxage` + clé de version de déploiement, varié par
   cookie de cap. Le blueprint passe en import dynamique + `Cache-Control:
   immutable` versionné ; le tour passe à un mesh par espace + portal culling
   (le graphe `plan.doorways` existe déjà).
5. **Chaque écriture a un budget et un test.** Actions admin branchées et
   testées (auth comprise) ; backfills devenus `canon-compiler` : TS strict,
   tests, exécutés en CI sur base jetable à chaque PR — le déploiement ne
   rejoue plus jamais du code jamais typechecké.
6. **Sauvegarder ce qui est irremplaçable, prouver le reste.** Git est la
   sauvegarde du canon ; la CI prouve `data/ → DB` reproductible. Les dumps
   (état utilisateur surtout) sont exfiltrés chaque nuit vers un Hetzner
   Storage Box (rclone/borg, chiffré) ; un job hebdomadaire restaure le dernier
   dump dans un Postgres jetable et fait un smoke-test — une sauvegarde
   non-restaurée n'existe pas, le commentaire de `backup.sh` le sait déjà.

### 2.4 Simplifications de périmètre

- **Supprimer** : `packages/map-engine`, `packages/config`, `packages/ui`,
  `apps/worker` (vides ou morts), les 4 modèles Prisma morts (une migration),
  le service Postgres de la CI, `package-lock.json` de `database`.
- **Fusionner** : les micro-moteurs `identity/knowledge/perspective/spoiler`
  (76-264 LOC chacun) deviennent des sous-modules d'un seul
  `packages/canon-engine` avec `world/timeline` — les frontières internes
  restent des dossiers, on garde les tests, on supprime 5 configs de paquet et
  le runner jest divergent.
- **Standardiser** : vitest partout, `noUncheckedIndexedAccess: true`,
  règles type-aware réactivées au moins sur `packages/**` et `lib/server/**`.

---

## Partie 3 — Conséquences

**Ce qui devient plus facile**

- Ajouter un hatsu = 1 entrée JSON + 1 module ; registre, i18n, panneaux et
  ciblage UI suivent. Les 8 vagues de `hatsu-potentiel.md` deviennent réalistes.
- Contribuer au canon = éditer du JSON validé par canon-lint (la promesse du
  README « corrections to canon are as welcome as code » devient outillée).
- Diagnostiquer : une divergence de canon est un échec de CI daté, plus une
  découverte d'utilisateur.
- Survivre à la perte du serveur : git + Storage Box + restore prouvé.

**Ce qui devient plus difficile / coûte**

- Un build step de plus (génération) et des fichiers `.gen.ts` à ne pas éditer
  à la main (garde-fou : en-tête + vérification de fraîcheur en CI).
- Pendant le chantier 3 (unification Nen), gel des nouvelles techniques.
- La fusion des micro-paquets réécrit des imports dans tout `apps/web`
  (mécanique, mais bruyante dans le diff).

**À revisiter plus tard**

- Multi-nœuds/CDN seulement si le trafic l'exige (le rate limiter et le cache
  seront alors à externaliser — Redis était déjà prévu dans le compose de dev).
- Recherche plein-texte (Postgres `tsvector` d'abord).
- L'admin comme éditeur de `data/` (PR GitHub générées) plutôt que d'écrire en
  base — cohérent avec « le canon vit dans git », à étudier après le chantier 2.

---

## Partie 4 — Plan de migration (chaque chantier livrable seul)

| # | Chantier | Contenu | Effort | Risque |
| --- | --- | --- | --- | --- |
| 0 | **Reliquat des P0** | ~~Crédit CC BY~~ (fait) ; ~~sélecteur de spoiler~~ (fait) ; spoiler sur `/abilities` ; `+error.svelte` web+admin ; brancher ou retirer les 3 formulaires admin en 405 | ~1 j | nul |
| 1 | **Filets de sécurité** | Tests admin (auth) + script `test` ; e2e smoke (home, ship, tour, un cast de hatsu, login admin) ; Sentry ; images multi-stage minces + tag = SHA git + `rollback.sh` ; `migrate diff --exit-code`, audit deps, couverture en CI | ~1 sem | faible |
| 2 | **Contracts + canon-compiler** | Remplir `packages/contracts` (zod + invariants) ; porter les `.mjs` en TS typé/testé ; canon-lint en CI sur base jetable ; supprimer paquets/modèles morts | ~1,5 sem | faible |
| 3 | **Unification Nen** | Générer `hatsuRegistry.gen.ts` + squelettes i18n depuis modules ; réconcilier les 27 noms / 48 owners (arbitrage canon au passage) ; DOM, 3D **et contrats arène/traque** consomment `interactionManifest` (les `arenaDefinition` en dur deviennent des champs de manifest) ; porter les tests comportementaux du tour en tests du moteur. Les simulations elles-mêmes (TourWorld, combat/reducer, hunt) restent en place comme renderers — suivre le pattern Morena | ~4 sem | **moyen** — technique par technique, `bungee-gum` d'abord (pattern déjà documenté) ; `tour/hatsu.ts` a doublé en 4 jours, chaque semaine d'attente renchérit |
| 4 | **Lecture rapide** | `getNearestSnapshot` réel + snapshot périodique au compile ; cache HTTP versionné varié par cap de spoiler ; blueprint en import dynamique ; mesh par espace + portal culling (points 1-8 de l'audit tour en préalable rapide) | ~2 sem | moyen (3D) |
| 5 | **Sauvegarde prouvée** | Exfiltration nocturne chiffrée (Storage Box) ; dump séparé de l'état utilisateur ; job hebdo restore + smoke ; runbook mis à jour | ~2 j | faible |
| 6 | **Fusion des micro-paquets** | `canon-engine` unifié, vitest partout, flags TS durcis | ~3 j | mécanique |

Ordre imposé : 0 → 1 avant tout le reste (on ne refactore pas sans filet) ;
2 avant 3 (le générateur a besoin des contrats) ; 4 et 5 parallélisables ;
6 opportuniste. **Point de non-régression :** à chaque chantier, `pnpm lint`,
`typecheck`, `test`, e2e, et le canon-lint doivent être verts.

---

## Actions immédiates

1. [x] Valider cet ADR (ou l'amender) et le ranger en `docs/adr-001-le-canon-compile.md`.
2. [ ] Chantier 0 (reliquat des P0 de `completude.md`) — ~1 journée, aucune dépendance.
3. [ ] Ouvrir le chantier 1 ; geler l'ajout de nouveaux hatsu jusqu'à la fin du chantier 3.
4. [ ] Trancher au passage l'arbitrage de canon des 27 noms divergents (source d'autorité : `abilities.json`).

---

*Sources : lecture du dépôt au 2026-08-03 (manifests, `infrastructure/`, `schema.prisma`, hooks et loaders, `timeline-engine`, registres hatsu, `data/`) ; `docs/completude.md` (audit du 2026-07-30) ; audits mémorisés `/tour` et hatsu. Les chiffres datés du 30/07 sont signalés comme tels ; ceux vérifiés ce jour : 82 abilities avec `moduleKey` 82/82, 82 profils dans `hatsuRegistry.ts`, 134 événements dans `data/events/events.json`, `getNearestSnapshot` → `null` (`timeline-engine/src/index.ts:220`), crédit CC BY et `SpoilerFilter` présents au layout, `/abilities` toujours sans filtre, toujours aucun `+error.svelte`.*
