---
titre: Ability SDK
etage: 2
couvre:
  - packages/ability-sdk/**
depend-de: [04-le-nen]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `packages/ability-sdk` — SDK des capacités Nen

**Promet :** Les primitives pour déclarer et modéliser un Hatsu.
**Refuse :** L'évaluation de l'effet dans le monde (qui appartient au nen-engine).
**Entrée publique :** `index.ts`
**Carte :** [04 le nen](../../docs/carte/04-le-nen.md)

## Découpage

| Groupe     | Fichiers                 | Responsabilité                |
| ---------- | ------------------------ | ----------------------------- |
| Définition | `builder.ts`, `types.ts` | Déclaration fluide d'un Hatsu |

## Invariants

- Les définitions sont sans effet de bord.

## Ajouter quelque chose ici

Consulter [04 le nen](../../docs/carte/04-le-nen.md) et [un-hatsu](../../docs/geste/un-hatsu.md).
