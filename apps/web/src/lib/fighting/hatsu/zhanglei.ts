import { unchangedFrame, unchangedImpact, type FighterHatsu } from './contract'
export const zhangleiHatsu: FighterHatsu = {
  id: 'zhanglei',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: {
          ...fighter.hatsuEffects,
          coinCharges: Math.min(3, fighter.hatsuEffects.coinCharges + 1),
        },
      },
    }
  },
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}
