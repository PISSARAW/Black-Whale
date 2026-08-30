---
titre: Canon Compiler
etage: 2
couvre:
  - packages/canon-compiler/**
depend-de: [01-le-canon]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `packages/canon-compiler` — Compilateur de Canon

**Promet :** La compilation des sources de données statiques en un canon optimisé.
**Refuse :** La persistance ou l'évaluation dynamique (runtime).
**Entrée publique :** `index.ts`
**Carte :** [01 le canon](../../docs/carte/01-le-canon.md)

## Découpage

| Groupe      | Fichiers                   | Responsabilité                                 |
| ----------- | -------------------------- | ---------------------------------------------- |
| Compilateur | `compiler.ts`, `parser.ts` | Extraction et assemblage des données statiques |

## Invariants

- Le compilateur vérifie la cohérence totale des données avant de produire le résultat.

## Ajouter quelque chose ici

Consulter [01 le canon](../../docs/carte/01-le-canon.md).
