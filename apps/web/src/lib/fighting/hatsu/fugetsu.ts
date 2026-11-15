import { unchangedFrame, unchangedImpact, type FighterHatsu } from './contract'
export const fugetsuHatsu: FighterHatsu = {
  id: 'fugetsu',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, wormDodges: 1 } },
    }
  },
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}
