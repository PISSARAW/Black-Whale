---
titre: Ajouter un événement
etage: 1
couvre:
  - data/events/**
  - data/chapters/**
  - packages/canon-engine/**
depend-de: [01-le-canon, 02-le-temps]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# Ajouter un événement

1. Créer la définition de l'événement dans `data/events/<nom>.json`.
2. L'ajouter à la chronologie d'un chapitre dans `data/chapters/<chapitre>.json`.
3. (Si nécessaire) Ajuster le moteur dans `packages/canon-engine/world/events.ts`.
4. Vérifier que la compilation canon réussit avec :
   `pnpm --filter @black-whale/canon-compiler test`
