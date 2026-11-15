import type { ArcadeFighter } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

const TRANSFORMATION_FRAMES = 360

export const biscuitHatsu: FighterHatsu = {
  id: 'biscuit',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, transformationFrames: TRANSFORMATION_FRAMES },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => ({
    ...state,
    player: tickTransformation(state.player),
    opponent: tickTransformation(state.opponent),
  }),
}

function tickTransformation(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.transformationFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, transformationFrames: frames - 1 },
  }
}
