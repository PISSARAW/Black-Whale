import type { ArcadeFighter } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

const HAIKU_FRAMES = 180

export const bashoHatsu: FighterHatsu = {
  id: 'basho',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, haikuFrames: HAIKU_FRAMES } },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}

function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.haikuFrames
  return frames > 0
    ? { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, haikuFrames: frames - 1 } }
    : fighter
}
