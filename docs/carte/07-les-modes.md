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

> Les sept modes sont des tranches verticales jouables. Ce territoire définit ce que "jouable" signifie ici et implémente le patron Morena : les règles vivent dans le module, le rendu dans la route.

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

- **Arena** : `routes/arena/+page.ts` lit les paramètres → `lib/arena/ai.ts` pilote → `lib/combat/reducer.ts` → `routes/arena/+page.svelte` rend le duel.
- **Hunt** : Le joueur navigue via `TourScene` → Contact initié → `lib/hunt/state.ts` → `lib/hunt/duel/reducer.ts`.
- **Infiltration** : Missions posées → `lib/infiltration/loop.ts` fait avancer les témoins et l'alerte.
- **Investigation** : Dossiers de `lib/investigation/catalog.ts` listés → résolus dans `lib/investigation/case.ts`.
- **Reconstruction** : Charge la base canon dans `routes/reconstruction/+page.server.ts` → reconstruit le vaisseau.
- **Strategy** : `lib/strategy/simulation.svelte.ts` gère les tours → `lib/strategy/campaign/engine.ts` relie les scénarios.

## Frontières

- `lib/arena` : Limité à un duel 1v1 contre une IA. Ne connaît pas la traque ni le vaisseau entier.
- `lib/combat` : Moteur pur de combat, ne rend rien et n'a aucune route associée.
- `lib/hunt` : Gère l'évasion et les duels de contact. Ne réutilise pas `arena` et s'appuie sur `TourScene` pour le mouvement.
- `lib/infiltration` : Définit sa propre logique de furtivité et de témoins, séparée du graphe de navigation de `hunt`.
- `lib/investigation` : N'accède pas à la base canon en direct, les dossiers sont prédéfinis.
- `lib/reconstruction` : Réservé à la visualisation narrative du canon (ce n'est pas un mode d'action).
- `lib/strategy` : Mode tour par tour, sans simulation de combat en temps réel, reposant sur `packages/simulation-engine`.

## Invariants

- `combat` est le seul moteur partagé entre différents modes (utilisé par `arena` et `hunt/duel`).
- `TourScene` ignore le mode qui le pilote. Il réagit aux événements (`WALKED`, `FACE`, etc.) et synchronise la position par binding.
- Chaque mode doit déclarer ses Hatsu spécifiques dans `lib/nen/hatsuRegistry.ts` pour qu'ils soient disponibles.
- Les sauvegardes de progression de chaque mode sont toujours locales, versionnées et isolées (ex: `lib/hunt/replay.ts`, `lib/infiltration/persistence.ts`).
