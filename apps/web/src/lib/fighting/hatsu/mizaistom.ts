import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const CROSS_GAME_FRAMES = 90

export const mizaistomHatsu: FighterHatsu = {
  id: 'mizaistom',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hatsuEffects: { ...defender.hatsuEffects, restrainedFrames: CROSS_GAME_FRAMES },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickRestraint(state.player),
    opponent: tickRestraint(state.opponent),
  }),
}

function tickRestraint(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.restrainedFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: Math.max(fighter.hitStun, 2),
    hatsuEffects: { ...fighter.hatsuEffects, restrainedFrames: frames - 1 },
  }
}
