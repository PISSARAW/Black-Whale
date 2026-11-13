---
titre: tour
etage: 2
couvre:
  - apps/web/src/lib/tour/**
  - apps/web/src/lib/components/tour/**
depend-de: [05-la-visite]
revu-le: 2026-11-13
empreinte: 7df285c
decisions: [adr-003, adr-005, adr-006]
---

# `apps/web/src/lib/tour` — la visite first-person

**Promet :** transformer `data/ship/blueprint.json` en une scène 3D traversable, avec ses lumières, ses sons et les effets des Hatsu.
**Refuse :** de décider du canon ou des règles de jeu. Le canon vient de `data/`, les règles des modules Hatsu.
**Entrées publiques :** `apps/web/src/lib/tour/blueprint.ts`, `apps/web/src/lib/tour/TourRenderer.ts`, `apps/web/src/lib/tour/cast/index.ts`, `apps/web/src/lib/tour/reportSound.ts`.
**Carte :** [05 la visite](../../../../../docs/carte/05-la-visite.md)

Le plan courant compte 429 espaces sur 46 niveaux, dont 35 niveaux intérieurs.

## Découpage

| Groupe      | Fichiers                                                                                                                                                                  | Responsabilité                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Géométrie   | `apps/web/src/lib/tour/blueprint.ts`, `apps/web/src/lib/tour/geometry.ts`, `apps/web/src/lib/tour/mesh.ts`, `apps/web/src/lib/tour/types.ts`                              | Lecture, validation et mesh du plan du navire                |
| Rendu       | `apps/web/src/lib/tour/TourRenderer.ts`, `apps/web/src/lib/tour/PortalRenderer.ts`, `apps/web/src/lib/tour/TierView.ts`, `apps/web/src/lib/tour/reporting.ts`             | Boucle Three.js, caméra, portails, étages, seuils de rapport |
| Ambiance    | `apps/web/src/lib/tour/light.ts`, `apps/web/src/lib/tour/atmosphere.ts`, `apps/web/src/lib/tour/dust.ts`, `apps/web/src/lib/tour/sky.ts`, `apps/web/src/lib/tour/hour.ts` | Lumières, brume, ciel, heure du chapitre                     |
| Dehors      | `apps/web/src/lib/tour/sea.ts`, `apps/web/src/lib/tour/byElevation.ts`                                                                                                    | Ligne de flottaison, dosage moteur/mer par pont              |
| Audio       | `apps/web/src/lib/tour/reportSound.ts`, `apps/web/src/lib/tour/pageHatsuAudio.svelte.ts`                                                                                  | Sons one-shot Hatsu et boucles d'ambiance                    |
| Casts       | `apps/web/src/lib/tour/cast/*.ts`                                                                                                                                         | Présences, postes, routines et perception Nen                |
| Simulation  | `apps/web/src/lib/tour/simulation/*.ts`                                                                                                                                   | Monde persistant, routines PNJ, réputation et boucle Tier 5  |
| État page   | `apps/web/src/lib/tour/page*.svelte.ts`                                                                                                                                   | État et contrôleurs de la route /tour                        |
| Apparitions | `apps/web/src/lib/tour/apparitions.ts`, `apps/web/src/lib/tour/apparition*View.ts`                                                                                        | Entités 3D instanciées dans la scène                         |
| Composants  | `apps/web/src/lib/components/tour/*`                                                                                                                                      | Surface Svelte de la visite                                  |

## Invariants

- Toute salle est atteignable — `apps/web/src/lib/tour/blueprint.test.ts › aucune salle orpheline`.
- Aucune lumière ambiante : un couloir sans luminaire reste noir — `apps/web/src/lib/tour/light.test.ts`.
- Les sons interactifs sont synthétisés. L'enregistrement original du concert de Melody est l'unique asset audio — `apps/web/src/lib/audio/ambient/melodyConcert.ts`.
- La visite ne lit pas directement `data/ship/blueprint.json` — elle passe par `apps/web/src/lib/tour/blueprint.ts`.
- La route rend une coque SSR légère puis charge `TourPageExperience.svelte` par `import()` ; le blueprint et la scène restent hors de son chunk initial — `scripts/tour-lazy-boundary.test.ts`.
- La ligne de flottaison n'est pas un chiffre choisi : c'est l'élévation du pont 4, le premier que le canon ne place pas sous l'eau — `apps/web/src/lib/tour/sea.test.ts`.
- Le palier `low` limite la visibilité à une porte et la CI joue la visite sur desktop et mobile — `apps/web/src/lib/tour/quality.ts`, `tests/tour.spec.ts`.

## Ajouter quelque chose ici

- Pour une nouvelle salle : `docs/geste/une-salle.md`.
- Pour un nouveau son de Hatsu : `docs/geste/un-hatsu.md` + `apps/web/src/lib/audio/hatsu/`.
- Pour un nouvel effet visuel : cette fiche + `docs/carte/05-la-visite.md`.
- Pour faire marcher un personnage : une entrée dans `BEATS` de `apps/web/src/lib/tour/cast/pace.ts`. Le trajet part du poste, s'arrête avant tout mur ou meuble, et le personnage reste immobile si la pièce n'offre pas 1,6 m dégagés.

## Navigation de la visite

`TourWorkspace.svelte` garde la scène montée sur toute la largeur. La barre propose le
pont, les plans, la recherche et le plein écran ; le panneau Options regroupe Confort,
Lieux / Nen, Commandes et Sources. Les outils photo et Gyo restent dans la vue.

Le sélecteur de `TourPlanDialog.svelte` consulte les ponts et les intérieurs sans déplacer
le visiteur. Seule la sélection d’une pièce déclenche le déplacement. « Ma position »
revient au niveau parcouru ; le marqueur de position ne figure que sur ce niveau.
`TourPlanViewport.svelte` porte le zoom et le déplacement du plan, sans sélectionner une
pièce à la fin d’un glissement. Sur mobile, l’index des pièces se déplie sous le plan.
