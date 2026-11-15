import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'

const SERPENT_BITE_DAMAGE = 18

export const kallutoHatsu: FighterHatsu = {
  id: 'kalluto',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    const marks = defender.hatsuEffects.serpentMarks + 1
    const converges = marks >= 3
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        health: Math.max(0, defender.health - (converges ? SERPENT_BITE_DAMAGE : 0)),
        hatsuEffects: {
          ...defender.hatsuEffects,
          serpentMarks: converges ? 0 : marks,
        },
      },
    }
  },
  onFrame: unchangedFrame,
}
