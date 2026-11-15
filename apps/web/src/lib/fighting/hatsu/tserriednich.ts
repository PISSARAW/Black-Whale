import { unchangedFrame, unchangedImpact, type FighterHatsu } from './contract'

export const tserriednichHatsu: FighterHatsu = {
  id: 'tserriednich',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, futureSight: 1 },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}
