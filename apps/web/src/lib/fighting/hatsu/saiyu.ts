import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'

const THREE_MONKEYS_ZETSU_FRAMES = 150

export const saiyuHatsu: FighterHatsu = {
  id: 'saiyu',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    const senseSeals = Math.min(3, defender.hatsuEffects.senseSeals + 1)
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        hitStun: Math.max(defender.hitStun, senseSeals * 12),
        hatsuEffects: {
          ...defender.hatsuEffects,
          senseSeals,
          forcedZetsuFrames:
            senseSeals === 3 ? THREE_MONKEYS_ZETSU_FRAMES : defender.hatsuEffects.forcedZetsuFrames,
        },
      },
    }
  },
  onFrame: unchangedFrame,
}
