import type { ArcadeFighter } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

const ISOLATION_FRAMES = 240

export const marayamHatsu: FighterHatsu = {
  id: 'marayam',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, isolationFrames: ISOLATION_FRAMES },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => ({
    ...state,
    player: tickIsolation(state.player),
    opponent: tickIsolation(state.opponent),
  }),
}

function tickIsolation(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.isolationFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, isolationFrames: frames - 1 },
  }
}
