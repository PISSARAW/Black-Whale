import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'
const FRAMES = 120
export const momozeHatsu: FighterHatsu = {
  id: 'momoze',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const fighter = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, momozeFrames: FRAMES },
      },
    }
  },
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}
function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.momozeFrames
  return frames > 0
    ? {
        ...fighter,
        hitStun: Math.max(fighter.hitStun, 2),
        hatsuEffects: { ...fighter.hatsuEffects, momozeFrames: frames - 1 },
      }
    : fighter
}
