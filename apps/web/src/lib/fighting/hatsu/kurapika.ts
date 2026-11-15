import { forceZetsu } from '../nen'
import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const JUDGMENT_ZETSU_FRAMES = 180

export const kurapikaHatsu: FighterHatsu = {
  id: 'kurapika',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hatsuEffects: {
          ...defender.hatsuEffects,
          forcedZetsuFrames: JUDGMENT_ZETSU_FRAMES,
        },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickJudgment(state.player),
    opponent: tickJudgment(state.opponent),
  }),
}

function tickJudgment(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.forcedZetsuFrames
  if (frames <= 0) return fighter
  const forced = forceZetsu(fighter)
  return {
    ...forced,
    hatsuEffects: { ...forced.hatsuEffects, forcedZetsuFrames: frames - 1 },
  }
}
