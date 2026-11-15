import { unchangedFrame, unchangedImpact, type FighterHatsu } from './contract'
export const kachoHatsu: FighterHatsu = {
  id: 'kacho',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, kachoGuards: 1 } },
    }
  },
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}
