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

> Ce territoire répond à : le contrat d'un fichier de données, ce que canon-lint refuse. Il ne répond pas à la compilation ni à la logique de jeu.

## Le trajet

`data/abilities/abilities.json` → `packages/contracts/src/schemas.ts` → `packages/contracts/src/lint.ts` → `packages/contracts/src/invariants.ts`

## Les frontières

| Ce dossier …                           | Règle                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `data/`                                | est l'archive JSON ; n'importe aucun code, ne contient aucune logique.     |
| `packages/contracts/src/schemas.ts`    | valide la structure isolée des JSON.                                       |
| `packages/contracts/src/invariants.ts` | valide les références inter-fichiers, les unicités et l'ordre des sources. |

## Les faits qui ne se lisent pas dans le code

- Un fait est daté par `occurredAt` et rien d'autre (`data/CONVENTIONS.md`).
- `basis: "bracketed"` est calculé par `packages/domain` et ne s'écrit jamais à la main.
- Un tier n'est pas une position (`shipLocation.room` doit nommer une pièce).
- La provenance est ordonnée : `manga > panel > plan > map > inferred` (`packages/contracts/src/schemas.ts`).

## Les pièges

- Corriger un JSON sans relancer `pnpm canon-lint` : le fichier peut sembler valide localement mais violer un invariant inter-fichier.
- Poser une position sur un tier nu : `tier-3` est un pont, pas une pièce.
- Citer une source plus faible que son contenant : un fait `manga` ne peut pas contenir un fait `inferred`.

## Par où entrer

| Je veux …                             | J'ouvre                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| ajouter ou corriger un personnage     | `data/characters/characters.json`                                             |
| ajouter une salle                     | `data/locations/locations.json`                                               |
| changer la règle d'une provenance     | `packages/contracts/src/schemas.ts` et `packages/contracts/src/invariants.ts` |
| comprendre une erreur de `canon-lint` | `packages/contracts/src/lint.ts`                                              |

## Vérifier

pnpm canon-lint
pnpm --filter @black-whale/contracts test
