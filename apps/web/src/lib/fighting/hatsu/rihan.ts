import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const PREDATOR_FRAMES = 180

export const rihanHatsu: FighterHatsu = {
  id: 'rihan',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, side, defenderSide, blocked }) => {
    if (blocked) return state
    const fighter = state[side]
    const defender = state[defenderSide]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, predatorFrames: PREDATOR_FRAMES },
      },
      [defenderSide]: {
        ...defender,
        hatsuEffects: { ...defender.hatsuEffects, forcedZetsuFrames: PREDATOR_FRAMES },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickPredator(state.player),
    opponent: tickPredator(state.opponent),
  }),
}

function tickPredator(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.predatorFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, predatorFrames: frames - 1 },
  }
}
