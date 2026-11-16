import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'
import { saiyuMonkey, SENSE_BITS } from '../saiyuSenses'

export const saiyuHatsu: FighterHatsu = {
  id: 'saiyu',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked, moveId }) => {
    if (blocked) return state
    const monkey = saiyuMonkey(moveId)
    if (!monkey) return state
    const defender = state[defenderSide]
    const senseSeals = defender.hatsuEffects.senseSeals | SENSE_BITS[monkey.sense]
    if (senseSeals === defender.hatsuEffects.senseSeals) return state
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hatsuEffects: {
          ...defender.hatsuEffects,
          senseSeals,
        },
      },
    }
  },
  onFrame: unchangedFrame,
}
