import { witnessedHatsuState } from './nenWitness'
import type { FightSide, FightState } from './types'

/** Observe the actual alteration when it manifests; an impersonated face does not change its Hatsu. */
export function observeIllumiFace(
  state: FightState,
  side: FightSide,
  previouslyDisguised: boolean,
): FightState {
  if (previouslyDisguised || !state[side].illumi?.disguised) return state
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [other]: {
      ...state[other],
      hatsuEffects: {
        ...state[other].hatsuEffects,
        ...witnessedHatsuState(state, {
          side,
          source: 'illumi',
          moveId: 'illumi:backSpecial',
          concealed: false,
        }),
      },
    },
  }
}
