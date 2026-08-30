---
titre: Le navire
etage: 1
couvre:
  - apps/web/src/lib/assets/maps/**
  - apps/web/src/lib/map/**
  - apps/web/src/lib/server/mapPayload.ts
  - apps/web/src/lib/state/mapState.svelte.ts
  - apps/web/src/routes/ship/**
depend-de: []
revu-le: 2026-08-05
empreinte: 94750ee
decisions: []
---

# Le navire

> La carte dessinée : projection, pas rendu 3D. Ce territoire gère les plans SVG 2D et la navigation via la carte.

## Le trajet

`apps/web/src/lib/assets/maps/tier-1.svelte` → `apps/web/src/lib/server/mapPayload.ts` → `apps/web/src/routes/ship/+page.server.ts` → `apps/web/src/lib/state/mapState.svelte.ts` → `apps/web/src/lib/map/mapAssetRegistry.ts`

## Les frontières

| Ce dossier …     | Règle |
| ---------------- | ----- |
| importe          | Les données spatiales statiques et l'état réactif (`svelte.ts`). |
| n'importe jamais | Le moteur 3D (`Three.js`), `TourRenderer` ou les géométries de la visite 3D. |
| est importé par  | Les interfaces utilisateur de navigation et l'écran de carte. |

## Les faits qui ne se lisent pas dans le code

- Les plans 2D sont des SVG optimisés à la main. Ils ne sont pas générés depuis la 3D pour des raisons de direction artistique (lisibilité).
- La correspondance entre coordonnées 2D (carte) et 3D (visite) se fait via une matrice de projection stricte.

## Les pièges

- Ajouter une salle dans la 3D sans mettre à jour le SVG : la salle existera mais sera invisible sur la carte 2D.
- Mutatier `mapState` en dehors des actions prévues : brise la réactivité Svelte 5.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| mettre à jour le tracé d'un pont | `apps/web/src/lib/assets/maps/` |
| résoudre le plan dessiné d'une salle | `apps/web/src/lib/map/mapAssetRegistry.ts` |

## Vérifier

pnpm --filter @black-whale/web test map
