import { attackPhase } from './frameData'
import {
  canHear,
  MELODY_HEARING_RANGE,
  MELODY_LISTEN_FRAMES,
  MELODY_PARRY_BONUS,
  soundDistance,
} from './melodyRules'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** A bodily faculty: no Nen, In/Gyo, stolen page, aura values or hidden inputs involved. */
export function advanceMelodyHearing(state: FightState): FightState {
  const next = { ...state }
  for (const side of ['player', 'opponent'] as const) next[side] = hearOpponent(state, side)
  return next
}

function hearOpponent(state: FightState, side: FightSide): ArcadeFighter {
  const fighter = state[side]
  if (fighter.id !== 'melody')
    return fighter.melodyHearing ? { ...fighter, melodyHearing: undefined } : fighter
  const target = side === 'player' ? 'opponent' : 'player'
  const opponent = state[target]
  if (
    !canHear(fighter) ||
    opponent.health <= 0 ||
    soundDistance(fighter, opponent) > MELODY_HEARING_RANGE
  )
    return { ...fighter, melodyHearing: undefined }
  return { ...fighter, melodyHearing: heartReading(fighter, opponent, target) }
}

function heartReading(fighter: ArcadeFighter, opponent: ArcadeFighter, target: FightSide) {
  const bodyX = opponent.hanzoProjection?.bodyX ?? opponent.x
  return {
    target,
    frames: Math.min(MELODY_LISTEN_FRAMES, (fighter.melodyHearing?.frames ?? 0) + 1),
    direction: (bodyX >= fighter.x ? 1 : -1) as -1 | 1,
    pulse: (opponent.attack || opponent.motion?.dash || opponent.hitStun > 0
      ? 'agitated'
      : 'steady') as 'agitated' | 'steady',
    threat: attackPhase(opponent),
  }
}

/** Small manual-parry tolerance after listening, never an automatic dodge or mind reading. */
export function melodyParryBonus(fighter: ArcadeFighter, attacker?: ArcadeFighter): number {
  if (fighter.id !== 'melody' || !attacker || !canHear(fighter)) return 0
  if ((fighter.melodyHearing?.frames ?? 0) < MELODY_LISTEN_FRAMES) return 0
  return soundDistance(fighter, attacker) <= MELODY_HEARING_RANGE ? MELODY_PARRY_BONUS : 0
}
