---
titre: Ajouter un Hatsu
etage: 1
couvre:
  - packages/ability-modules/**
  - apps/web/src/lib/audio/hatsu/**
  - apps/web/src/lib/tour/reportSound.ts
  - apps/web/src/lib/tour/cast/report.ts
depend-de: [04-le-nen, 05-la-visite]
revu-le: 2026-08-05
empreinte: 000000
decisions: [adr-006]
---

# Ajouter un son à un Hatsu de la visite

Cette recette couche un son sur un Hatsu qui apparaît déjà dans `/tour`.

1. **Identifier le rapport.** Ouvrir `apps/web/src/lib/tour/cast/report.ts` et trouver le
   `TourReport` kind émis par le Hatsu.
2. **Choisir la famille de son.** Ouvrir `apps/web/src/lib/audio/hatsu/` :
   - impact → `impacts.ts`
   - chaîne / page / Skill Hunter → `chains.ts`
   - refus / limite → `refusals.ts`
   - bête / GSB / invocation → `beasts.ts`
   - copie / papier / origami → réutiliser `impacts.ts` (`foldPaper`)
3. **Réutiliser d'abord.** Si un générateur existant décrit le geste, l'utiliser.
   N'en créer un nouveau que si le geste n'a vraiment aucun cousin.
4. **Créer le son.** Le son doit être basé sur le manga, l'anime ou le geste même.
   Tous les sons sont synthétisés via Web Audio API (pas de fichier audio).
5. **Mapper le rapport.** Ouvrir `apps/web/src/lib/tour/reportSound.ts`, ajouter le kind
   dans le `switch` de `reportToSound` avec le nouveau générateur.
6. **Vérifier.**
   ```
   pnpm --filter @black-whale/web test tour/
   pnpm typecheck
   pnpm doc-lint
   ```
