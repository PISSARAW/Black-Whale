import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const BLOOD_BIND_FRAMES = 100

export const zakuroHatsu: FighterHatsu = {
  id: 'zakuro',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hatsuEffects: { ...defender.hatsuEffects, bloodBoundFrames: BLOOD_BIND_FRAMES },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickBloodBind(state.player),
    opponent: tickBloodBind(state.opponent),
  }),
}

function tickBloodBind(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.bloodBoundFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: Math.max(fighter.hitStun, 2),
    hatsuEffects: { ...fighter.hatsuEffects, bloodBoundFrames: frames - 1 },
  }
}
