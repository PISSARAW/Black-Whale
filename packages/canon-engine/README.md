---
titre: Canon Engine
etage: 2
couvre:
  - packages/canon-engine/**
depend-de: [01-le-canon]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `packages/canon-engine` — Moteur du Canon

**Promet :** L'évaluation et la résolution des faits dans le monde.
**Refuse :** La modification directe des données de base.
**Entrée publique :** `packages/canon-engine/src/index.ts`
**Carte :** [01 le canon](../../docs/carte/01-le-canon.md)

## Découpage

| Groupe   | Fichiers                                | Responsabilité             |
| -------- | --------------------------------------- | -------------------------- |
| World    | `packages/canon-engine/src/world/**`    | Gestion de l'état du monde |
| Timeline | `packages/canon-engine/src/timeline/**` | Temps et historique        |
| Identité | `packages/canon-engine/src/identity/**` | Résolution d'identités     |
| Spoiler  | `packages/canon-engine/src/spoiler/**`  | Gestion du cap de spoiler  |

## Invariants

- Les faits ne sont pas modifiables directement.

## Ajouter quelque chose ici

Consulter [01 le canon](../../docs/carte/01-le-canon.md).
