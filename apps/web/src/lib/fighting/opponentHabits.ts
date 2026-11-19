import { currentlyLocatedTarget } from './opponentAwareness'
import { readCounterplay, seesCombatBody } from './fightCounterplay'
import { styleReactionFrames } from './styleMobility'
import {
  EMPTY_INPUT,
  type ArcadeFighter,
  type FightInput,
  type FightState,
  type MoveSlot,
} from './types'

type Habit = 'low' | 'air' | 'strike' | 'projectile'
export interface OpponentHabits {
  lastFrame: number
  seenAttackFrame: number | null
  firstSeenAt: number
  target?: { x: number; y: number; at: number }
  lastProjectile?: string
  sightings: readonly { kind: Habit; at: number }[]
}
declare module './types' {
  interface ArcadeFighter {
    observedHabits?: OpponentHabits
  }
}

/** Remember manifested actions only: no input buffers, analysis, private replies or future branch. */
export function rememberOpponentHabits(state: FightState, fighter: ArcadeFighter): ArcadeFighter {
  if (state.forecastSimulation || state.parallelFuture || fighter.blackVoiceAutopilot)
    return fighter
  const memory = fighter.observedHabits ?? {
    lastFrame: -1,
    seenAttackFrame: null,
    firstSeenAt: state.frame,
    sightings: [],
  }
  if (memory.lastFrame === state.frame) return fighter
  const target = currentlyLocatedTarget({ ...state, opponent: fighter })
  let next = rememberBody(
    state,
    { ...memory, lastFrame: state.frame, target: target ?? memory.target },
    fighter,
  )
  const cue = readCounterplay({ ...state, opponent: fighter }, 'opponent')
  if (cue?.kind === 'projectile' && cue.key !== next.lastProjectile)
    next = {
      ...next,
      lastProjectile: cue.key,
      sightings: [...next.sightings, { kind: 'projectile', at: state.frame }],
    }
  return {
    ...fighter,
    observedHabits: {
      ...next,
      sightings: next.sightings.filter((entry) => state.frame - entry.at <= 900).slice(-12),
    },
  }
}
function rememberBody(
  state: FightState,
  memory: OpponentHabits,
  observer: ArcadeFighter,
): OpponentHabits {
  if (!seesCombatBody(observer)) return memory
  const attack = state.player.attack
  if (!attack) return { ...memory, seenAttackFrame: null }
  const kind = visibleBodyHabit(state, observer)
  if (!kind) return memory
  const newAction = memory.seenAttackFrame === null || attack.frame < memory.seenAttackFrame
  return {
    ...memory,
    seenAttackFrame: attack.frame,
    firstSeenAt: newAction ? state.frame : memory.firstSeenAt,
    sightings: newAction ? [...memory.sightings, { kind, at: state.frame }] : memory.sightings,
  }
}
function visibleBodyHabit(state: FightState, observer: ArcadeFighter): Habit | null {
  if (!seesCombatBody(observer) || !state.player.attack || state.player.attack.concealed)
    return null
  if (state.player.y > 0) return 'air'
  return state.player.crouching ? 'low' : 'strike'
}
export function repeatedHabit(fighter: ArcadeFighter, kind: Habit): boolean {
  return (
    (fighter.observedHabits?.sightings.slice(-8).filter((entry) => entry.kind === kind).length ??
      0) >= 3
  )
}
export function habitGuardInput(state: FightState, fighter: ArcadeFighter): FightInput | null {
  const memory = fighter.observedHabits
  if (!memory || state.parallelFuture || !repeatedHabit(fighter, 'low')) return null
  if (
    visibleBodyHabit(state, fighter) !== 'low' ||
    state.frame - memory.firstSeenAt < styleReactionFrames(fighter)
  )
    return null
  return { ...EMPTY_INPUT, guard: true, down: true }
}
export function habitAttackSlots(state: FightState): readonly MoveSlot[] | null {
  if (state.parallelFuture || !repeatedHabit(state.opponent, 'air')) return null
  return seesCombatBody(state.opponent) && state.player.y > 0
    ? ['standingHeavy', 'forwardHeavy', 'standingLight']
    : null
}
