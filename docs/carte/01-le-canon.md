---
titre: Le canon
etage: 1
couvre:
  - data/**
  - packages/canon-compiler/**
  - packages/database/**
  - packages/canon-engine/src/world/**
depend-de: [11-les-donnees, 03-l-identite]
revu-le: 2026-08-05
empreinte: cc875a3
decisions: [adr-001, adr-006]
---

# Le canon

> Du fait déclaré dans `data/` au monde servi en mémoire : où vit un fait, qui le compile, qui le garde, et qui en fait une scène. Cette carte ne couvre pas le temps, l'identité détaillée ou les modes jouables.

## Promet / Refuse / Entrées / Carte

**Promet :** `data/` est la seule source de vérité pour les faits du monde ; `packages/canon-compiler` les projette dans `packages/database` ; `packages/canon-engine/src/world` les réduit en un état pur et les sert aux consommateurs.

**Refuse :** aucun fichier de `data/` ne contient de logique, de rendu ou de dérivé calculé ; `packages/database` n'est pas accessible directement depuis `apps/web` ou `apps/admin` sans passer par `apps/web/src/lib/server/` (voir [09 la façade web](09-la-facade-web.md)) ; `packages/canon-engine/src/world` ne fait pas de requête Prisma.

**Entrées publiques :**

- `data/**` : les fichiers JSON de chaque dossier (`data/characters/characters.json`, `data/locations/locations.json`, etc.).
- `packages/canon-compiler/src/index.ts` : exports des passes `chapters`, `characters`, `rooms`, `trajectory`, `packages/canon-compiler/src/map/run.ts`, `packages/canon-compiler/src/map/presence-choice.ts`.
- `packages/database/src/index.ts` : exporte `PrismaClient` et tout le client Prisma.
- `packages/canon-engine/src/world/index.ts` : exports de `cursor`, `state`, `events`, `reducer`, `branch`, `projections`.

**Carte :** [11 les données](11-les-donnees.md) pour le contrat d'un fichier JSON ; [03 l'identité](03-l-identite.md) pour la séparation corps / conscience / aura ; [02 le temps](02-le-temps.md) pour les trois horloges du récit.

## Le trajet

`data/characters/characters.json` et `data/locations/locations.json`
→ `packages/contracts/src/lint.ts` (`canonLint`)
→ `packages/canon-compiler/src/catalogue.ts` (`loadCatalogue`)
→ `packages/canon-compiler/src/cli/run.ts`
→ `packages/canon-compiler/src/map/run.ts` (`compileMap`)
→ `packages/database/prisma/schema.prisma`
→ `packages/canon-engine/src/world/index.ts`
→ `packages/canon-engine/src/world/reducer.ts` (`reduceWorld`, `replayWorld`)
→ `packages/canon-engine/src/world/projections.ts` (`projectMapScene`)

## Les frontières

| Ce dossier …                         | Règle                                                                                                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/**`                            | Déclare. Ne contient que du JSON ; `packages/contracts` valide chaque fichier contre son schéma, puis l'archive contre elle-même (`packages/contracts/src/invariants.ts`).                      |
| `packages/canon-compiler/**`         | Compile. Lit `data/` et écrit dans la base. Chaque passe est un script CLI (`packages/canon-compiler/package.json`) ; le runtime web ne l'importe pas.                                          |
| `packages/database/**`               | Persiste. Seul endroit qui ouvre `PrismaClient`. Les migrations déplacent le schéma ; le contenu arrive par les passes du compilateur.                                                          |
| `packages/canon-engine/src/world/**` | Réduit. Transforme un flux d'événements en un `WorldState` pur. Importé par `packages/ability-modules`, `packages/nen-engine`, `packages/simulation-engine` et, via le serveur, par `apps/web`. |

## Les faits qui ne se lisent pas dans le code

- **Un fait est lu avant d'être compilé.** `packages/contracts/src/lint.ts` appelle `canonLint` : schéma d'abord, invariants ensuite. Si un fichier est invalide, les invariants ne tournent pas, afin d'éviter de raisonner sur des valeurs incertaines.
- **La base ne se remplit pas avec les migrations.** `packages/canon-compiler/src/map/run.ts` : "`migrate deploy` only moves the schema. Everything the archive shows — locations, characters, presences — lives in `data/characters/characters.json` and reaches the database solely through this pass."
- **Une présence est un intervalle demi-ouvert.** `packages/canon-compiler/src/trajectory.ts` : une étape se ferme à l'événement _suivant_, de sorte qu'un personnage mort dans un événement y est encore présent pendant qu'il meurt.
- **`death` n'est pas une fin si le personnage réapparaît.** `packages/canon-compiler/src/characters.ts` (`deathChapter`) : Hisoka est marqué `death` au chapitre 356 et réapparaît au 357, donc il ne quitte jamais la carte.
- **Un tier n'est pas une position.** `data/CONVENTIONS.md` §Positions : `tier-3` est un pont, pas un endroit. `packages/canon-compiler/src/rooms.ts` (`locationCandidates`) retombe sur `black-whale-unknown` plutôt que de laisser un passager dans le vide d'un couloir.
- **L'héritage de Benjamin et la mort du lanceur sont des règles du monde, pas des capacités.** `packages/canon-engine/src/world/reducer.ts` (`applyInheritanceInvariant`, `applyPostMortemInvariant`) les applique à chaque `BODY_STATE_CHANGED` vers `DEAD` ou `DESTROYED`.

## Les pièges

- **Ne pas confondre `pnpm canon-lint` avec `pnpm compile:map`.** Le premier vérifie `data/` sans base ; le second écrit dans la base. Une fiche corrigée dans `data/characters/characters.json` sans recompilation laisse la base obsolète.
- **`shipLocation.room` est du français ou de l'anglais mal normalisé.** `packages/canon-compiler/src/rooms.ts` (`NAMED_ROOM_SLUGS`) est la table de correspondance. Essayer de deviner la pièce par une règle aboutit à des slugs fantômes.
- **`temporalIdentityManaged` n'écrit pas de position par défaut.** `packages/canon-compiler/src/map/run.ts` : quand ce drapeau est vrai, l'identité possède l'historique ; sans `mapTrajectory`, aucune présence n'est créée, ce qui est voulu.
- **`replaceMapPresenceHistory` déplace tout l'historique d'une identité.** `packages/canon-compiler/src/map/identity.ts` (`rebaseIdentityHistory`) met à jour `firstVisibleEventId` du corps, des états et des occupations. L'utiliser à tort fait disparaître des présences passées.
- **Ne pas requêter Prisma depuis `packages/canon-engine/src/world`.** Le reducer est synchrone et purement fonctionnel (`packages/canon-engine/src/world/reducer.ts`). Y injecter un client Prisma rompt l'import dans `packages/nen-engine` et les tests unitaires.

## Par où entrer

| Je veux …                                              | J'ouvre                                                                                                                     |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| ajouter ou corriger un personnage                      | `data/characters/characters.json`, puis `pnpm canon-lint`, puis `pnpm --filter @black-whale/canon-compiler compile:map:dev` |
| ajouter une salle au navire                            | `data/locations/locations.json` et `data/README.md` ; relancer `compile:map:dev`                                            |
| corriger la position d'un personnage                   | `data/characters/characters.json` (`shipLocation` ou `mapTrajectory`), puis `compile:map:dev`                               |
| ajouter une règle du monde (mort, héritage, transfert) | `packages/canon-engine/src/world/reducer.ts` et un test dans `packages/canon-engine/test/post-mortem.spec.ts`               |
| créer une simulation ou une branche alternative        | `packages/canon-engine/src/world/branch.ts` (`InMemoryBranchEngine`)                                                        |
| vérifier la cohérence de l'archive                     | `pnpm canon-lint`                                                                                                           |

## Vérifier

```
pnpm canon-lint
pnpm --filter @black-whale/canon-compiler test
pnpm --filter @black-whale/canon-engine test
pnpm --filter @black-whale/database typecheck
```
