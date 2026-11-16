import { canStartFighterAttack } from './fighterAttacks'
import { triggerHatsu } from './hatsu'
import {
  melodyCanPerform,
  melodyMusicIntent,
  MELODY_MUSIC_MOVE,
  MELODY_STARTUP,
  MELODY_START_COST,
} from './melodyRules'
import { stopMelodyMusic } from './melodyChannel'
import { moveById } from './movesets'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** L toggles a stationary, interruptible performance. It never creates an attack. */
export function performMelodyAction(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  const musical = melodyMusicIntent(fighter, kind, moveId)
  if (fighter.melodyPerformance) {
    const stopped = stopMelodyMusic(state, side)
    return musical ? stopped : perform({ ...options, state: stopped })
  }
  if (!musical) {
    return fighter.id === 'melody' && kind === 'special' ? state : null
  }
  return beginMusic(options)
}

function beginMusic(options: AuraAttackOptions): FightState {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  const selected = moveId ?? MELODY_MUSIC_MOVE
  if (
    !melodyCanPerform(fighter) ||
    fighter.attack ||
    !canStartFighterAttack(fighter, kind, selected)
  )
    return state
  const cost = moveById(selected)?.auraCost ?? MELODY_START_COST
  if (fighter.aura < cost) return state
  const witnessed = triggerHatsu(state, side, 'melody')
  return {
    ...witnessed,
    [side]: {
      ...witnessed[side],
      aura: fighter.aura - cost,
      blocking: false,
      guardFrames: 0,
      motion: undefined,
      pose: 'special',
      bufferedAttack: null,
      melodyPerformance: {
        originX: fighter.x,
        startupFrames: MELODY_STARTUP,
        playingFrames: 0,
        moveId: selected,
      },
    },
  }
}
