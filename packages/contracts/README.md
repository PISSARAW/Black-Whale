---
titre: Contracts
etage: 2
couvre:
  - packages/contracts/**
depend-de: [11-les-donnees]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `packages/contracts` — Contrats et Schémas Zod

**Promet :** Validation des données et contrats d'interface stricts.
**Refuse :** La logique métier et l'accès à la base de données.
**Entrée publique :** `index.ts`
**Carte :** [11 les données](../../docs/carte/11-les-donnees.md)

## Découpage

| Groupe | Fichiers | Responsabilité |
| --- | --- | --- |
| Schemas | `*.schema.ts` | Schémas Zod |

## Invariants

- Tous les contrats sont stricts et validés.

## Ajouter quelque chose ici

Consulter [11 les données](../../docs/carte/11-les-donnees.md).
