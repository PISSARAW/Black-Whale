import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'

const BARRAGE_DAMAGE = 10

export const franklinHatsu: FighterHatsu = {
  id: 'franklin',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        health: Math.max(0, defender.health - BARRAGE_DAMAGE),
        hitStun: Math.max(defender.hitStun, 32),
      },
    }
  },
  onFrame: unchangedFrame,
}
