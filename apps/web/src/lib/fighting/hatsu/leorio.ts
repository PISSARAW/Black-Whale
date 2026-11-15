import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'

const REMOTE_PUNCH_DAMAGE = 8

export const leorioHatsu: FighterHatsu = {
  id: 'leorio',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        health: Math.max(0, defender.health - REMOTE_PUNCH_DAMAGE),
        hitStun: 30,
      },
    }
  },
  onFrame: unchangedFrame,
}
