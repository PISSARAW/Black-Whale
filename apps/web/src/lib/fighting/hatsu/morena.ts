import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const CONTAGION_FRAMES = 360

export const morenaHatsu: FighterHatsu = {
  id: 'morena',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    const stacks = Math.min(3, defender.hatsuEffects.contagionStacks + 1)
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        aura: Math.max(0, defender.aura - stacks * 8),
        hatsuEffects: {
          ...defender.hatsuEffects,
          contagionFrames: CONTAGION_FRAMES,
          contagionStacks: stacks,
        },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickContagion(state.player),
    opponent: tickContagion(state.opponent),
  }),
}

function tickContagion(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.contagionFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hatsuEffects: {
      ...fighter.hatsuEffects,
      contagionFrames: frames - 1,
      contagionStacks: frames === 1 ? 0 : fighter.hatsuEffects.contagionStacks,
    },
  }
}
