---
titre: Domain
etage: 2
couvre:
  - packages/domain/**
depend-de: []
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `packages/domain` — Règles métier et types universels

**Promet :** Les règles pures et les entités du monde (temps, identité).
**Refuse :** Toute dépendance à un framework ou un système de persistance.
**Entrée publique :** `index.ts`
**Carte :** [02 le temps](../../docs/carte/02-le-temps.md), [03 l'identité](../../docs/carte/03-l-identite.md)

## Découpage

| Groupe      | Fichiers                                        | Responsabilité                        |
| ----------- | ----------------------------------------------- | ------------------------------------- |
| Temporalité | `temporal.ts`, `ordering.ts`, `voyage-clock.ts` | Gérer le temps (StoryCursor, horloge) |
| Identité    | `identity.ts`                                   | Corps, conscience, aura               |

## Invariants

- Le domaine ne dépend d'aucun paquet.

## Ajouter quelque chose ici

Consulter les cartes d'architecture.
