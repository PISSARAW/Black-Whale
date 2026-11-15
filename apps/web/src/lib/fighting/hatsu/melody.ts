import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const ENTRANCED_FRAMES = 75

export const melodyHatsu: FighterHatsu = {
  id: 'melody',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide }) => {
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hatsuEffects: { ...defender.hatsuEffects, entrancedFrames: ENTRANCED_FRAMES },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickEntrancement(state.player),
    opponent: tickEntrancement(state.opponent),
  }),
}

function tickEntrancement(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.entrancedFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: Math.max(fighter.hitStun, 2),
    hatsuEffects: { ...fighter.hatsuEffects, entrancedFrames: frames - 1 },
  }
}
