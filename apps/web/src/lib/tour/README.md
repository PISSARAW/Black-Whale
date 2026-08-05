---
titre: tour
etage: 2
couvre:
  - apps/web/src/lib/tour/**
  - apps/web/src/lib/components/tour/**
depend-de: [05-la-visite]
revu-le: 2026-08-05
empreinte: 000000
decisions: [adr-003, adr-005, adr-006]
---

# `apps/web/src/lib/tour` — la visite first-person

**Promet :** transformer `data/ship/blueprint.json` en une scène 3D traversable, avec ses lumières, ses sons et les effets des Hatsu.
**Refuse :** de décider du canon ou des règles de jeu. Le canon vient de `data/`, les règles des modules Hatsu.
**Entrée publique :** `index.ts` → `TourRenderer`, `blueprint`, `geometry`, `mesh`, `light`, `atmosphere`, `reportSound`, `cast`.
**Carte :** [05 la visite](../../../../docs/carte/05-la-visite.md)

## Découpage

| Groupe | Fichiers | Responsabilité |
| ------ | -------- | -------------- |
| Géométrie | `blueprint.ts`, `geometry.ts`, `mesh.ts`, `types.ts` | Lecture, validation et mesh du plan du navire |
| Rendu | `TourRenderer.ts`, `PortalRenderer.ts`, `TierView.ts` | Boucle Three.js, caméra, portails, étages |
| Ambiance | `light.ts`, `atmosphere.ts`, `dust.ts`, `sky.ts`, `hour.ts` | Lumières, brume, ciel, heure du chapitre |
| Audio | `reportSound.ts`, `pageHatsuAudio.svelte.ts` | Sons one-shot Hatsu et boucles d'ambiance |
| Casts | `cast/*.ts` | Traduction des effets Hatsu en animations / sons |
| État page | `page*.svelte.ts` | État et contrôleurs de la route `/tour` |
| Apparitions | `apparitions.ts`, `apparition*View.ts` | Entités 3D instanciées dans la scène |
| Composants | `components/tour/*` | Surface Svelte de la visite |

## Invariants

- Toute salle est atteignable — `blueprint.test.ts › aucune salle orpheline`.
- Aucune lumière ambiante : un couloir sans luminaire reste noir — `light.test.ts`.
- Les sons de Hatsu sont synthétisés, jamais des fichiers audio — `reportSound.ts`.
- La visite ne lit pas directement `data/ship/blueprint.json` — elle passe par `blueprint.ts`.

## Ajouter quelque chose ici

- Pour une nouvelle salle : `docs/geste/une-salle.md`.
- Pour un nouveau son de Hatsu : `docs/geste/un-hatsu.md` + `lib/audio/hatsu/`.
- Pour un nouvel effet visuel : cette fiche + `docs/carte/05-la-visite.md`.
