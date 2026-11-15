import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const NEEDLE_FRAMES = 120

export const illumiHatsu: FighterHatsu = {
  id: 'illumi',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        aura: Math.max(0, defender.aura - 12),
        hatsuEffects: { ...defender.hatsuEffects, needleFrames: NEEDLE_FRAMES },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickNeedleControl(state.player),
    opponent: tickNeedleControl(state.opponent),
  }),
}

function tickNeedleControl(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.needleFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: Math.max(fighter.hitStun, 2),
    hatsuEffects: { ...fighter.hatsuEffects, needleFrames: frames - 1 },
  }
}
