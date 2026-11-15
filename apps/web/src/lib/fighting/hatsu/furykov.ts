import type { ArcadeFighter } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

const COMBO_FOCUS_FRAMES = 180

export const furykovHatsu: FighterHatsu = {
  id: 'furykov',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, comboFocusFrames: COMBO_FOCUS_FRAMES },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}

function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.comboFocusFrames
  return frames > 0
    ? { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, comboFocusFrames: frames - 1 } }
    : fighter
}
