---
titre: Nen Engine
etage: 2
couvre:
  - packages/nen-engine/**
depend-de: [04-le-nen]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `packages/nen-engine` — Moteur de Nen

**Promet :** La résolution des capacités (Hatsu) et des interactions.
**Refuse :** La définition des capacités (définies via ability-sdk).
**Entrée publique :** `index.ts`
**Carte :** [04 le nen](../../docs/carte/04-le-nen.md)

## Découpage

| Groupe | Fichiers | Responsabilité |
| --- | --- | --- |
| Resolution | `resolver.ts`, `interaction.ts` | Calcul des effets et interactions des capacités |

## Invariants

- L'évaluation d'un Hatsu est déterministe.

## Ajouter quelque chose ici

Consulter [04 le nen](../../docs/carte/04-le-nen.md) et [un-hatsu](../../docs/geste/un-hatsu.md).
