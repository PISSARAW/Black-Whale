import { attackData } from './frameData'
import { attackPoseFraction } from './fightAttackTravel'
import { selectThrowPerformance } from './throws/selection'
import type { ThrowPerformanceId } from './throws/types'
import type { FightImpact, FightSide, FightState } from './types'

export const THROW_CINEMATIC_FRAMES = 84
export interface ThrowCinematicFrame {
  attacker: FightSide
  victim: FightSide
  sequence: number
  age: number
  duration: number
  facing: 1 | -1
  active: boolean
  powered?: boolean
  performance?: ThrowPerformanceId
  puppetId?: string
  future?: { x: number; y: number }
}

export function throwCinematicPhase(
  frame: ThrowCinematicFrame,
): 'grip' | 'turn' | 'slam' | 'release' {
  const t = frame.age / frame.duration
  if (t < 0.25) return 'grip'
  if (t < 0.55) return 'turn'
  return t < 0.8 ? 'slam' : 'release'
}

/** A missed grab, throw tech, projectile or concealed cause cannot authorize a throw film. */
export function confirmedThrow(state: FightState): ThrowCinematicFrame | null {
  const impact = state.impact
  if (!impact || !validThrowImpact(impact)) return null
  const attacker = state[impact.attacker]
  if (attacker.id !== 'bonolenov') return null
  const attack = attacker.attack
  if (attack?.variant !== 'throw' || !attack.confirmedHit) return null
  const victim = impact.attacker === 'player' ? 'opponent' : 'player'
  if (attacker.hanzoProjection || state[victim].hanzoProjection) return null
  const data = attackData(attack.kind, attacker)
  return {
    ...selectThrowPerformance(state, impact.attacker),
    attacker: impact.attacker,
    victim,
    sequence: impact.sequence,
    age: Math.max(0, attack.frame - data.startup),
    duration: Math.min(THROW_CINEMATIC_FRAMES, data.active + data.recovery - 1),
    facing: attacker.facing,
    active: true,
  }
}

function validThrowImpact(impact: FightImpact): boolean {
  return (
    impact.projectileId === null &&
    impact.knockdown &&
    ![impact.blocked, impact.parried, impact.avoided, impact.invulnerable].some(Boolean)
  )
}

/** Only presentation time is deferred; the match verdict and damage stay authoritative. */
export function throwVictoryDelay(state: FightState): number {
  const frame = confirmedThrow(state)
  return frame ? Math.max(0, frame.duration - frame.age) / 60 : 0
}

export function createThrowCinematic() {
  let frame: ThrowCinematicFrame | null = null
  let key = ''
  let previousFrame = -1
  const final = { since: null as number | null, age: 0 }
  return {
    current: () => frame,
    observe(
      state: FightState,
      seconds: number,
      options: { enabled: boolean; finalRemaining?: number },
    ) {
      const nextKey = `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
      if (resetThrowTracking(state, { nextKey, key, previousFrame, enabled: options.enabled }))
        frame = null
      key = nextKey
      const elapsed = Math.max(0, state.frame - previousFrame)
      previousFrame = state.frame
      const contact = options.enabled ? confirmedThrow(state) : null
      if (contact && frame?.sequence !== contact.sequence) {
        frame = contact
        final.since = null
      }
      if (!frame || !validThrowContinuation(state, frame)) {
        frame = null
        final.since = null
        return
      }
      advanceThrowFrame(
        frame,
        { state, seconds, contact, elapsed, finalRemaining: options.finalRemaining },
        final,
      )
      frame.active = frame.age < frame.duration
    },
  }
}

function resetThrowTracking(
  state: FightState,
  options: {
    key: string
    nextKey: string
    previousFrame: number
    enabled: boolean
  },
): boolean {
  return (
    !options.enabled ||
    options.nextKey !== options.key ||
    state.frame < options.previousFrame ||
    state.phase === 'ready'
  )
}

function advanceThrowFrame(
  frame: ThrowCinematicFrame,
  input: {
    state: FightState
    seconds: number
    contact: ThrowCinematicFrame | null
    elapsed: number
    finalRemaining?: number
  },
  final: { since: number | null; age: number },
) {
  if (input.state.phase !== 'finished') {
    final.since = null
    frame.age = input.contact
      ? input.contact.age + attackPoseFraction(input.state)
      : frame.age + input.elapsed
    return
  }
  if (final.since === null) {
    final.since = input.seconds
    final.age = frame.age
  }
  frame.age =
    input.finalRemaining === undefined
      ? final.age + Math.max(0, input.seconds - final.since) * 60
      : frame.duration - input.finalRemaining * 60
}

function validThrowContinuation(state: FightState, frame: ThrowCinematicFrame): boolean {
  if (state.impact?.sequence !== frame.sequence || state.phase === 'ready') return false
  return ['hit', 'down', 'ko'].includes(state[frame.victim].pose)
}
