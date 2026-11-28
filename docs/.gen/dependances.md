<!-- généré par pnpm doc:gen — ne pas éditer -->

# Graphe des dépendances

Nœuds : 25 · Arêtes uniques : 63

## Arêtes

| Source | Cible | Occurrences |
| ------ | ----- | ----------- |
| `lib:arena` | `lib:combat` | 99 |
| `lib:arena` | `lib:fighting` | 36 |
| `lib:arena` | `lib:nen` | 9 |
| `lib:arena` | `lib:tour` | 32 |
| `lib:arena` | `package:@black-whale/nen-engine` | 5 |
| `lib:assets` | `lib:components` | 1 |
| `lib:assets` | `lib:map` | 2 |
| `lib:assets` | `lib:tour` | 6 |
| `lib:audio` | `lib:infiltration` | 1 |
| `lib:audio` | `package:@black-whale/nen-engine` | 4 |
| `lib:combat` | `lib:arena` | 2 |
| `lib:combat` | `lib:fighting` | 20 |
| `lib:combat` | `lib:tour` | 20 |
| `lib:combat` | `package:@black-whale/nen-engine` | 2 |
| `lib:components` | `package:@black-whale/domain` | 11 |
| `lib:components` | `package:@black-whale/nen-engine` | 3 |
| `lib:fighting` | `lib:components` | 2 |
| `lib:fighting` | `lib:tour` | 87 |
| `lib:fighting` | `package:@black-whale/domain` | 1 |
| `lib:fighting` | `package:@black-whale/nen-engine` | 28 |
| `lib:hunt` | `lib:arena` | 3 |
| `lib:hunt` | `lib:combat` | 1 |
| `lib:hunt` | `lib:nen` | 1 |
| `lib:hunt` | `lib:tour` | 28 |
| `lib:hunt` | `package:@black-whale/ability-modules` | 3 |
| `lib:hunt` | `package:@black-whale/nen-engine` | 3 |
| `lib:infiltration` | `lib:arena` | 5 |
| `lib:infiltration` | `lib:hunt` | 22 |
| `lib:infiltration` | `lib:nen` | 2 |
| `lib:infiltration` | `lib:tour` | 12 |
| `lib:nen` | `package:@black-whale/ability-modules` | 1 |
| `lib:nen` | `package:@black-whale/nen-engine` | 12 |
| `lib:reconstruction` | `package:@black-whale/canon-engine` | 1 |
| `lib:reconstruction` | `package:@black-whale/database` | 1 |
| `lib:server` | `package:@black-whale/ability-modules` | 3 |
| `lib:server` | `package:@black-whale/canon-engine` | 7 |
| `lib:server` | `package:@black-whale/database` | 1 |
| `lib:server` | `package:@black-whale/domain` | 3 |
| `lib:server` | `package:@black-whale/nen-engine` | 2 |
| `lib:server` | `package:@black-whale/simulation-engine` | 2 |
| `lib:strategy` | `package:@black-whale/ability-modules` | 1 |
| `lib:strategy` | `package:@black-whale/canon-engine` | 12 |
| `lib:strategy` | `package:@black-whale/simulation-engine` | 6 |
| `lib:tour` | `lib:components` | 2 |
| `lib:tour` | `lib:fighting` | 23 |
| `lib:tour` | `package:@black-whale/ability-modules` | 13 |
| `lib:tour` | `package:@black-whale/domain` | 4 |
| `lib:tour` | `package:@black-whale/nen-engine` | 36 |
| `lib:utils` | `lib:state` | 1 |
| `package:@black-whale/ability-modules` | `package:@black-whale/ability-sdk` | 68 |
| `package:@black-whale/ability-modules` | `package:@black-whale/nen-engine` | 2 |
| `package:@black-whale/ability-sdk` | `package:@black-whale/canon-engine` | 3 |
| `package:@black-whale/ability-sdk` | `package:@black-whale/nen-engine` | 6 |
| `package:@black-whale/canon-compiler` | `package:@black-whale/ability-modules` | 1 |
| `package:@black-whale/canon-compiler` | `package:@black-whale/contracts` | 17 |
| `package:@black-whale/canon-compiler` | `package:@black-whale/domain` | 2 |
| `package:@black-whale/canon-compiler` | `package:@black-whale/nen-engine` | 13 |
| `package:@black-whale/canon-engine` | `package:@black-whale/database` | 4 |
| `package:@black-whale/canon-engine` | `package:@black-whale/domain` | 8 |
| `package:@black-whale/nen-engine` | `package:@black-whale/canon-engine` | 2 |
| `package:@black-whale/nen-engine` | `package:@black-whale/domain` | 2 |
| `package:@black-whale/simulation-engine` | `package:@black-whale/canon-engine` | 3 |
| `package:@black-whale/simulation-engine` | `package:@black-whale/database` | 1 |

## Cycles

- `lib:tour` → `lib:fighting` → `lib:tour`
- `lib:arena` → `lib:combat` → `lib:arena`
