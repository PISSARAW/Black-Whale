---
titre: Le nen
etage: 1
couvre:
  - packages/ability-sdk/**
  - packages/ability-modules/**
  - packages/nen-engine/**
  - apps/web/src/lib/nen/**
  - apps/web/src/lib/tour/cast/**
depend-de: [11-les-donnees]
revu-le: 2026-08-05
empreinte: 000000
decisions: [adr-001, adr-006]
---

# Le nen

> Le nen est le système de capacités. Un Hatsu est déclaré dans `packages/ability-modules/`,
> compilé en profils et manifestes par `packages/canon-compiler`, puis consommé côté web
> par `lib/nen/` et la visite (`lib/tour/cast/`).

## Le trajet

```
data/abilities.json
        ↓
packages/ability-sdk         ← contrat de base d'une ability
        ↓
packages/ability-modules/*    ← 53 modules, un par Hatsu / famille
        ↓
packages/nen-engine           ← moteur de résolution des effets
        ↓
packages/canon-compiler       → hatsuProfiles.gen.ts, interactionManifests.gen.ts
        ↓
apps/web/src/lib/nen          ← registre client, résolution visuelle
        ↓
apps/web/src/lib/tour/cast    ← casts de la visite first-person
```

| Étape | Où | Responsabilité |
| ----- | -- | -------------- |
| Données | `data/abilities.json` | Déclaration des capacités et de leurs règles |
| SDK | `packages/ability-sdk` | Types et helpers communs à toutes les abilities |
| Modules | `packages/ability-modules/**` | Implémentation spécifique de chaque Hatsu |
| Moteur | `packages/nen-engine` | Résolution générique des effets, coûts, ciblages |
| Compiler | `packages/canon-compiler` | Génère les profils et manifestes consommés par le web |
| Web | `apps/web/src/lib/nen` | Registre Hatsu, helpers de cast et de ciblage |
| Visite | `apps/web/src/lib/tour/cast` | Traduction des effets en animations, sons, apparences |

## Les frontières

| Ce dossier … | Règle |
| ------------ | ----- |
| `ability-modules/` | Ne dépend pas du rendu web. Une règle Hatsu doit compiler sans Svelte. |
| `nen-engine/` | Ne connaît pas les modules spécifiques : il travaille sur le contrat SDK. |
| `lib/nen/` | Ne lit pas directement `data/abilities.json` : il consomme les `.gen.ts`. |
| `tour/cast/` | Ne réécrit pas la règle : il traduit le résultat du moteur en pixels. |

## Les faits qui ne se lisent pas dans le code

- **53 modules d'ability.** Chaque module est une famille ou un Hatsu isolé ; le nombre est mesuré et stable.
- **Les `.gen.ts` sont commités.** Ils sont générés par le canon-compiler et vérifiés frais en CI.
- **Le moteur ne sait pas dessiner.** `nen-engine` dit ce qui arrive ; `lib/tour/cast/` choisit comment le montrer.

## Les pièges

- **Ne pas éditer `hatsuProfiles.gen.ts` à la main.** La source de vérité est `data/abilities.json` et les modules.
- **Un changement de règle Hatsu doit passer par `packages/canon-compiler`.** Le web ne relit pas les modules au runtime.
- **`lib/tour/cast/` n'est pas une règle.** Le code y traduit des décisions déjà prises ; s'il commence à décider, le bug est en amont.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| ajouter un Hatsu | `docs/geste/un-hatsu.md` + `packages/ability-modules/` |
| modifier une règle | le module concerné dans `packages/ability-modules/` |
| changer le rendu d'un cast | `apps/web/src/lib/tour/cast/` + cette carte |
| comprendre la compilation | `packages/canon-compiler/src/` |

## Vérifier

```
pnpm --filter @black-whale/canon-compiler check:hatsu
pnpm --filter @black-whale/nen-engine test
pnpm --filter @black-whale/web test tour/cast/
```
