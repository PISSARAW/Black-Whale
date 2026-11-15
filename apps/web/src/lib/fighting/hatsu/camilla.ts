import { unchangedFrame, unchangedImpact, type FighterHatsu } from './contract'

export const camillaHatsu: FighterHatsu = {
  id: 'camilla',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, catCounters: 1 } },
    }
  },
  onImpact: unchangedImpact,
  onFrame: unchangedFrame,
}
