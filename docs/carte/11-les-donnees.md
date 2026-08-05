---
titre: Les données
etage: 1
couvre:
  - data/CONVENTIONS.md
  - packages/contracts/**
  - data/**/*.json
depend-de: [01-le-canon]
revu-le: 2026-08-05
empreinte: 8f3f6c3
decisions: [adr-001, adr-006]
---

# Les données

> Ce territoire répond à : qu'est-ce qu'un fichier de données canonique, comment le valider, et quelles règles du catalogue ne se lisent pas dans un seul JSON. Il ne répond pas à la compilation (`packages/canon-compiler`) ni à la consommation par le moteur (`packages/canon-engine`).

## Promet

- `data/` est l'archive canonique : personnages, lieux, événements, capacités, plan du navire, prophéties.
- `data/CONVENTIONS.md` fixe les règles de nommage, les dates, les positions et les provenances.
- `packages/contracts` décrit et valide chaque fichier de `data/` avec Zod, puis vérifie les invariants inter-fichiers.
- `pnpm canon-lint` échoue si un fichier est mal formé ou contredit un autre.

## Refuse

- Aucun fichier de `data/` ne contient de logique, de rendu ou de dérivé calculé.
- Aucun fichier de `data/` ne cite directement `apps/web`, `apps/admin` ou un paquet interne.
- `packages/contracts` n'écrit pas dans la base : il lit et juge.
- Les champs `id` ne sont jamais dupliqués dans un même catalogue.

## Entrées

- `data/characters/characters.json`, `data/characters/appearance.json`
- `data/abilities/abilities.json`
- `data/locations/locations.json`
- `data/chapters/chapters.json`
- `data/events/events.json`
- `data/factions/factions.json`
- `data/prophecies/prophecies.json`
- `data/ship/blueprint.json`
- `packages/contracts/src/index.ts` — exports des schémas, types, `canonLint`, `INVARIANTS`.
- `packages/contracts/src/lint.ts` — `canonLint(dataRoot)`.
- `packages/contracts/src/schemas.ts` — schémas Zod et provenances.
- `packages/contracts/src/invariants.ts` — règles entre fichiers.

## Carte

- [01 le canon](01-le-canon.md) — du fait au monde servi.
- [04 le nen](04-le-nen.md) — catalogue des capacités.
- [06 le navire](06-le-navire.md) — plan et projection du vaisseau.

## Le trajet

```
data/*.json
  → packages/contracts/src/schemas.ts (zod)
  → packages/contracts/src/lint.ts (canonLint)
  → packages/contracts/src/invariants.ts (INVARIANTS)
  → exit code 0 ou findings list
```

Si `canonLint` retourne un catalogue valide, `packages/canon-compiler` peut ensuite le transformer en base et en `packages/canon-engine/src/world`.

## Les frontières

| Ce dossier … | Règle |
| ------------ | ----- |
| `data/` | Archive JSON. Pas de logique. Pas d'import de code. |
| `packages/contracts/src/schemas.ts` | Déclare ce que le site lit dans chaque fichier. Tolérant sur les champs inutilisés. |
| `packages/contracts/src/invariants.ts` | Vérifie les références, les unicités, l'ordre des sources, la cohérence spoiler. |
| `packages/contracts/src/lint.ts` | Orchestrateur : d'abord schéma, ensuite invariants. |

## Les faits qui ne se lisent pas dans le code

- **Un fait est daté par `occurredAt` et rien d'autre.** `data/CONVENTIONS.md` §Dates : `basis` vaut `stated`, `derived` ou `bracketed` — ce dernier est calculé par `packages/domain` et ne s'écrit jamais à la main.
- **La source d'une date est traçable.** `source: "manga"` par défaut ; `source: "community"` marque une transcription Hunterpedia.
- **Un tier n'est pas une position.** `data/CONVENTIONS.md` §Positions : `shipLocation.room` doit nommer une pièce ; un tier nu est rejeté par `canon-lint` et `verify:map`.
- **La provenance est ordonnée.** `packages/contracts/src/schemas.ts` définit `manga > panel > plan > map > inferred`. Un contenant ne peut pas citer une source plus faible que ce qu'il contient (`packages/contracts/src/invariants.ts`).
- **`occurredAtLabel` est rendu, pas rédigé.** `packages/canon-compiler` le produit depuis `occurredAt` ; un test échoue si le libellé du fichier diverge.
- **`id` unique par catalogue.** `packages/contracts/src/invariants.ts` refuse les doublons dans chaque fichier de catalogue.

## Les pièges

- **Corriger un JSON sans relancer `pnpm canon-lint`** : le fichier peut sembler valide et pourtant violer un invariant inter-fichier.
- **Écrire `basis: "bracketed"` à la main** : c'est une valeur calculée ; l'inventer fige une approximation en fait.
- **Poser une position sur un tier nu** : `tier-3` est un pont, pas une pièce. La présence projetée atterrira en `black-whale-unknown` ou échouera.
- **Dupliquer un `id`** : le fichier passe au schéma mais échoue à `unique-ids`.
- **Citer une source plus faible que son contenant** : un fait `manga` ne peut pas contenir un fait `inferred` sans que `canon-lint` ne refuse.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| ajouter ou corriger un personnage | `data/characters/characters.json`, puis `pnpm canon-lint` |
| ajouter une salle | `data/locations/locations.json`, puis `pnpm canon-lint` |
| ajouter un chapitre ou un événement | `data/chapters/chapters.json` ou `data/events/events.json`, puis `pnpm canon-lint` |
| ajouter un Hatsu au catalogue | `data/abilities/abilities.json`, puis `pnpm canon-lint` |
| changer la règle d'une provenance | `packages/contracts/src/schemas.ts` et `packages/contracts/src/invariants.ts` |
| ajouter un invariant inter-fichier | `packages/contracts/src/invariants.ts` + un test dans `packages/contracts` |
| comprendre une erreur de `canon-lint` | `packages/contracts/src/lint.ts` et `packages/contracts/src/types.ts` |

## Vérifier

```
pnpm canon-lint
pnpm --filter @black-whale/contracts test
pnpm --filter @black-whale/canon-compiler compile:map:dev
pnpm doc-lint
```
