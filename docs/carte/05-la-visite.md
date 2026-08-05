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
empreinte: 000000
decisions: [adr-003, adr-004, adr-005, adr-006]
---

# La visite

> La visite transforme le plan du navire en un espace qu'on traverse en première personne.
> Elle ne décide pas du canon, ni des règles des modes de jeu : elle lit `data/ship/blueprint.json`
> et le manifeste des Hatsu pour les rendre présents.

## Le trajet

```
data/ship/blueprint.json
        ↓
tour/blueprint.ts       ← validation et indexation
        ↓
tour/geometry.ts → tour/mesh.ts → TourRenderer.ts
        ↓
tour/page*.svelte.ts    ← état de /tour, contrôle caméra, heure, audio
```

| Étape | Fichier | Responsabilité |
| ----- | ------- | -------------- |
| Donnée source | `data/ship/blueprint.json` | Les espaces du navire, dessinés à la main |
| Validation | `tour/blueprint.ts` | Indexe le blueprint, vérifie qu'aucune salle n'est orpheline |
| Géométrie | `tour/geometry.ts` | Polygones, murs, portes, projection d'un plan 2D |
| Mesh | `tour/mesh.ts` | Génération du mesh Three.js : sols, plafonds, murs |
| Rendu | `tour/TourRenderer.ts` | Boucle de rendu, caméra, effets de post-traitement |
| Composant | `routes/tour/+page.svelte` | Surface Svelte : clavier, resize, chargement |
| Contrôleurs | `tour/pageBodyView.svelte.ts`, `pageHatsuView.svelte.ts` | État client de la visite |

## Les frontières

| Ce dossier … | Règle |
| ------------ | ----- |
| `lib/tour/` | Ne lit pas directement `data/ship/blueprint.json` : il passe par `tour/blueprint.ts`. |
| `lib/tour/` | Ne contient pas de logique de mode jouable : les casts sont dans `tour/cast/`, la règle dans le module Hatsu. |
| `lib/audio/` | Sert tous les sons du site, mais les sons de Hatsu one-shot sont réservés à `audio/hatsu/`. |
| `components/tour/` | Composants Svelte de la visite uniquement ; pas de logique de rendu Three.js. |

## Les faits qui ne se lisent pas dans le code

- **Aucune lumière ambiante.** Un couloir sans luminaire est noir. La seule lumière naturelle passe par deux ouvertures.
- **La marche est à 2,1 m/s.** L'échelle vient de la reconstruction, pas d'un réglage de confort.
- **GLTF rejeté** (ADR-005). La ressemblance des personnages passe par `appearance.json`, pas par un asset 3D.
- **Les sons sont synthétisés.** Aucun fichier audio externe : `lib/audio/hatsu/` produit les effets via Web Audio API.

## Les pièges

- **Ne pas court-circuiter `blueprint.ts`.** Lire `blueprint.json` directement fait sauter `validateBlueprint`, qui est le garde-fou contre une salle orpheline.
- **Les effets visuels Hatsu ne sont pas des apparitions.** `HatsuSceneEffects.ts` gère les effets de scene, `apparitions.ts` gère les entités 3D instanciées.
- **L'audio a deux couches.** L'ambiance continue (`ambient.ts`) et les effets Hatsu one-shot (`reportSound.ts`) sont pilotés séparément.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| changer une salle | `data/ship/blueprint.json` + fiche `data/ship/README.md` |
| changer une lumière | `tour/light.ts` + cette carte |
| ajouter/modifier un son de Hatsu | `lib/audio/hatsu/` + `lib/tour/reportSound.ts` |
| ajouter un effet visuel de Hatsu | `tour/HatsuSceneEffects.ts` + `tour/apparitions.ts` |
| comprendre le rendu | `tour/TourRenderer.ts` + `components/tour/TourScene.svelte` |

## Vérifier

```
pnpm --filter @black-whale/web test tour/
pnpm test:e2e tests/tour.spec.ts
```
