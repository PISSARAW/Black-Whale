---
titre: Les modes
etage: 1
couvre:
  - apps/web/src/lib/arena/**
  - apps/web/src/lib/combat/**
  - apps/web/src/lib/hunt/**
  - apps/web/src/lib/infiltration/**
  - apps/web/src/lib/investigation/**
  - apps/web/src/lib/reconstruction/**
  - apps/web/src/lib/strategy/**
  - apps/web/src/routes/arena/**
  - apps/web/src/routes/hunt/**
  - apps/web/src/routes/infiltration/**
  - apps/web/src/routes/investigation/**
  - apps/web/src/routes/reconstruction/**
  - apps/web/src/routes/strategy/**
depend-de:
  - 04-le-nen
  - 05-la-visite
  - 09-la-facade-web
  - 11-les-donnees
revu-le: 2026-08-05
empreinte: c3d9574
decisions:
  - adr-006
---

# Les modes

> Les six modes sont des tranches verticales jouables (le jeu de Morena, côté
> visite, a sa [fiche propre](../jeu-de-morena.md)). Ce territoire définit ce que "jouable" signifie ici et implémente le patron Morena : les règles vivent dans le module, le rendu dans la route.

## Promet

- Implémenter des expériences autonomes (`arena`, `hunt`, `infiltration`, `investigation`, `reconstruction`, `strategy`).
- Fournir un moteur partagé de résolution de conflits au corps-à-corps via `combat`.
- Maintenir un état isolé par mode avec son propre loop et ses propres règles d'avancement.

## Refuse

- Modifier ou dépendre de l'état d'autres modes (par exemple, `arena` ignore `hunt`).
- Injecter des règles de jeu dans `TourScene` (le rendu reste agnostique et n'est jamais modifié par un mode).
- Partager une sauvegarde ou une campagne entre des modes non liés.

## Trajet

Le patron Morena est le même pour tous : les règles vivent dans le module, le rendu dans la route.

- **Arena** : `apps/web/src/routes/arena/+page.ts` lit les paramètres → `apps/web/src/lib/arena/ai.ts` pilote → `apps/web/src/lib/combat/reducer.ts` → `apps/web/src/routes/arena/+page.svelte` rend le duel.
- **Hunt** : Le joueur navigue via `TourScene` → Contact initié → `apps/web/src/lib/hunt/state.ts` → `apps/web/src/lib/hunt/duel/reducer.ts`.
- **Infiltration** : Missions posées → `apps/web/src/lib/infiltration/loop.ts` fait avancer les témoins et l'alerte.
- **Investigation** : Dossiers de `apps/web/src/lib/investigation/catalog.ts` listés → résolus dans `apps/web/src/lib/investigation/case.ts`.
- **Reconstruction** : Charge la base canon dans `apps/web/src/routes/reconstruction/+page.server.ts` → reconstruit le vaisseau.
- **Strategy** : `apps/web/src/lib/strategy/simulation.svelte.ts` gère les tours → `apps/web/src/lib/strategy/campaign/engine.ts` relie les scénarios.

## Frontières

- `apps/web/src/lib/arena` : Limité à un duel 1v1 contre une IA. Ne connaît pas la traque ni le vaisseau entier.
- `apps/web/src/lib/combat` : Moteur pur de combat, ne rend rien et n'a aucune route associée.
- `apps/web/src/lib/hunt` : Gère l'évasion et les duels de contact. Ne réutilise pas `arena` et s'appuie sur `TourScene` pour le mouvement.
- `apps/web/src/lib/infiltration` : Définit sa propre logique de furtivité et de témoins, séparée du graphe de navigation de `hunt`.
- `apps/web/src/lib/investigation` : N'accède pas à la base canon en direct, les dossiers sont prédéfinis.
- `apps/web/src/lib/reconstruction` : Réservé à la visualisation narrative du canon (ce n'est pas un mode d'action).
- `apps/web/src/lib/strategy` : Mode tour par tour, sans simulation de combat en temps réel, reposant sur `packages/simulation-engine`.

## Invariants

- `combat` est le seul moteur partagé entre différents modes (utilisé par `arena` et `apps/web/src/lib/hunt/duel`).
- `TourScene` ignore le mode qui le pilote. Il réagit aux événements (`WALKED`, `FACE`, etc.) et synchronise la position par binding.
- Chaque mode doit déclarer ses Hatsu spécifiques dans `apps/web/src/lib/nen/hatsuRegistry.ts` pour qu'ils soient disponibles.
- Les sauvegardes de progression de chaque mode sont toujours locales, versionnées et isolées (ex: `apps/web/src/lib/hunt/replay.ts`, `apps/web/src/lib/infiltration/persistence.ts`).
