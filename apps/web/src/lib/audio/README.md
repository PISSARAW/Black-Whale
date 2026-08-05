---
titre: audio
etage: 2
couvre:
  - apps/web/src/lib/audio/**
depend-de: [05-la-visite]
revu-le: 2026-08-05
empreinte: f798985
decisions: [adr-006]
---

# `apps/web/src/lib/audio` — sons du site

**Promet :** fournir tous les sons du site via Web Audio API, sans fichier audio externe.
**Refuse :** de charger des samples ou de déléguer à un moteur audio tiers.
**Entrées publiques :** `apps/web/src/lib/audio/hatsuSounds.ts`, `apps/web/src/lib/audio/nenSounds.ts`, `apps/web/src/lib/audio/steps.ts`, `apps/web/src/lib/audio/ambient.ts`.
**Carte :** [05 la visite](../../../../../docs/carte/05-la-visite.md)

## Découpage

| Groupe | Fichiers | Responsabilité |
| ------ | -------- | -------------- |
| Synthèse | `apps/web/src/lib/audio/hatsu/synth.ts` | Helpers de bruit filtré, d'oscillateurs et d'enveloppes |
| Hatsu one-shot | `apps/web/src/lib/audio/hatsu/*.ts`, `apps/web/src/lib/audio/hatsuSounds.ts` | Sons des techniques (impact, chaîne, bête, refus…) |
| Ambiance | `apps/web/src/lib/audio/ambient.ts`, `apps/web/src/lib/audio/ambient/**` | Boucles de fond, musique du site, atmosphère du navire |
| Pas | `apps/web/src/lib/audio/steps.ts`, `apps/web/src/lib/audio/steps/**` | Son des pas selon le matériau |
| Nen | `apps/web/src/lib/audio/nenSounds.ts` | Sons génériques liés au Nen (aura, etc.) |
| UI mode | `apps/web/src/lib/audio/infiltrationHatsuSounds.ts` | Sons spécifiques au mode infiltration |

## Invariants

- Tout son est synthétisé côté client — aucun asset audio n'est servi.
- `apps/web/src/lib/audio/hatsu/` contient uniquement des sons one-shot ; les boucles continues vivent dans `apps/web/src/lib/audio/ambient.ts`.
- Chaque `TourReport` de la visite a un son dédié — `apps/web/src/lib/tour/reportSound.ts`.

## Ajouter un son ici

1. Identifier la famille : `apps/web/src/lib/audio/hatsu/impacts.ts`, `apps/web/src/lib/audio/hatsu/chains.ts`, `apps/web/src/lib/audio/hatsu/refusals.ts`, `apps/web/src/lib/audio/hatsu/beasts.ts`.
2. Si aucune famille ne convient, créer un nouveau fichier dans `apps/web/src/lib/audio/hatsu/`.
3. Le son doit être basé sur le manga, l'anime ou le geste. Tous les sons sont synthétisés.
4. Mapper le rapport dans `apps/web/src/lib/tour/reportSound.ts`.
5. Vérifier : `pnpm --filter @black-whale/web test tour/`.
