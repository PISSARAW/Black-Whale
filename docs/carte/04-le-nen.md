---
titre: Le nen
etage: 1
couvre:
  - packages/ability-sdk/**
  - packages/ability-modules/**
  - packages/nen-engine/**
  - apps/web/src/lib/nen/**
  - apps/web/src/lib/tour/cast/**
depend-de: [11-les-donnees]
revu-le: 2026-08-05
empreinte: 065b440
decisions: [adr-001, adr-006]
---

# Le nen

Ce territoire retrace le voyage d'un hatsu (capacité) depuis sa déclaration originelle jusqu'à son affichage sous forme de pixel à l'écran.

## Promet

- `packages/ability-sdk` : Fournit les interfaces et les contrats de base pour définir ce qu'est une capacité (hatsu).
- `packages/ability-modules` : Héberge l'implémentation spécifique des règles et des effets de chaque hatsu (déclarés initialement en données).
- `packages/nen-engine` : Moteur de résolution central qui calcule l'issue d'une capacité (succès, coûts, effets sur la cible).
- `apps/web/src/lib/nen` et `apps/web/src/lib/tour/cast` : Gèrent l'interprétation visuelle et l'intégration des hatsus résolus pour les afficher à l'utilisateur, en exploitant les manifestes et profils générés.

## Refuse

- Les `ability-modules` ne contiennent aucun code lié à l'interface utilisateur ou à la présentation visuelle.
- `packages/nen-engine` ne déclenche pas directement d'animations ou de sons ; il ne produit que des calculs d'état (dégâts, application d'effets).
- Les composants visuels (`apps/web/src/lib/tour/cast`) ne modifient jamais la logique ou les données de résolution d'un hatsu.

## Trajet

1. **Définition** : Les règles du hatsu sont implémentées dans `packages/ability-modules`, appuyées par les contrats du `ability-sdk`.
2. **Génération** : Le compilateur canon génère des fichiers de liaison (`hatsuProfiles.gen.ts`, `interactionManifests.gen.ts`) permettant au frontend de connaître les capacités disponibles.
3. **Résolution** : Lors de l'invocation, `packages/nen-engine` applique la logique du module, évalue les conditions et détermine les résultats de l'action.
4. **Restitution** : Le frontend lit ces résultats via `apps/web/src/lib/nen` et traduit ces effets en animations, en ciblant le point visuel (pixel) dans `apps/web/src/lib/tour/hatsu.ts`.

## Frontières

- **Logique vs Rendu** : Une séparation stricte existe entre le calcul du hatsu (`nen-engine` et `ability-modules`) et sa restitution visuelle (le frontend web).
- **Compilation vs Exécution** : Les manifestes (`*.gen.ts`) constituent un contrat statique et immuable à l'exécution, évitant au frontend de devoir recalculer les profils.

## Invariants

- Les règles d'un hatsu ne sont évaluées que par le `nen-engine` ; le frontend doit faire confiance à son verdict.
- Les interfaces générées (`hatsuProfiles.gen.ts`, etc.) doivent toujours correspondre exactement aux modules existants lors du build.
- L'activation d'un hatsu suit un chemin unidirectionnel strict : de la déclaration (SDK/modules) à la résolution (moteur) puis au rendu visuel (cast/pixels).
