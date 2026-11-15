import type { ArcadeFighter } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'

const BLACK_VOICE_FRAMES = 90
const SUN_MOON_DAMAGE = 24

export const chrolloHatsu: FighterHatsu = {
  id: 'chrollo',
  sourceFor: (fighter) => {
    const copied = fighter.hatsuEffects.lastHatsuReceived
    return copied && copied !== 'chrollo' ? copied : 'chrollo'
  },
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const defender = state[defenderSide]
    const detonates = defender.hatsuEffects.sunMoonMarks > 0
    return {
      ...state,
      [defenderSide]: {
        ...defender,
        health: Math.max(0, defender.health - (detonates ? SUN_MOON_DAMAGE : 0)),
        hitStun: Math.max(defender.hitStun, detonates ? 38 : BLACK_VOICE_FRAMES / 2),
        hatsuEffects: {
          ...defender.hatsuEffects,
          sunMoonMarks: detonates ? 0 : 1,
          manipulatedFrames: detonates ? 0 : BLACK_VOICE_FRAMES,
        },
      },
    }
  },
  onFrame: (state) => ({
    ...state,
    player: tickBlackVoice(state.player),
    opponent: tickBlackVoice(state.opponent),
  }),
}

function tickBlackVoice(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.manipulatedFrames
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: Math.max(fighter.hitStun, 2),
    hatsuEffects: { ...fighter.hatsuEffects, manipulatedFrames: frames - 1 },
  }
}
