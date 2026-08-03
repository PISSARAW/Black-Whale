import type { ApparitionKind } from '../tour/apparitions'
import type { Vec2 } from '../tour/types'
import type { InfiltrationState } from './state'

export interface HatsuManifestation {
  id: string
  kind: ApparitionKind
  spaceId: string
  at: Vec2
  colour: number
  size: number
  stage?: number
}

export function infiltrationHatsuManifestations(state: InfiltrationState): HatsuManifestation[] {
  const effect = state.hatsu.effect
  const witness = effect?.witnessId
    ? state.witnesses.find((candidate) => candidate.id === effect.witnessId)
    : undefined
  const spaceId = effect?.spaceId ?? state.player.spaceId ?? state.extractionSpaceId
  const carried = (
    id: string,
    kind: ApparitionKind,
    colour: number,
    size: number,
    stage = 0,
  ): HatsuManifestation => ({ id, kind, colour, size, stage, spaceId, at: state.player.position })

  if (state.hatsu.scout?.active) {
    return [
      {
        id: `${state.hatsu.id}:scout`,
        kind: 'insect',
        colour: state.hatsu.id === 'biohazard-hinrigh' ? 0x66d58f : 0xd86cff,
        size: state.hatsu.id === 'biohazard-hinrigh' ? 0.28 : 0.16,
        spaceId: state.hatsu.scout.spaceId,
        at: state.hatsu.scout.position,
      },
    ]
  }
  if (!effect) return []
  switch (effect.kind) {
    case 'forged-surface':
      return [carried('texture-surprise', 'paper', 0xe7c58c, 0.22)]
    case 'disguise-mask':
      return [carried('needle-people', 'mark', 0xa989d8, 0.38)]
    case 'attached-owl':
      return witness
        ? [
            {
              id: 'secret-window:owl',
              kind: 'owl',
              colour: 0xb88b53,
              size: 0.45,
              spaceId: witness.spaceId,
              at: witness.position,
            },
          ]
        : []
    case 'paper-network':
      return [-0.28, 0, 0.28].map((offset, index) => ({
        id: `paper:${index}`,
        kind: 'paper',
        colour: 0xf0e4be,
        size: 0.16,
        stage: index,
        spaceId,
        at: [state.player.position[0] + offset, state.player.position[1] + offset],
      }))
    case 'blood-tracker':
      return witness
        ? [
            {
              id: 'bloody-mary:mark',
              kind: 'mark',
              colour: 0xb3122f,
              size: 0.36,
              spaceId: witness.spaceId,
              at: witness.position,
            },
          ]
        : []
    case 'forced-answer':
      return witness
        ? [
            {
              id: 'body-and-soul:impact',
              kind: 'antenna',
              colour: 0xffb05c,
              size: 0.28,
              spaceId: witness.spaceId,
              at: witness.position,
            },
          ]
        : []
    case 'dowsing-result':
      return [carried('dowsing-chain', 'chain', 0xb9e9ff, 0.13)]
    case 'cleaned':
      return [carried('blinky', 'hoover', 0x4e5664, 0.5, Number(effect.payload ?? 0))]
    case 'gum-anchor':
      return [carried('bungee-gum', 'gum', 0xf077b7, 0.9)]
    case 'borrowed-page':
      return [carried('skill-hunter', 'book', 0x7d2d42, 0.18)]
    case 'loaned-ability':
      return [carried('stealth-dolphin', 'fish', 0x63d8ef, 0.35)]
    default:
      return []
  }
}
