---
titre: L'identité
etage: 1
couvre:
  - packages/domain/src/identity.ts
  - packages/canon-engine/src/identity/**
  - apps/web/src/lib/identity/**
  - apps/web/src/lib/server/identity-records.ts
depend-de: []
revu-le: 2026-08-05
empreinte: a3c5d2c
decisions: []
---

# L'identité

> Corps, conscience, aura : qui répond quoi. Ce territoire gère la séparation et l'association des entités physiques et spirituelles.

## Le trajet

`packages/domain/src/identity.ts` → `packages/canon-engine/src/identity/index.ts` → `apps/web/src/lib/server/identity-records.ts` → `apps/web/src/lib/identity/index.ts`

## Les frontières

| Ce dossier …     | Règle |
| ---------------- | ----- |
| importe          | Les contrats de domaine et les schémas de base. |
| n'importe jamais | Les vues ou les composants Svelte directement. |
| est importé par  | Le Nen (`ability-sdk`), la visite, et les modes (combat, infiltration). |

## Les faits qui ne se lisent pas dans le code

- Une identité n'est pas monolithique : un "joueur" possède un corps (physique), une conscience (décisionnelle), et une aura (Nen). Ces trois composantes peuvent être séparées (ex: manipulation).
- Les `identity-records` au serveur sont mis en cache et ne doivent pas être mutés par le client.

## Les pièges

- Confondre "ID de personnage" et "ID de conscience" lors d'un contrôle mental. L'action doit être validée contre la conscience, pas le corps.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| vérifier qui contrôle un corps | `packages/canon-engine/src/identity/possession.ts` |
| afficher le nom d'un personnage | `apps/web/src/lib/identity/display.ts` |

## Vérifier

pnpm --filter @black-whale/domain test identity
pnpm --filter @black-whale/canon-engine test identity
