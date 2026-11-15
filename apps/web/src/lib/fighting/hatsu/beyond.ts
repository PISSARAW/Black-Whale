import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const FRAMES = 240
export const beyondHatsu: FighterHatsu = {
  id: 'beyond',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const fighter = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...fighter,
        aura: Math.max(0, fighter.aura - 15),
        hatsuEffects: { ...fighter.hatsuEffects, curseFrames: FRAMES },
      },
    }
  },
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}
function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.curseFrames
  return frames > 0
    ? { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, curseFrames: frames - 1 } }
    : fighter
}
