import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const EXPOSED_FRAMES = 150

export const lynchHatsu: FighterHatsu = {
  id: 'lynch',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hitStun: Math.max(defender.hitStun, 34),
        hatsuEffects: { ...defender.hatsuEffects, soulExposedFrames: EXPOSED_FRAMES },
      },
    }
  },
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}

function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.soulExposedFrames
  return frames > 0
    ? { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, soulExposedFrames: frames - 1 } }
    : fighter
}
