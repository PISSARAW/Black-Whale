import type { ArcadeFighter } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

const BIOHAZARD_FRAMES = 90

export const hinrighHatsu: FighterHatsu = {
  id: 'hinrigh',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, biohazardFrames: BIOHAZARD_FRAMES },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => ({
    ...state,
    player: tickBiohazard(state.player),
    opponent: tickBiohazard(state.opponent),
  }),
}

function tickBiohazard(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.biohazardFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: Math.max(fighter.hitStun, 2),
    hatsuEffects: { ...fighter.hatsuEffects, biohazardFrames: frames - 1 },
  }
}
