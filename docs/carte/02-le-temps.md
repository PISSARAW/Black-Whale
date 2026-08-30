---
titre: Le temps
etage: 1
couvre:
  - packages/domain/src/temporal.ts
  - packages/domain/src/ordering.ts
  - packages/canon-engine/src/timeline/**
  - apps/web/src/lib/tour/hour.ts
depend-de: []
revu-le: 2026-08-05
empreinte: 6f589fe
decisions: []
---

# Le temps

> `StoryCursor` vs horloge de bord vs heure de la visite : trois temps, un modèle. Ce territoire gère l'écoulement du temps et l'ordonnancement des événements.

## Le trajet

`packages/domain/src/temporal.ts` → `packages/domain/src/ordering.ts` → `packages/canon-engine/src/timeline/index.ts` → `apps/web/src/lib/tour/hour.ts`

## Les frontières

| Ce dossier …     | Règle |
| ---------------- | ----- |
| importe          | Rien d'autre que les définitions de domaine (`packages/domain/`) pour les paquets core. `apps/web/src/lib/tour/hour.ts` importe le moteur canon. |
| n'importe jamais | L'état global de l'interface utilisateur ou les données de session (le temps est absolu). |
| est importé par  | Les modes de jeu, la visite (`apps/web/src/lib/tour/`), et les résolutions d'actions (Nen). |

## Les faits qui ne se lisent pas dans le code

- Le temps du jeu est découplé du temps réel. Le `StoryCursor` est la seule source de vérité temporelle.
- Les événements sont ordonnés par relations causales (`ordering.ts`), pas seulement par horodatage.

## Les pièges

- Utiliser `Date.now()` au lieu de l'horloge de bord (`voyage-clock.ts`) : brise la reproductibilité des événements et la simulation.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| changer l'heure de la visite | `apps/web/src/lib/tour/hour.ts` |
| modifier l'ordre des événements | `packages/domain/src/ordering.ts` |

## Vérifier

pnpm --filter @black-whale/domain test temporal
pnpm --filter @black-whale/canon-engine test timeline
