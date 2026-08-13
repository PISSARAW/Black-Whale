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
**Entrées publiques :** `apps/web/src/lib/audio/hatsuSounds.ts`, `apps/web/src/lib/audio/nenSounds.ts`, `apps/web/src/lib/audio/steps.ts`, `apps/web/src/lib/audio/ambient.ts`, `apps/web/src/lib/audio/space.ts`, `apps/web/src/lib/audio/output.ts`.
**Carte :** [05 la visite](../../../../../docs/carte/05-la-visite.md)

## Découpage

| Groupe         | Fichiers                                                                     | Responsabilité                                              |
| -------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Contexte       | `apps/web/src/lib/audio/context.ts`                                          | L'unique `AudioContext` du navire, jamais fermé             |
| Sortie         | `apps/web/src/lib/audio/output.ts`                                           | Trois faders (musique, navire, techniques) et limiteur      |
| Espace         | `apps/web/src/lib/audio/space.ts`, `apps/web/src/lib/audio/ears.ts`          | Position de l'oreille, cap et tangage, occlusion, variation |
| Synthèse       | `apps/web/src/lib/audio/hatsu/synth.ts`                                      | Helpers de bruit filtré, d'oscillateurs et d'enveloppes     |
| Hatsu one-shot | `apps/web/src/lib/audio/hatsu/*.ts`, `apps/web/src/lib/audio/hatsuSounds.ts` | Sons des techniques (impact, chaîne, bête, refus…)          |
| Ambiance       | `apps/web/src/lib/audio/ambient.ts`, `apps/web/src/lib/audio/ambient/**`     | Boucles de fond, musique du site, atmosphère du navire      |
| Pas            | `apps/web/src/lib/audio/steps.ts`, `apps/web/src/lib/audio/steps/**`         | Son des pas selon le matériau                               |
| Environnement  | `apps/web/src/lib/audio/steps/environment.ts`                                | Moteurs et mer : boucles continues, placées en 3D           |
| Nen            | `apps/web/src/lib/audio/nenSounds.ts`                                        | Sons génériques liés au Nen (aura, etc.)                    |
| UI mode        | `apps/web/src/lib/audio/infiltrationHatsuSounds.ts`                          | Sons spécifiques au mode infiltration                       |

## Invariants

- Tout son est synthétisé côté client — aucun asset audio n'est servi.
- **Un seul `AudioContext`**, dans `apps/web/src/lib/audio/context.ts`, jamais fermé : c'est lui qui permet à une technique d'entrer dans la réverbération de la salle, calculée par la marche. Personne n'appelle `new AudioContext`.
- Tout se termine sur un bus de `apps/web/src/lib/audio/output.ts`, jamais sur `destination` : c'est là que sont le limiteur et les trois faders.
- `apps/web/src/lib/audio/hatsu/` contient uniquement des sons one-shot ; les boucles continues vivent dans `apps/web/src/lib/audio/ambient.ts` — sauf les deux que le navire fait lui-même, moteurs et mer, qui sont dans `apps/web/src/lib/audio/steps/environment.ts` parce qu'elles appartiennent à la marche et non à la bande-son.
- Un one-shot se branche sur `emissionTarget`, pas sur `g.muffle` : il est alors placé, occulté et envoyé dans la salle sans le savoir. Les boucles, elles, restent sur le mixeur — elles survivent à la salle où elles ont commencé.
- Les deux bruits continus du navire — les moteurs et la mer — sont sur le bus `walk` et non `ambient` : c'est le vaisseau, pas la bande-son. Ils passent par le `muffle` de la marche, donc une technique qui scelle l'ouïe les scelle aussi, et ils ne traversent jamais les convolveurs : ils n'arrivent pas de la salle, ils la traversent.
- Une seule rotation d'oreille, dans `apps/web/src/lib/audio/ears.ts` : cap **et** tangage. Personne ne réécrit la trigonométrie, et personne n'appelle `AudioListener.setOrientation` — l'auditeur reste à l'origine et toutes les sources sont placées relativement à lui.
- Le niveau d'une source continue vient de la courbe d'élévation (`hullRumble`, `seaOutside`), jamais du modèle de distance du `PannerNode` : le panner ne donne qu'une direction, `rolloffFactor` est à zéro. Doser deux fois, c'est doser faux.
- Chaque `TourReport` de la visite a un son dédié — `apps/web/src/lib/tour/reportSound.ts` — et une position — `apps/web/src/lib/tour/soundPlace.ts`.

## Ajouter un son ici

1. Identifier la famille : `apps/web/src/lib/audio/hatsu/impacts.ts`, `apps/web/src/lib/audio/hatsu/chains.ts`, `apps/web/src/lib/audio/hatsu/refusals.ts`, `apps/web/src/lib/audio/hatsu/beasts.ts`.
2. Si aucune famille ne convient, créer un nouveau fichier dans `apps/web/src/lib/audio/hatsu/`.
3. Le son doit être basé sur le manga, l'anime ou le geste. Tous les sons sont synthétisés.
4. Mapper le rapport dans `apps/web/src/lib/tour/reportSound.ts`.
5. Vérifier : `pnpm --filter @black-whale/web test tour/`.
