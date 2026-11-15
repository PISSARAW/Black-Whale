import { forceZetsu } from '../nen'
import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const CHAIN_JAIL_ZETSU_FRAMES = 180

export const kurapikaHatsu: FighterHatsu = {
  id: 'kurapika',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, side, defenderSide, blocked }) => {
    if (blocked || state[side].attack?.moveId !== 'kurapika:neutralSpecial') return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hatsuEffects: {
          ...defender.hatsuEffects,
          forcedZetsuFrames: CHAIN_JAIL_ZETSU_FRAMES,
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
