import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'
const FRAMES = 180
export const salesaleHatsu: FighterHatsu = {
  id: 'salesale',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide }) => {
    const fighter = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, smokeFrames: FRAMES },
      },
    }
  },
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}
function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.smokeFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    aura: frames % 30 === 0 ? Math.max(0, fighter.aura - 2) : fighter.aura,
    hatsuEffects: { ...fighter.hatsuEffects, smokeFrames: frames - 1 },
  }
}
