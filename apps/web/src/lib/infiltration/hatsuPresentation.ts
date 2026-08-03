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
  /** A manifestation that travels with the player, wherever they stand. */
  const carried = ({
    id,
    kind,
    colour,
    size,
    stage = 0,
  }: {
    id: string
    kind: ApparitionKind
    colour: number
    size: number
    stage?: number
  }): HatsuManifestation => ({ id, kind, colour, size, stage, spaceId, at: state.player.position })

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
      return [carried({ id: 'texture-surprise', kind: 'paper', colour: 0xe7c58c, size: 0.22 })]
    case 'disguise-mask':
      return [carried({ id: 'needle-people', kind: 'mark', colour: 0xa989d8, size: 0.38 })]
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
      return [carried({ id: 'dowsing-chain', kind: 'chain', colour: 0xb9e9ff, size: 0.13 })]
    case 'cleaned':
      return [
        carried({
          id: 'blinky',
          kind: 'hoover',
          colour: 0x4e5664,
          size: 0.5,
          stage: Number(effect.payload ?? 0),
        }),
      ]
    case 'gum-anchor':
      return [carried({ id: 'bungee-gum', kind: 'gum', colour: 0xf077b7, size: 0.9 })]
    case 'borrowed-page':
      return [carried({ id: 'skill-hunter', kind: 'book', colour: 0x7d2d42, size: 0.18 })]
    case 'loaned-ability':
      return [carried({ id: 'stealth-dolphin', kind: 'fish', colour: 0x63d8ef, size: 0.35 })]
    default:
      return []
  }
}
