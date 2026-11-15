import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const STITCHED_FRAMES = 90

export const machiHatsu: FighterHatsu = {
  id: 'machi',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hatsuEffects: { ...defender.hatsuEffects, stitchedFrames: STITCHED_FRAMES },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickStitches(state.player),
    opponent: tickStitches(state.opponent),
  }),
}

function tickStitches(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.stitchedFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: Math.max(fighter.hitStun, 2),
    hatsuEffects: { ...fighter.hatsuEffects, stitchedFrames: frames - 1 },
  }
}
