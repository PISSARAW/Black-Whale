import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'

const BLINKY_BLOOD_LOSS = 8
const BLINKY_RECOVERY = 8
const BLINKY_AURA_DRAIN = 12

export const shizukuHatsu: FighterHatsu = {
  id: 'shizuku',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, side, defenderSide, blocked }) => {
    if (blocked) return state
    const fighter = state[side]
    const defender = state[defenderSide]
    return {
      ...state,
      [side]: {
        ...fighter,
        health: Math.min(100, fighter.health + BLINKY_RECOVERY),
      },
      [defenderSide]: {
        ...defender,
        health: Math.max(0, defender.health - BLINKY_BLOOD_LOSS),
        aura: Math.max(0, defender.aura - BLINKY_AURA_DRAIN),
      },
    }
  },
  onFrame: unchangedFrame,
}
