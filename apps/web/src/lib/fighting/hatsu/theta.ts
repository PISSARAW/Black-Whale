import { unchangedFrame, unchangedTrigger, type FighterHatsu } from './contract'

const AURA_PROJECTILE_ZETSU_FRAMES = 90

export const thetaHatsu: FighterHatsu = {
  id: 'theta',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        aura: Math.max(0, defender.aura - 18),
        hatsuEffects: {
          ...defender.hatsuEffects,
          forcedZetsuFrames: AURA_PROJECTILE_ZETSU_FRAMES,
        },
      },
    }
  },
  onFrame: unchangedFrame,
}
