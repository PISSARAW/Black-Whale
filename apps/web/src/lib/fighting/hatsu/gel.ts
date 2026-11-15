import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const VENOM_FRAMES = 180

export const gelHatsu: FighterHatsu = {
  id: 'gel',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hatsuEffects: { ...defender.hatsuEffects, venomFrames: VENOM_FRAMES },
      },
    }
  },
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}

function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.venomFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    aura: frames % 30 === 0 ? Math.max(0, fighter.aura - 3) : fighter.aura,
    hatsuEffects: { ...fighter.hatsuEffects, venomFrames: frames - 1 },
  }
}
