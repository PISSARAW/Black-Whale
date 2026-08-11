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

> Les sept modes sont des tranches verticales jouables. Chacune réutilise `apps/web/src/lib/tour` pour le rendu, mais garde son propre état, son loop et son contrat. `apps/web/src/lib/combat` n'a pas de route : c'est le moteur partagé de l'arène et du duel de la traque.

## Le trajet

Le patron Morena est le même pour tous : les règles vivent dans le module, le rendu dans la route, et `TourScene` n'est jamais modifié par un mode. Chaque mode possède sa route (sauf `apps/web/src/lib/combat`), son état/reducer, son moteur d'avancement (loop, campagne ou simulation), son adaptateur Hatsu, et il lit le Hatsu choisi via `apps/web/src/lib/nen/hatsuState.ts`.

Trajets concrets :

- **Arena** : `apps/web/src/routes/arena/+page.ts` lit les paramètres, `apps/web/src/lib/arena/ai.ts` pilote `apps/web/src/lib/combat/reducer.ts`, `apps/web/src/routes/arena/+page.svelte` rend le duel.
- **Hunt** : `apps/web/src/routes/hunt/+page.svelte` lie `TourScene` à `apps/web/src/lib/hunt/state.ts` et `apps/web/src/lib/hunt/loop.ts`; le contact ouvre un duel géré par `apps/web/src/lib/hunt/duel/reducer.ts`.
- **Infiltration** : `apps/web/src/routes/infiltration/+page.svelte` pose la mission via `apps/web/src/lib/infiltration/state.ts`, puis `apps/web/src/lib/infiltration/loop.ts` fait avancer les témoins et l'alerte; les missions vivent dans `apps/web/src/lib/infiltration/missions/definitions.ts`.
- **Investigation** : `apps/web/src/routes/investigation/+page.svelte` liste les dossiers de `apps/web/src/lib/investigation/catalog.ts`; `apps/web/src/routes/investigation/[caseId]/+page.svelte` résout `apps/web/src/lib/investigation/case.ts`.
- **Reconstruction** : `apps/web/src/routes/reconstruction/+page.server.ts` charge la base canon; `apps/web/src/routes/reconstruction/+page.svelte` reconstruit le vaisseau avec `packages/canon-engine`; `apps/web/src/routes/reconstruction/v3/+page.svelte` est le bac à sable « Et si… ».
- **Strategy** : `apps/web/src/routes/strategy/+page.server.ts` initialise le `baseState`; `apps/web/src/lib/strategy/simulation.svelte.ts` gère les tours; `apps/web/src/lib/strategy/campaign/engine.ts` relie les scénarios en campagne.

## Les frontières

| Dossier                           | Promet                                                                                      | Refuse                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/arena`          | Un duel 1v1 contre une IA paramétrée par doctrine et difficulté, avec replay et challenges. | Ne connaît pas la traque, le vaisseau entier ni la campagne.                                         |
| `apps/web/src/lib/combat`         | Le modèle d'un combat au corps-à-corps : état, reducer, fighter, perception, échange.       | Ne rend rien, ne sait pas qui est joueur ou IA, n'a pas de route.                                    |
| `apps/web/src/lib/hunt`           | Une partie d'évasion dans un appartement du vaisseau, avec transition vers un duel.         | Ne simule pas le mouvement du joueur (c'est `TourScene`); ne réutilise pas `apps/web/src/lib/arena`. |
| `apps/web/src/lib/infiltration`   | Une mission furtive sociale : couverture, témoins, alerte, extraction.                      | Ne partage pas son graphe avec `apps/web/src/lib/hunt`; les témoins sont propres au mode.            |
| `apps/web/src/lib/investigation`  | Un cas à résoudre par collection d'indices, interrogatoires et confrontation.               | N'accède pas à la base canon en direct; les affaires sont codées en dur.                             |
| `apps/web/src/lib/reconstruction` | Une visualisation narrative du vaisseau à chaque événement canon.                           | N'est pas un mode jouable au sens action; le v3 est un bac à sable isolé.                            |
| `apps/web/src/lib/strategy`       | Un mode tour par tour sur le canon, avec factions, ordres et Hatsu stratégiques.            | Ne simule pas le combat en temps réel; repose sur `packages/simulation-engine`.                      |

Importations communes : tous les modes importent `apps/web/src/lib/tour` (géométrie, rendu), `apps/web/src/lib/nen` (contrôles, état), `apps/web/src/lib/i18n` (textes) et, selon le cas, `packages/canon-engine` ou `packages/simulation-engine`.

## Les faits qui ne se lisent pas dans le code

- `apps/web/src/lib/combat` est le seul moteur partagé entre modes : `apps/web/src/lib/arena/ai.ts` l'appelle, et `apps/web/src/lib/hunt/duel/reducer.ts` en reprend le contrat pour le duel de contact. Il n'y a pas de route `/combat`.
- `TourScene` est le rendu commun, mais il ignore le mode qui le pilote. C'est le mode qui envoie `WALKED`, `SYNC_POSITION` ou `FACE`, et qui reçoit `position`, `heading`, `currentSpace` par binding (`apps/web/src/routes/hunt/+page.svelte`, `apps/web/src/routes/arena/+page.svelte`, `apps/web/src/routes/infiltration/+page.svelte`).
- La traque et l'infiltration utilisent le même `apps/web/src/lib/hunt/arena.ts` pour choisir huit salles dans `data/ship/blueprint.json`, mais leurs graphes de navigation et leurs règles de perception sont séparées (`apps/web/src/lib/hunt/navmesh.ts` vs `apps/web/src/lib/infiltration/patrol.ts`).
- Chaque mode a son propre contrat de Hatsu : `apps/web/src/lib/arena/hatsu.ts` classe les effets en `bind`/`impact`/`barrage`/`restore`/`enhance`; `apps/web/src/lib/hunt/hatsu.ts` porte `bungee-gum`, `parallel-future`, `dowsing-chain`; `apps/web/src/lib/infiltration/hatsu.ts` porte `little-eye`, `texture-surprise`, `illumi-needle-people`; `apps/web/src/lib/strategy/hatsu.ts` classe par rôle stratégique.
- Les sauvegardes sont locales et versionnées : `apps/web/src/lib/hunt/replay.ts`, `apps/web/src/lib/infiltration/persistence.ts`, `apps/web/src/lib/strategy/persistence.ts`, `apps/web/src/lib/investigation/portfolio.ts`.

## Les pièges

- **Ajouter un Hatsu dans un mode sans le déclarer dans `apps/web/src/lib/nen/hatsuRegistry.ts`** : le Hatsu n'apparaîtra pas dans le sélecteur, même si sa logique locale est codée.
- **Écrire du mouvement du joueur dans `apps/web/src/lib/hunt/loop.ts`** : le loop reçoit la position depuis `TourScene` (`apps/web/src/routes/hunt/+page.svelte`). Simuler le mouvement là crée une seconde physique qui diverge.
- **Faire dépendre `apps/web/src/lib/arena` de `apps/web/src/lib/hunt` ou l'inverse** : les deux utilisent `apps/web/src/lib/combat`, mais leurs boucles de jeu, formats de replay et terrains sont distincts.
- **Modifier `data/ship/blueprint.json` en pensant changer un terrain de mode** : les modes ne déclarent pas de nouvelles salles; ils sélectionnent des salles existantes via `apps/web/src/lib/hunt/arena.ts` et `apps/web/src/lib/arena/terrain.ts`.
- **Oublier le cap de spoiler dans la reconstruction** : `apps/web/src/routes/reconstruction/+page.server.ts` lit `readSpoilerLimit` et filtre les chapitres; `apps/web/src/routes/reconstruction/v3/+page.server.ts` en a aussi besoin.

## Par où entrer

| Je veux …                                   | J'ouvre                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| changer les règles d'un combat              | `apps/web/src/lib/combat/reducer.ts` + `apps/web/src/lib/combat/fighter.ts`                                    |
| changer l'IA de l'arène                     | `apps/web/src/lib/arena/ai.ts`                                                                                 |
| ajouter un terrain d'arène                  | `apps/web/src/lib/arena/terrain.ts` (sélection dans le blueprint)                                              |
| ajouter un contrat de traque                | `apps/web/src/lib/hunt/contracts/registry.ts`                                                                  |
| régler le loop de la traque                 | `apps/web/src/lib/hunt/loop.ts`                                                                                |
| régler le duel de contact                   | `apps/web/src/lib/hunt/duel/reducer.ts`                                                                        |
| ajouter une mission d'infiltration          | `apps/web/src/lib/infiltration/missions/definitions.ts`                                                        |
| changer la logique de couverture            | `apps/web/src/lib/infiltration/social/cover.ts`                                                                |
| ajouter une affaire                         | `apps/web/src/lib/investigation/cases/` + `apps/web/src/lib/investigation/catalog.ts`                          |
| changer le verdict d'une hypothèse          | `apps/web/src/lib/investigation/case.ts`                                                                       |
| ajouter un événement dans la reconstruction | `data/ship/` et `packages/canon-engine` (voir [01 le canon](01-le-canon.md))                                   |
| changer la projection de perspective        | `apps/web/src/lib/reconstruction/perspective.ts` + `apps/web/src/routes/reconstruction/perspective/+server.ts` |
| ajouter un scénario stratégique             | `apps/web/src/lib/strategy/scenario/registry.ts`                                                               |
| changer les règles de commandement          | `apps/web/src/lib/strategy/rules.ts`                                                                           |
| relier un Hatsu au mode stratégique         | `apps/web/src/lib/strategy/hatsu.ts`                                                                           |

## Vérifier

```
pnpm --filter @black-whale/web test arena/
pnpm --filter @black-whale/web test combat/
pnpm --filter @black-whale/web test hunt/
pnpm --filter @black-whale/web test infiltration/
pnpm --filter @black-whale/web test investigation/
pnpm --filter @black-whale/web test reconstruction/
pnpm --filter @black-whale/web test strategy/
pnpm doc-lint
```
