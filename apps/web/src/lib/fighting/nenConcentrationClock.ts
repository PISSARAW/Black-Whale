import type { AuraConcentration } from './nenConcentration'
import type { FightSide, FightState } from './types'

interface Clock {
  previousFrame: number
  time: number
  since: number
  key: string
  identity: string
  prior: AuraConcentration | null
  release: { aura: AuraConcentration; at: number; move?: string } | null
  sequence: number
}

/** The engine spends focus at contact. Its visible discharge holds in hitstop, then dissipates. */
export function createConcentrationClock(side: FightSide) {
  const clock: Clock = {
    previousFrame: -1,
    time: 0,
    since: -Infinity,
    key: '',
    identity: '',
    prior: null,
    release: null,
    sequence: 0,
  }
  return (state: FightState, actual: AuraConcentration | null) => {
    const reset = advanceClock(clock, state, side)
    observeDischarge(clock, { state, side, actual })
    const concentration = actual ?? clock.release?.aura ?? null
    const strength = clock.release ? Math.max(0, 1 - (clock.time - clock.release.at) / 6) : 1
    const next = JSON.stringify(concentration)
    if (next !== clock.key) {
      clock.key = next
      clock.since = reset ? -Infinity : clock.time
    }
    return { concentration, strength, time: clock.time, age: clock.time - clock.since }
  }
}

function advanceClock(clock: Clock, state: FightState, side: FightSide) {
  const identity = `${state[side].id}:${state.roundNumber}`
  const reset = clock.identity !== identity || state.frame < clock.previousFrame
  if (reset) {
    Object.assign(clock, {
      prior: null,
      release: null,
      key: '',
      time: 0,
      previousFrame: state.frame,
      sequence: 0,
    })
  }
  clock.identity = identity
  if (!state.hitstop) clock.time += Math.max(0, state.frame - clock.previousFrame)
  clock.previousFrame = state.frame
  return reset
}

function observeDischarge(
  clock: Clock,
  context: { state: FightState; side: FightSide; actual: AuraConcentration | null },
) {
  const { state, side, actual } = context
  if (!actual && clock.prior && confirmedDischarge(state, side, clock.sequence))
    clock.release = { aura: clock.prior, at: clock.time, move: state[side].attack?.moveId }
  clock.sequence = state.impact?.sequence ?? clock.sequence
  if (actual || releaseFinished(clock, { state, side })) clock.release = null
  clock.prior = actual
}

function confirmedDischarge(state: FightState, side: FightSide, previous: number): boolean {
  const impact = state.impact
  return Boolean(
    impact &&
    impact.sequence !== previous &&
    impact.attacker === side &&
    !impact.avoided &&
    !impact.invulnerable,
  )
}

function releaseFinished(clock: Clock, context: { state: FightState; side: FightSide }): boolean {
  const fighter = context.state[context.side]
  const expired = clock.time - (clock.release?.at ?? -Infinity) >= 6
  return (
    expired ||
    fighter.nen.mode === 'zetsu' ||
    fighter.auraExhausted ||
    Boolean(clock.release && fighter.attack?.moveId !== clock.release.move)
  )
}
