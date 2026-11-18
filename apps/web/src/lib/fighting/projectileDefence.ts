import { canGuard, canMove } from './fightActorState'
import { motionOf } from './fighterMovement'
import { styleReactionFrames } from './styleMobility'
import { styleMatchup } from './styleMatchups'
import { hurtboxes } from './frameData'
import { repeatedHabit } from './opponentHabits'
import { perceivedProjectiles, seesProjectile } from './projectilePerception'
import {
  forecastProjectileBody,
  predictableProjectile,
  projectedImpact,
} from './projectileForecast'
import type { CounterplayCue } from './fightCounterplay'
import {
  EMPTY_INPUT,
  type ArcadeFighter,
  type FightInput,
  type FightSide,
  type FightState,
} from './types'

export const PROJECTILE_BURST_GAP = 12
interface ProjectileDefence {
  owner: FightSide
  lastSeen: number
  frames: number
  ids: readonly number[]
  action?: 'guard' | 'crouch' | 'jump'
}
declare module './types' {
  interface ArcadeFighter {
    projectileDefence?: ProjectileDefence
  }
}
export interface ProjectileResponse {
  fighter: ArcadeFighter
  input?: FightInput
}

/** Keep one observed reaction clock across a volley, never across an unseen attack. */
export function projectileDefenceResponse(
  state: FightState,
  fighter: ArcadeFighter,
  cue: CounterplayCue | null,
): ProjectileResponse | null {
  if (cue?.kind !== 'projectile') return heldBurst(state, fighter)
  const shots = perceivedProjectiles({ ...state, opponent: fighter }, 'opponent')
  const previous = continuesVolley(fighter.projectileDefence, cue, state.frame)
    ? fighter.projectileDefence
    : undefined
  const frames = observedFrames(fighter, cue, previous)
  const ids = [...new Set([...(previous?.ids ?? []), ...shots.map((shot) => shot.id)])].slice(-16)
  const memory: ProjectileDefence = { owner: cue.owner, lastSeen: state.frame, frames, ids }
  let next = {
    ...fighter,
    projectileDefence: memory,
    counterplayRead: { key: cue.key, frames, coveringEars: false },
  }
  if (frames <= styleReactionFrames(fighter)) return { fighter: next }
  if (fighter.attack || (!canGuard(fighter) && !canMove(fighter))) return { fighter: next }
  const input = chooseDefence({ fighter: next, cue }, shots)
  memory.action = defenceAction(input)
  next = { ...next, projectileDefence: memory }
  return { fighter: next, input }
}

function continuesVolley(
  memory: ProjectileDefence | undefined,
  cue: CounterplayCue,
  frame: number,
): boolean {
  return Boolean(
    memory &&
    memory.owner === cue.owner &&
    frame >= memory.lastSeen &&
    frame - memory.lastSeen <= PROJECTILE_BURST_GAP,
  )
}

function observedFrames(
  fighter: ArcadeFighter,
  cue: CounterplayCue,
  previous?: ProjectileDefence,
): number {
  if (previous) return previous.frames + 1
  return fighter.counterplayRead?.key === cue.key ? fighter.counterplayRead.frames + 1 : 1
}

function interrupted(state: FightState, fighter: ArcadeFighter): boolean {
  return Boolean(
    state.parallelFuture || state.catsName || fighter.health <= 0 || fighter.knockdownFrames > 0,
  )
}

function heldBurst(state: FightState, fighter: ArcadeFighter): ProjectileResponse | null {
  if (interrupted(state, fighter)) return null
  const memory = fighter.projectileDefence
  if (
    !memory ||
    state.frame < memory.lastSeen ||
    state.frame - memory.lastSeen > PROJECTILE_BURST_GAP
  )
    return null
  if (memory.ids.length < 2 || !memory.action)
    return {
      fighter: {
        ...fighter,
        counterplayRead: undefined,
        projectileDefence: { ...memory, action: undefined },
      },
    }
  if (!canGuard(fighter) && !canMove(fighter)) return { fighter }
  return {
    fighter,
    input: { ...EMPTY_INPUT, guard: memory.action !== 'jump', down: memory.action === 'crouch' },
  }
}

function defenceAction(input: FightInput): NonNullable<ProjectileDefence['action']> {
  if (input.jump) return 'jump'
  return input.down ? 'crouch' : 'guard'
}

function chooseDefence(
  context: { fighter: ArcadeFighter; cue: CounterplayCue },
  shots: ReturnType<typeof perceivedProjectiles>,
): FightInput {
  const { fighter, cue } = context
  // A jump already started keeps its ordinary locked arc, including vulnerable takeoff.
  if (fighter.y > 0 || motionOf(fighter).prejumpFrames > 0) return { ...EMPTY_INPUT, jump: true }
  const guard = projectileGuard(fighter, cue, shots)
  const crouch = { ...guard, down: true }
  if (safePath(fighter, shots, crouch)) return crouch
  if (!canPlanJump(fighter) || !wantsJump(fighter, cue)) return guard
  const jump = jumpInput(fighter, cue)
  return safePath(fighter, shots, jump) ? jump : guard
}

function canPlanJump(fighter: ArcadeFighter): boolean {
  return (
    canMove(fighter) &&
    fighter.blockStun === 0 &&
    motionOf(fighter).landingFrames === 0 &&
    fighter.projectileDefence!.ids.length <= 1
  )
}

/** Duck the high part of a volley while guarding its mid/low shots. */
function projectileGuard(
  fighter: ArcadeFighter,
  cue: CounterplayCue,
  shots: ReturnType<typeof perceivedProjectiles>,
): FightInput {
  if (cue.guard === 'low') return { ...EMPTY_INPUT, guard: true, down: true }
  if (cue.guard === 'overhead') return { ...EMPTY_INPUT, guard: true }
  const overhead = shots.some((shot) => seesProjectile(fighter, shot) && shot.guard === 'overhead')
  const top = Math.max(...hurtboxes({ ...fighter, crouching: true }).map((box) => box.top))
  const high = shots.some((shot) => predictableProjectile(shot) && shot.y - shot.height > top)
  return { ...EMPTY_INPUT, guard: true, down: high && !overhead }
}

function wantsJump(fighter: ArcadeFighter, cue: CounterplayCue): boolean {
  return (
    styleMatchup(fighter.id).role === 'mobile' ||
    repeatedHabit(fighter, 'projectile') ||
    cue.position.y < 4
  )
}

function jumpInput(fighter: ArcadeFighter, cue: CounterplayCue): FightInput {
  const repeated = repeatedHabit(fighter, 'projectile')
  const toward = cue.position.x > fighter.x ? 1 : -1
  return {
    ...EMPTY_INPUT,
    jump: true,
    left: repeated && toward < 0,
    right: repeated && toward > 0,
  }
}

function safePath(
  fighter: ArcadeFighter,
  shots: ReturnType<typeof perceivedProjectiles>,
  input: FightInput,
): boolean {
  if (shots.some((shot) => !predictableProjectile(shot))) return false
  const path = forecastProjectileBody(fighter, input)
  return shots.every((shot) => projectedImpact(shot, path) === null)
}

/** Prevent a new AI attack or preparation from cancelling the selected defence. */
export function projectileDefenceHolds(state: FightState): boolean {
  const memory = state.opponent.projectileDefence
  return Boolean(
    memory?.action &&
    state.frame >= memory.lastSeen &&
    state.frame - memory.lastSeen <= PROJECTILE_BURST_GAP,
  )
}
