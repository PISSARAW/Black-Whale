import { unchangedFrame, unchangedImpact, type FighterHatsu } from './contract'

export const hanzoHatsu: FighterHatsu = {
  id: 'hanzo',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, cloneDodges: 1 },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}
