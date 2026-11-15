import type { ArcadeFighter } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

const FRAMES = 180
export const cluckHatsu: FighterHatsu = {
  id: 'cluck',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, birdFrames: FRAMES } },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}
function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.birdFrames
  return frames > 0
    ? { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, birdFrames: frames - 1 } }
    : fighter
}
