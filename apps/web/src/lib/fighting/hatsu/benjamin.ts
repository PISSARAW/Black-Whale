import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'

export const benjaminHatsu: FighterHatsu = {
  id: 'benjamin',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, side, blocked }) => {
    if (blocked) return state
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: {
          ...fighter.hatsuEffects,
          batonCharges: Math.min(3, fighter.hatsuEffects.batonCharges + 1),
        },
      },
    }
  },
  onFrame: unchangedFrame,
}
