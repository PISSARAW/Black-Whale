import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'

const ARROW_DAMAGE = 20

export const halkenburgHatsu: FighterHatsu = {
  id: 'halkenburg',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        health: Math.max(0, defender.health - ARROW_DAMAGE),
        hatsuEffects: { ...defender.hatsuEffects, forcedZetsuFrames: 120 },
      },
    }
  },
  onFrame: unchangedFrame,
}
