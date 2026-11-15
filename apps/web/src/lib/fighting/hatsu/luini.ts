import { unchangedFrame, unchangedImpact, type FighterHatsu } from './contract'

export const luiniHatsu: FighterHatsu = {
  id: 'luini',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, teleportDodges: 1 } },
    }
  },
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}
