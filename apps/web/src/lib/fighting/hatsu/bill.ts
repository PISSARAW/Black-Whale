import type { ArcadeFighter } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

const GROWTH_FRAMES = 300

export const billHatsu: FighterHatsu = {
  id: 'bill',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        health: Math.min(100, fighter.health + 10),
        hatsuEffects: { ...fighter.hatsuEffects, growthFrames: GROWTH_FRAMES },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}

function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.growthFrames
  return frames > 0
    ? { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, growthFrames: frames - 1 } }
    : fighter
}
