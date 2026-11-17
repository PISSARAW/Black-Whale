---
titre: Infiltration
etage: 2
couvre:
  - apps/web/src/lib/infiltration/**
depend-de: [07-les-modes]
revu-le: 2026-11-16
decisions: [adr-002]
---

# Infiltration

Les missions utilisent les terrains de `hunt`, avec leur propre état, boucle,
perception des témoins, couverture sociale et sauvegarde. La route
`apps/web/src/routes/infiltration/+page.svelte` orchestre ces modules et le rendu `TourScene`.
Le périmètre est décrit dans [la carte des modes](../../../../../docs/carte/07-les-modes.md).

`missionGame.ts` rassemble la sélection déterministe, le placement de mission
et l’application du contexte de campagne pour une nouvelle partie ou un restart.
La route initialise explicitement sa position, sa destination de saut et sa salle
avec `untrack` : ces valeurs sont ensuite modifiées par les bindings de la scène.
Les changements de mission et reprises de sauvegardes les réaffectent explicitement.

Vérification : `vitest run src/lib/infiltration`, typage et compilation de l’app web.
