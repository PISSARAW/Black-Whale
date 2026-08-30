---
titre: Database
etage: 2
couvre:
  - packages/database/**
depend-de: [01-le-canon]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `packages/database` — Couche de données

**Promet :** L'accès et la mutation sécurisée des données persistantes.
**Refuse :** La logique de résolution du monde (Canon Engine) ou la validation complexe (Contracts).
**Entrée publique :** `index.ts`
**Carte :** [01 le canon](../../docs/carte/01-le-canon.md)

## Découpage

| Groupe | Fichiers    | Responsabilité                 |
| ------ | ----------- | ------------------------------ |
| Client | `client.ts` | Connexion à la base de données |

## Invariants

- Toutes les mutations passent par les interfaces définies, aucune requête brute non validée.

## Ajouter quelque chose ici

Consulter [01 le canon](../../docs/carte/01-le-canon.md) et [11 les données](../../docs/carte/11-les-donnees.md).
