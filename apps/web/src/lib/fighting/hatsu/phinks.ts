import { unchangedFrame, type FighterHatsu } from './contract'

export const phinksHatsu: FighterHatsu = {
  id: 'phinks',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: {
          ...fighter.hatsuEffects,
          cyclotronTurns: Math.min(7, fighter.hatsuEffects.cyclotronTurns + 1),
        },
      },
    }
  },
  onImpact: ({ state, side }) => {
    const fighter = state[side]
    return {
      ...state,
      [side]: {
        ...fighter,
        hatsuEffects: { ...fighter.hatsuEffects, cyclotronTurns: 0 },
      },
    }
  },
  onFrame: unchangedFrame,
}
