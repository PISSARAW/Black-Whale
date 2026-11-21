import type { AuraConcentration } from './nenConcentration'
import { fightStrikeLimb } from './fightStrikeLimb'
import type { FightNenZone, FightSide, FightState } from './types'

export const RYU_VISUAL_TRANSFER_FRAMES = 8

interface VisualTransfer {
  key: string
  from: AuraConcentration
  to: AuraConcentration
  zone: FightNenZone
  since: number
  duration: number
}

interface Clock {
  previousFrame: number
  time: number
  since: number
  key: string
  identity: string
  prior: AuraConcentration | null
  release: { aura: AuraConcentration; at: number; move?: string } | null
  sequence: number
  transfer: boolean
  visualTransfer: VisualTransfer | null
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
    transfer: false,
    visualTransfer: null,
  }
  return (state: FightState, actual: AuraConcentration | null) => {
    const reset = advanceClock(clock, state, side)
    observeDischarge(clock, { state, side, actual })
    const visual = visualTransferFrame(clock, { state, side, actual })
    const concentration = shownConcentration(clock, visual?.concentration, actual)
    const strength = releaseStrength(clock)
    observeConcentrationKey(clock, concentration, reset)
    clock.transfer = transferRunning(clock, state, side)
    return {
      concentration,
      strength,
      time: clock.time,
      age: clock.time - clock.since,
      visualTransfer: visual?.timing,
    }
  }
}

function shownConcentration(
  clock: Clock,
  visual: AuraConcentration | undefined,
  actual: AuraConcentration | null,
) {
  return visual ?? actual ?? clock.release?.aura ?? null
}

function releaseStrength(clock: Clock) {
  return clock.release ? Math.max(0, 1 - (clock.time - clock.release.at) / 6) : 1
}

function observeConcentrationKey(
  clock: Clock,
  concentration: AuraConcentration | null,
  reset: boolean,
) {
  const next = JSON.stringify(concentration)
  if (next === clock.key) return
  clock.key = next
  if (!clock.transfer) clock.since = reset ? -Infinity : clock.time
}

function transferRunning(clock: Clock, state: FightState, side: FightSide) {
  return Boolean(state[side].nenTransfer || clock.visualTransfer)
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
      transfer: false,
      visualTransfer: null,
    })
  }
  clock.identity = identity
  if (!state.hitstop) clock.time += Math.max(0, state.frame - clock.previousFrame)
  clock.previousFrame = state.frame
  return reset
}

function visualTransferFrame(
  clock: Clock,
  context: { state: FightState; side: FightSide; actual: AuraConcentration | null },
) {
  const fighter = context.state[context.side]
  observeVisualTransfer(clock, fighter, context.actual)
  const visual = clock.visualTransfer
  if (!visual) return null
  const frame = sampleVisualTransfer(visual, clock.time)
  if (frame.timing.age >= visual.duration) clock.visualTransfer = null
  return frame
}

function observeVisualTransfer(
  clock: Clock,
  fighter: FightState[FightSide],
  actual: AuraConcentration | null,
) {
  const transfer = fighter.nenTransfer
  if (!transfer) {
    if (!actual) clock.visualTransfer = null
    return
  }
  const key = `${transfer.zone}:${Boolean(transfer.ko)}:${JSON.stringify(transfer.from)}:${JSON.stringify(transfer.to)}`
  if (clock.visualTransfer?.key === key) return
  const focus = dominantZone(transfer.from)
  const visibleFrom = clock.visualTransfer
    ? sampleVisualTransfer(clock.visualTransfer, clock.time).concentration
    : null
  clock.visualTransfer = {
    key,
    zone: transfer.zone,
    since: visibleFrom ? clock.time : clock.time - transfer.age,
    duration: Math.max(RYU_VISUAL_TRANSFER_FRAMES, transfer.duration),
    from: visibleFrom ?? {
      technique: 'ryu',
      shares: transfer.from,
      limb: fightStrikeLimb(fighter, focus),
    },
    to: {
      technique: transfer.ko ? 'ko' : 'ryu',
      shares: transfer.to,
      limb: fightStrikeLimb(fighter, transfer.zone),
    },
  }
}

function sampleVisualTransfer(visual: VisualTransfer, time: number) {
  const age = Math.min(visual.duration, Math.max(0, time - visual.since))
  const p = age / visual.duration
  const weight = p * p * (3 - 2 * p)
  const concentration: AuraConcentration = {
    technique: p >= 1 ? visual.to.technique : visual.from.technique,
    limb: p < 0.5 ? visual.from.limb : visual.to.limb,
    shares: {
      head: mix(visual.from.shares.head, visual.to.shares.head, weight),
      torso: mix(visual.from.shares.torso, visual.to.shares.torso, weight),
      hands: mix(visual.from.shares.hands, visual.to.shares.hands, weight),
      feet: mix(visual.from.shares.feet, visual.to.shares.feet, weight),
    },
  }
  const timing = { age, travelFrames: visual.duration, zone: visual.zone }
  return { concentration, timing }
}

function dominantZone(shares: Record<FightNenZone, number>): FightNenZone {
  return (Object.keys(shares) as FightNenZone[]).reduce((a, b) => (shares[a] >= shares[b] ? a : b))
}

function mix(from: number, to: number, weight: number) {
  return from + (to - from) * weight
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
