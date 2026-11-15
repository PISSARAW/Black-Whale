import type { ArcadeFighter } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

const CANTABILE_FRAMES = 120

export const bonolenovHatsu: FighterHatsu = {
  id: 'bonolenov',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, cantabileFrames: CANTABILE_FRAMES },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => ({
    ...state,
    player: tickCantabile(state.player),
    opponent: tickCantabile(state.opponent),
  }),
}

function tickCantabile(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.cantabileFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, cantabileFrames: frames - 1 },
  }
}
