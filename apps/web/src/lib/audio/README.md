---
titre: audio
etage: 2
couvre:
  - apps/web/src/lib/audio/**
depend-de: [05-la-visite]
revu-le: 2026-08-05
empreinte: 000000
decisions: [adr-006]
---

# `apps/web/src/lib/audio` — sons du site

**Promet :** fournir tous les sons du site via Web Audio API, sans fichier audio externe.
**Refuse :** de charger des samples ou de déléguer à un moteur audio tiers.
**Entrée publique :** `index.ts` → `hatsuSounds`, `nenSounds`, `steps`, `ambient`.
**Carte :** [05 la visite](../../../../docs/carte/05-la-visite.md)

## Découpage

| Groupe | Fichiers | Responsabilité |
| ------ | -------- | -------------- |
| Synthèse | `synth.ts`, `hatsu/synth.ts` | Helpers de bruit filtré, d'oscillateurs et d'enveloppes |
| Hatsu one-shot | `hatsu/*.ts`, `hatsuSounds.ts` | Sons des techniques (impact, chaîne, bête, refus…) |
| Ambiance | `ambient.ts`, `ambient/**` | Boucles de fond, musique du site, atmosphère du navire |
| Pas | `steps.ts`, `steps/**` | Son des pas selon le matériau |
| Nen | `nenSounds.ts` | Sons génériques liés au Nen (aura, etc.) |
| UI mode | `infiltrationHatsuSounds.ts` | Sons spécifiques au mode infiltration |

## Invariants

- Tout son est synthétisé côté client — aucun asset audio n'est servi.
- `hatsu/` contient uniquement des sons one-shot ; les boucles continues vivent dans `ambient.ts`.
- Chaque `TourReport` de la visite a un son dédié — `reportSound.ts`.

## Ajouter un son ici

1. Identifier la famille : `hatsu/impacts.ts`, `hatsu/chains.ts`, `hatsu/beasts.ts`, `hatsu/refusals.ts`.
2. Si aucune famille ne convient, créer un nouveau fichier dans `hatsu/`.
3. Mapper le rapport dans `lib/tour/reportSound.ts`.
4. Vérifier : `pnpm --filter @black-whale/web test tour/`.
