# ADR-006 — La doc ancrée

**Statut :** Accepté · **Date :** 2026-08-05 · **Portée :** tout le dépôt
**Suite de :** [ADR-001 « le canon compile »](adr-001-le-canon-compile.md), [ADR-002 « le découpage 500 »](adr-002-decoupage-500.md)

---

## 1. Contexte

Volumétrie mesurée le 2026-08-05 :

| Zone                       | Fichiers src | Lignes      |
| -------------------------- | -----------: | ----------: |
| `apps/web`                 |          818 |     155 294 |
| `packages/ability-modules` |           63 |      12 579 |
| `packages/canon-compiler`  |           45 |       4 753 |
| `packages/canon-engine`    |           23 |       2 723 |
| `apps/admin`               |           37 |       2 187 |
| `packages/contracts`       |           10 |       1 733 |
| `packages/nen-engine`      |            7 |       1 482 |
| `packages/ability-sdk`     |            7 |       1 436 |
| `packages/domain`          |           14 |         971 |
| `packages/simulation-engine` |          4 |         578 |
| **Total**                  |    **1 028** | **183 736** |

225 fichiers de test. 3 fichiers `.gen.ts`. 8 jeux de données dans `data/`. 24 routes publiques.
`apps/web/src/lib/tour` compte à lui seul ~140 fichiers.

Ce qui existe déjà comme documentation :

- `CLAUDE.md` — les trois bornes, le cliquet, la conduite à tenir. **Court, dur, lu.** C'est le modèle.
- `README.md` — 17 ko, orienté visiteur : ce que le site fait, pas comment le code est fait.
- `docs/adr-00{1..5}.md` — les décisions d'architecture. Excellents, mais ce sont des **instantanés
  de raisonnement**, pas une carte : ils disent pourquoi on a décidé, pas où est le code aujourd'hui.
- `docs/*-v2-backlog.md`, `docs/jeu-de-*.md`, `docs/tour-*.md` — 22 fichiers, ~500 ko, mélange de
  spécifications, de backlogs et de comptes rendus d'audit. Aucune règle de péremption : un backlog
  clos et une spécification vivante se ressemblent.
- `data/ship/README.md`, `data/prophecies/README.md` — deux fiches de données. Le bon geste, isolé.

**Le trou :** il n'existe aucun chemin de « je cherche X » vers « le fichier est ici, il promet ceci ».
Un agent qui doit toucher au son de la visite lit aujourd'hui `CLAUDE.md`, puis grep, puis ouvre
quatre fichiers de 1 000 lignes pour trouver la frontière. Ce coût est payé à chaque tâche.

---

## 2. Le problème que la doc doit résoudre

La doc n'a pas pour but d'expliquer le code : le code s'explique. Elle a trois usages, et trois seulement.

1. **Router.** Depuis une question en langue naturelle, désigner **un** fichier à ouvrir.
   Le test : « où se décide la réverbération d'une salle ? » doit se résoudre en une lecture,
   pas en quatre greps.
2. **Déclarer les frontières.** Ce qu'un dossier promet, ce qu'il refuse, qui a le droit de
   l'importer. C'est la seule information qu'aucune lecture de fichier ne donne : elle est
   **entre** les fichiers.
3. **Retenir l'irréductible.** Les pourquoi, les pièges, les faits mesurés, les décisions
   négatives (« GLTF rejeté », « pas de lumière ambiante à bord »). Ce qui a coûté cher à
   apprendre et que rien dans l'arbre ne rappelle.

Tout le reste — inventaires, signatures, listes d'exports, graphe d'imports, table des routes —
n'est **pas** de la doc. C'est une projection du code, et une projection écrite à la main est
une projection fausse dans trois semaines.

---

## 3. Décision

**La doc s'ancre ou n'existe pas.** Chaque page déclare en front-matter les chemins de code qu'elle
couvre et l'empreinte de ces chemins au moment de la dernière relecture. `doc-lint` — au même titre
que `canon-lint` (ADR-001) et `check-ratchet` (ADR-002) — échoue quand une page prétend couvrir un
chemin qui n'existe plus, quand un dossier couvert n'a pas de fiche, ou quand le code a dérivé
au-delà d'un seuil sous une page qui se dit à jour.

Corollaire, la doctrine de partage :

> Rien ne s'écrit à la main qui puisse être généré.
> Rien ne se génère qui puisse être lu directement dans le fichier.

Ce qui reste au milieu — la frontière et le pourquoi — est la doc, et il y en a peu.

### Les quatre étages

| Étage | Nom          | Où                        | Nombre | Écrit par | Taille cible |
| ----- | ------------ | ------------------------- | -----: | --------- | ------------ |
| 0     | Le routeur   | `docs/README.md`          |      1 | main      | ≤ 150 l      |
| 1     | Les cartes   | `docs/carte/*.md`         |     13 | main      | ≤ 400 l      |
| 2     | Les fiches   | `<dossier>/README.md`     |    ~32 | agents    | ≤ 200 l      |
| 3     | Le généré    | `docs/.gen/*.md`          |      7 | machine   | libre        |

Un agent lit **au plus deux fichiers** avant d'écrire : le routeur (ou directement la carte s'il
la connaît) et la fiche du dossier qu'il touche. Les `.gen` ne se lisent pas en entier, ils se
cherchent.

---

## 4. L'arborescence, fichier par fichier

```
CLAUDE.md                      ← inchangé. Ajouter 3 lignes : « la carte est docs/README.md »
README.md                      ← inchangé. Public visiteur.

docs/
├── README.md                  ★ ÉTAGE 0 — le routeur
│
├── carte/                     ★ ÉTAGE 1 — 13 territoires
│   ├── 01-le-canon.md
│   ├── 02-le-temps.md
│   ├── 03-l-identite.md
│   ├── 04-le-nen.md
│   ├── 05-la-visite.md
│   ├── 06-le-navire.md
│   ├── 07-les-modes.md
│   ├── 08-le-spoiler.md
│   ├── 09-la-facade-web.md
│   ├── 10-l-admin.md
│   ├── 11-les-donnees.md
│   ├── 12-l-exploitation.md
│   └── 13-les-bornes.md
│
├── geste/                     ★ les recettes — « comment ajouter un… »
│   ├── un-hatsu.md
│   ├── une-salle.md
│   ├── un-evenement.md
│   ├── un-mode-jouable.md
│   ├── une-route.md
│   └── une-migration.md
│
├── adr-001…006-*.md           ← inchangés, déplacés sous docs/decision/ (voir §9)
│
├── archive/                   ← les backlogs clos et les audits datés y descendent
│   ├── arena-v2-backlog.md
│   ├── hunt-v2-backlog.md
│   └── …
│
└── .gen/                      ★ ÉTAGE 3 — jamais édité à la main
    ├── symboles.md
    ├── dependances.md
    ├── routes.md
    ├── donnees.md
    ├── tests.md
    ├── bornes.md
    └── hatsu.md
```

Et l'étage 2, **colocalisé** — c'est le point qui fait la différence, la fiche vit à côté du code
qu'elle décrit et se déplace avec lui :

```
packages/domain/README.md              packages/canon-engine/README.md
packages/database/README.md            packages/canon-compiler/README.md
packages/contracts/README.md           packages/nen-engine/README.md
packages/ability-sdk/README.md         packages/ability-modules/README.md
packages/simulation-engine/README.md

apps/web/README.md                     apps/admin/README.md
apps/web/src/routes/README.md
apps/web/src/lib/tour/README.md        ← le plus important : ~140 fichiers
apps/web/src/lib/nen/README.md
apps/web/src/lib/server/README.md
apps/web/src/lib/components/tour/README.md
apps/web/src/lib/assets/maps/README.md
apps/web/src/lib/i18n/README.md
apps/web/src/lib/audio/README.md
apps/web/src/lib/map/README.md
apps/web/src/lib/identity/README.md
apps/web/src/lib/arena/README.md       apps/web/src/lib/combat/README.md
apps/web/src/lib/hunt/README.md        apps/web/src/lib/infiltration/README.md
apps/web/src/lib/investigation/README.md
apps/web/src/lib/reconstruction/README.md
apps/web/src/lib/strategy/README.md    apps/web/src/lib/state/README.md

data/README.md      (+ ship/ et prophecies/ déjà faits — servent de gabarit)
data/abilities/README.md   data/characters/README.md   data/events/README.md
data/chapters/README.md    data/factions/README.md     data/locations/README.md

infrastructure/README.md   scripts/README.md   tests/README.md
```

### Ce que couvre chaque carte

| Carte                 | Couvre                                                                                                                                        | Répond à                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **01 le canon**       | `data/**` → `packages/canon-compiler` → `packages/database` → `packages/canon-engine/world`                                                    | Où est déclaré un fait ? Que devient-il ? Qui a le droit de le réécrire ?    |
| **02 le temps**       | `domain/temporal.ts`, `ordering.ts`, `voyage-clock.ts`, `canon-engine/timeline`, `tour/hour.ts`                                                | `StoryCursor` vs horloge de bord vs heure de la visite — trois temps, un modèle |
| **03 l'identité**     | `domain/identity.ts`, `canon-engine/identity`, `lib/identity`, `lib/server/identity-records.ts`                                                | Corps, conscience, aura : qui répond quoi                                     |
| **04 le nen**         | `ability-sdk` → `ability-modules` (53) → `nen-engine` → `hatsuProfiles.gen.ts` / `interactionManifests.gen.ts` → `lib/nen` → `tour/hatsu.ts`   | Le trajet d'un hatsu de sa déclaration à son pixel. **La carte la plus lue.** |
| **05 la visite**      | `data/ship/blueprint.json` → `tour/blueprint.ts` → `geometry`/`mesh` → `TourRenderer` → lumière, son, poussière, apparitions                   | Comment la géométrie devient une salle qu'on traverse                        |
| **06 le navire**      | `lib/assets/maps/**`, `lib/map`, `server/mapPayload.ts`, `state/mapState.svelte.ts`, `routes/ship`                                             | La carte dessinée : projection, pas rendu                                     |
| **07 les modes**      | `arena`, `combat`, `hunt`, `infiltration`, `investigation`, `reconstruction`, `strategy` + leurs routes                                        | Ce que « jouable » veut dire ici ; le patron Morena (règles dans le module)   |
| **08 le spoiler**     | `canon-engine/spoiler`, `server/spoiler.ts`, `server/httpCache.ts`, `server/ability-visibility.ts`, `routes/spoiler-limit`                     | Le cap, sa propagation, la variation de cache. **Zone à invariants durs.**     |
| **09 la façade web**  | `apps/web/src/routes/**` (24 routes), `lib/server/**`, `lib/i18n`, `lib/seo`, `lib/config/features.ts`                                         | `load` vs action vs client ; où se pose la frontière serveur                  |
| **10 l'admin**        | `apps/admin/**`, session signée, écritures                                                                                                     | La seule zone qui écrit hors de `data/`                                       |
| **11 les données**    | `data/CONVENTIONS.md`, `packages/contracts` (zod + invariants), `data/**/*.json`                                                               | Le contrat d'un fichier de données, ce que canon-lint refuse                  |
| **12 l'exploitation** | `infrastructure/docker`, `infrastructure/hetzner`, `.github/workflows` (ci, restore-drill), sauvegardes                                        | Déployer, restaurer, ce qui casse en production                               |
| **13 les bornes**     | `eslint.config.js`, `.claude/hooks/enforce-limits.mjs`, `scripts/check-ratchet.test.ts`                                                        | Renvoie à `CLAUDE.md` + ADR-002. Ne réexplique rien.                          |

---

## 5. Les gabarits

### 5.1 Front-matter — obligatoire sur toute page des étages 1 et 2

```yaml
---
titre: La visite
etage: 1 # 0 routeur | 1 carte | 2 fiche
couvre: # chemins réels ; doc-lint vérifie qu'ils existent
  - apps/web/src/lib/tour/**
  - apps/web/src/lib/components/tour/**
  - data/ship/blueprint.json
depend-de: [04-le-nen, 11-les-donnees] # autres pages, pas des paquets
revu-le: 2026-08-05
empreinte: 41e9c7 # hash des chemins couverts à la relecture — posé par doc-lint --seal
decisions: [adr-003, adr-004, adr-005] # les ADR qui gouvernent ce territoire
---
```

`empreinte` est le cœur du dispositif. Elle ne dit pas « la page est juste », elle dit
**« quelqu'un a regardé ce code et cette page ensemble à cette date »**. Le reste est du calcul.

### 5.2 Gabarit d'une carte (étage 1)

```markdown
# <Territoire>

> Une phrase. Ce que ce territoire répond, et ce qu'il ne répond pas.

## Le trajet

<le pipeline en 4 à 8 étapes, chaque étape = un chemin de fichier cliquable>
data/ship/blueprint.json → tour/blueprint.ts → tour/geometry.ts → tour/mesh.ts → TourRenderer.ts

## Les frontières

| Ce dossier … | Règle |
| ------------ | ----- |
| importe      | …     |
| n'importe jamais | …  |
| est importé par  | …  |

## Les faits qui ne se lisent pas dans le code

<mesures, constantes justifiées, décisions négatives. Chacun avec sa source.>
- 2,1 m/s : la marche, dérivée de l'échelle de la reconstruction — pas un réglage de confort.
- Aucune lumière ambiante : il n'y en a pas à bord. Un couloir sans luminaire est noir.
- GLTF rejeté (ADR-005 §4) : la ressemblance passe par `appearance.json`, pas par un asset.

## Les pièges

<ce qui a déjà cassé, et pourquoi la correction évidente est mauvaise>

## Par où entrer

| Je veux …            | J'ouvre                  |
| -------------------- | ------------------------ |
| changer une salle    | `data/ship/blueprint.json` + fiche `data/ship/README.md` |
| changer une lumière  | `tour/light.ts`, puis `docs/carte/05-la-visite.md#lumiere` |

## Vérifier

<les commandes exactes qui prouvent que le territoire est sain>
pnpm --filter @black-whale/web test tour/
pnpm test:e2e tests/tour.spec.ts
```

### 5.3 Gabarit d'une fiche (étage 2) — le plus court, le plus rentable

```markdown
# `<chemin>` — <une ligne>

**Promet :** <ce que le dossier garantit à ses appelants>
**Refuse :** <ce qu'il ne fera jamais — le contrat négatif>
**Entrée publique :** `index.ts` → <symboles exportés qui comptent>
**Carte :** [05 la visite](../../../docs/carte/05-la-visite.md)

## Découpage

<un tableau : sous-groupe de fichiers → responsabilité. Pas fichier par fichier —
par groupe, sinon la fiche est un inventaire et pourrit.>

| Groupe                       | Fichiers          | Responsabilité |
| ---------------------------- | ----------------- | -------------- |
| Géométrie                    | `geometry`, `mesh`, `blueprint` | … |
| Rendu                        | `TourRenderer`, `TierView`, `PortalRenderer` | … |
| Ambiance                     | `light`, `dust`, `atmosphere`, `sky`, `hour` | … |
| Vue de page (`page*.ts`)     | 22 fichiers       | état et contrôleurs de `/tour` uniquement |

## Invariants

<3 à 6 lignes maximum, chacune adossée à un test nommé>
- Toute salle est atteignable — `blueprint.test.ts › aucune salle orpheline`

## Ajouter quelque chose ici

<renvoi vers docs/geste/*.md, ou 5 lignes si c'est propre au dossier>
```

### 5.4 Gabarit d'un geste (`docs/geste/*.md`)

Une liste numérotée d'actions, **chacune sur un chemin réel**, terminée par la commande de
vérification. Aucune prose. Test de qualité : un agent l'exécute sans ouvrir autre chose.

---

## 6. Ce qui se génère — l'étage 3

Sept artefacts, produits par `pnpm doc:gen`, sortis dans `docs/.gen/`, **commités** (pour que les
agents les lisent sans build) et vérifiés à jour en CI comme les `.gen.ts` du canon.

| Fichier           | Source                                                     | Contenu                                                                    |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `symboles.md`     | API TypeScript (`ts-morph`)                                 | Chaque export public de `packages/*` et `lib/*/index.ts` : signature + chemin:ligne |
| `dependances.md`  | graphe d'imports                                            | Arêtes entre paquets et entre dossiers de `lib` ; **cycles marqués**        |
| `routes.md`       | `apps/*/src/routes/**`                                      | 24 routes : paramètres, `+page.server.ts`, actions, cap de spoiler appliqué |
| `donnees.md`      | `packages/contracts` (zod) + `data/**`                      | Schéma de chaque fichier de données, nombre d'entrées, invariants inter-fichiers |
| `tests.md`        | 225 `*.test.ts` + 4 `*.spec.ts`                             | Nom de chaque `describe`/`it` → fichier. C'est la spécification exécutable.  |
| `bornes.md`       | `eslint.config.js` + `wc -l`                                | Les deux listes du cliquet, la longueur actuelle, la dérive depuis le commit précédent |
| `hatsu.md`        | `abilities.json` + manifests + `hatsuProfiles.gen.ts`       | 82 hatsu × castable / visuel / sonore / ciblage — le tableau tenu à la main aujourd'hui |

Chacun s'ouvre par la même ligne : `<!-- généré par pnpm doc:gen — ne pas éditer -->`, et `doc-lint`
échoue si un `.gen.md` est modifié à la main (diff non reproductible).

`tests.md` mérite un mot : avec 225 fichiers de test, la description de comportement la plus fiable
du dépôt est déjà écrite — dans les noms de tests. La générer coûte trente lignes de script et
supprime le besoin d'écrire à la main la moitié des sections « comportement ».

---

## 7. `doc-lint` — la règle qui rend le reste vrai

Nouveau paquet ou sous-commande de `packages/contracts` (qui héberge déjà `canon-lint`).
`pnpm doc-lint`, branché dans `.github/workflows/ci.yml`.

| # | Vérification                                                                                          | Sévérité |
| - | ----------------------------------------------------------------------------------------------------- | -------- |
| 1 | Tout chemin de `couvre:` existe                                                                        | erreur   |
| 2 | Tout lien interne (`.md`, `#ancre`, `chemin:ligne`) résout                                              | erreur   |
| 3 | Tout dossier de la **liste de couverture** possède un `README.md` avec front-matter valide             | erreur   |
| 4 | La liste de couverture **ne rétrécit jamais** (cliquet, à l'image de `check-ratchet`)                   | erreur   |
| 5 | Un `.gen.md` diffère de ce que `doc:gen` produit                                                        | erreur   |
| 6 | Une page d'étage 0/1/2 dépasse sa taille cible                                                          | erreur   |
| 7 | Le code sous `couvre:` a dérivé de > 15 % des lignes depuis `revu-le` → la page est marquée `à relire`  | avertis. |
| 8 | Une page n'est atteignable depuis aucun lien de `docs/README.md`                                        | avertis. |
| 9 | Un dossier de `lib/` ou `packages/` de plus de 8 fichiers sans fiche                                     | avertis. |

La règle 4 est le mécanisme qui a déjà fonctionné pour les bornes de longueur : on ne demande pas
que tout soit documenté demain, on interdit que la couverture recule. La règle 7 est ce qui empêche
la doc de mentir sans imposer une relecture à chaque commit — elle transforme la péremption en
tâche visible plutôt qu'en fausse assurance.

**Ce que `doc-lint` ne vérifie pas :** que la prose est exacte. Aucun outil ne le fait. C'est
pourquoi l'architecture pousse le maximum de charge vers l'étage 3, où la justesse est mécanique.

---

## 8. Les huit règles de rédaction

1. **Un chemin, pas une description.** « la logique de son » ne vaut rien ; `tour/reachSound.ts`
   vaut tout. Toute affirmation sur du code cite un chemin.
2. **Le contrat négatif d'abord.** Ce qu'un module refuse de faire cadre mieux qu'une liste de
   ce qu'il fait. `tour/morena.ts` — « The rules are not here » — est le modèle du dépôt.
3. **Un fait mesuré porte son chiffre et sa source.** « la haze est adaptée » → « la haze est
   calée sur la plus longue ligne de vue de la salle (`tour/atmosphere.ts`) ».
4. **Les décisions négatives sont de la doc.** GLTF rejeté, IBL rejeté, DoF rejeté, `inferredLamps`
   supprimé : sans elles, chaque agent repropose la même chose.
5. **Pas d'inventaire à la main.** Si un paragraphe énumère des fichiers, il appartient à `.gen`.
6. **Un exemple = un test existant.** On cite `fichier.test.ts › nom du cas` plutôt que d'inventer
   un extrait qui ne compile pas.
7. **Les bornes s'appliquent à la doc.** ≤ 500 lignes, comme le code (ADR-002). Une carte trop
   longue se scinde par sous-territoire, jamais en réduisant la police.
8. **Pas d'emoji** (règle ESLint existante, étendue à la doc pour cohérence).

### Ce qu'on ne documente pas

- Ce qu'une signature TypeScript dit déjà.
- Le fonctionnement de SvelteKit, Prisma, Three.js — on cite la version, on lie l'amont.
- L'état d'avancement d'un chantier : c'est le rôle des backlogs, qui descendent en `archive/`
  une fois clos.
- Les fichiers `.gen.ts`, `lib/i18n/messages/**`, `lib/assets/maps/**` : exemptés par nature,
  comme pour les bornes.

---

## 9. Ce qui bouge dans l'existant

| Aujourd'hui                                    | Devient                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `docs/adr-00{1..5}.md`                         | `docs/decision/adr-00{1..5}.md` — inchangés, regroupés                      |
| `docs/{arena,hunt,investigation,reconstruction,strategy}-v2-backlog.md`, `*-release*.md` | `docs/archive/` — datés, en lecture seule           |
| `docs/tour-{immersion,2.0,heure,classes-lumiere,lumiere-uniforme}.md` | fondus dans `docs/carte/05-la-visite.md` ; les mesures survivent, le récit descend en archive |
| `docs/jeu-de-morena.md`, `jeu-de-traque.md`, `infiltration-v2.md` | sources de `docs/carte/07-les-modes.md` + fiches des dossiers de mode |
| `docs/hatsu-potentiel.md` (70 ko)              | reste — c'est un plan de conception, pas une doc de code ; lié depuis la carte 04 |
| `docs/completude.md`                           | `docs/archive/` — audit daté du 2026-07-30, déjà corrigé par l'ADR-001      |
| `docs/decoupage-notes.md`                      | reste où il est (journal du découpage, cité par ADR-002)                    |
| `data/ship/README.md`, `data/prophecies/README.md` | ré-alignés sur le gabarit d'étage 2 — ils en sont déjà proches           |

Le tri seul divise `docs/` par deux et supprime l'ambiguïté « spécification vivante vs compte rendu ».

---

## 10. Ordre de rédaction

Six lots. L'ordre est celui du rendement : ce qui sert le plus tôt d'abord, ce qui coûte le plus
en dernier, et jamais de rédaction manuelle avant que la génération existe.

| Lot | Contenu                                                                          | Effort | Ce qu'on gagne dès la fin du lot                       |
| --- | -------------------------------------------------------------------------------- | ------ | ------------------------------------------------------- |
| 0   | `docs/README.md` (routeur) + tri de l'existant (§9) + 3 lignes dans `CLAUDE.md`   | 0,5 j  | Un point d'entrée. `docs/` cesse d'être un tas.         |
| 1   | `doc:gen` — `symboles`, `dependances`, `routes`, `tests`                          | 1,5 j  | **Le plus gros gain.** Un agent trouve un symbole sans grep. |
| 2   | `doc-lint` règles 1, 2, 5, 6 + branchement CI                                     | 1 j    | La doc ne peut plus pointer dans le vide.               |
| 3   | 13 cartes (étage 1), une par territoire                                           | 3–4 j  | Le routage marche. Un agent sait où il est.             |
| 4   | ~32 fiches (étage 2) — **parallélisable, un agent par dossier**                    | 2 j    | Les frontières sont écrites là où elles s'appliquent.   |
| 5   | `doc-lint` règles 3, 4, 7, 8, 9 + `donnees`, `bornes`, `hatsu` générés + `geste/` | 1,5 j  | Le cliquet. La couverture ne peut plus reculer.         |

Le lot 4 est le seul volumineux et c'est celui qui se délègue le mieux : chaque fiche ne dépend que
de son dossier et du gabarit. Un agent par paquet, en parallèle, chacun avec pour seule consigne
« lis `index.ts`, lis les tests, remplis le gabarit, n'invente aucun invariant que tu ne peux pas
adosser à un test nommé ».

**Séquencement avec l'ADR-001 :** les lots 0 à 2 sont indépendants et peuvent se faire tout de
suite. Le lot 3 gagne à attendre la fin du chantier 3 de l'ADR-001 (unification Nen) pour la
carte 04, qui décrirait sinon une architecture en cours de remplacement. Les douze autres cartes
ne sont pas concernées.

---

## 11. Conséquences

**Positives.** Le coût de la première lecture s'effondre pour tout agent. Les décisions négatives
cessent d'être reproposées. `docs/` devient un lieu où l'on cherche, pas un dépôt où l'on verse.
La péremption devient visible (`à relire`) au lieu d'être silencieuse.

**Négatives.** Trois vérifications de plus en CI et un `doc:gen` à maintenir. Le cliquet de
couverture (règle 4) crée une friction réelle : créer un dossier de plus de 8 fichiers oblige à
écrire vingt lignes de fiche. C'est l'effet recherché — c'est exactement la friction que le cliquet
des bornes exerce déjà avec succès.

**Risque principal.** Que les cartes d'étage 1 dérivent en récit et regrossissent comme
`tour-immersion.md` (35 ko). La borne à 400 lignes et la règle 5 (« pas d'inventaire à la main »)
sont les garde-fous ; la règle 7 rend la dérive mesurable.

### Alternatives rejetées

- **TypeDoc / api-extractor sur tout le dépôt.** Génère une référence exhaustive et illisible :
  1 028 fichiers de signatures que personne n'ouvre, et zéro frontière — précisément la seule
  information dont un agent a besoin. `docs/.gen/symboles.md` en récupère la partie utile pour
  un centième du coût.
- **Un site de doc (Docusaurus/Starlight).** Ajoute une chaîne de build et un déploiement pour
  un public — les visiteurs — que `README.md` et le site lui-même servent déjà mieux. Le lecteur
  réel de cette doc lit des fichiers, pas des pages.
- **Tout dans `CLAUDE.md`.** Sa force est d'être court et intégralement lu. Le diluer à
  4 000 lignes le tuerait.
- **Docstrings JSDoc partout.** Doublonne la signature, alourdit des fichiers déjà hors-borne
  (les commentaires comptent dans `max-lines`, ADR-002 §1) et ne peut pas porter une frontière,
  qui est par nature inter-fichiers.
