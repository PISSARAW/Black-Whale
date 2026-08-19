---
titre: La visite
etage: 1
couvre:
  - apps/web/src/lib/tour/**
  - apps/web/src/lib/components/tour/**
  - apps/web/src/lib/audio/**
  - data/ship/blueprint.json
depend-de: [04-le-nen, 11-les-donnees]
revu-le: 2026-08-05
empreinte: 56eb2f8
decisions: [adr-003, adr-004, adr-005, adr-006]
---

# La visite

> La visite transforme le plan du navire en un espace qu'on traverse en première personne.
> Elle explique comment la géométrie plate devient une pièce traversable.

## Promet

- Transformer le plan `data/ship/blueprint.json` en une représentation 3D texturée et éclairée.
- Gérer la boucle de rendu principale, la géométrie, et le mesh via `TourRenderer`.
- Gérer l'ambiance en injectant lumière, son, poussière et apparitions selon le contexte.

## Refuse

- Décider du canon ou des règles des modes de jeu.
- Contenir de la logique propre aux modes (les casts sont dans `apps/web/src/lib/tour/cast/`).
- Court-circuiter `apps/web/src/lib/tour/blueprint.ts` en lisant directement le JSON.

## Trajet

```text
data/ship/blueprint.json
        ↓
apps/web/src/lib/tour/blueprint.ts       ← validation et indexation
        ↓
apps/web/src/lib/tour/geometry.ts → apps/web/src/lib/tour/mesh.ts → apps/web/src/lib/tour/TourRenderer.ts
        ↓
apps/web/src/lib/tour/page*.svelte.ts    ← état de /tour, contrôle caméra, heure, audio, apparitions
```

## Frontières

- `apps/web/src/lib/tour/` : Reçoit les requêtes d'affichage, ne décide pas de l'état du mode. Ne lit pas directement `blueprint.json`.
- `apps/web/src/lib/audio/` : Fournit tous les sons du site, y compris les Hatsu one-shot via `apps/web/src/lib/audio/hatsu/`.
- `apps/web/src/lib/components/tour/` : Composants Svelte de la visite uniquement ; n'inclut aucune logique de rendu Three.js.

## Invariants

- **Aucune lumière ambiante** : Un couloir sans luminaire est noir. La seule lumière naturelle passe par deux ouvertures.
- **La marche est à 2,1 m/s** : L'échelle vient de la reconstruction, pas d'un réglage de confort.
- **Sons synthétisés** : Aucun fichier audio externe, tout passe par la Web Audio API.
- **Validation stricte** : `validateBlueprint` est le garde-fou contre les salles orphelines.
