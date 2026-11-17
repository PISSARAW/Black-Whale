import { tickFight } from '../engine'
import { FIXED_STEP } from '../fightClock'
import { unpackReplayInput } from '../fightReplayInput'
import { EMPTY_INPUT, type FightState } from '../types'
import { fighterVisual, type FightVisualPrediction } from '../fightVisualPrediction'
import { applyPvpCommand } from './commands'
import { createPredictionHistory } from './predictionHistory'
import { predictionEligible as eligible, sameControlledBody } from './predictionPolicy'
import type { PvpCommand, PvpInputPacket, PvpView } from './types'

export const MAX_PREDICTION_FRAMES = 12
export const PREDICTION_STALE_MS = 250
function authoritativeReaction(state: FightState) {
  const player = state.player
  return (
    state.hitstop > 0 ||
    player.hitStun > 0 ||
    player.blockStun > 0 ||
    player.knockdownFrames > 0 ||
    player.health <= 0
  )
}
/** Owner simulation is private and provisional. Only a small visual projection can leave this module. */
export function createPvpPrediction(clock: () => number = () => performance.now()) {
  const history = createPredictionHistory()
  let authority: FightState | null = null
  let simulation: FightState | null = null
  let localFrame = 0
  let baseFrame = 0
  let accumulator = 0
  let input = 0
  let acceptedAt = 0
  let round = 0
  let inputEpoch = -1
  let unknownAck = -1
  let offset = { x: 0, y: 0 }
  let remoteVelocity = { x: 0, y: 0 }
  let serverTick = 0
  let steps = 0
  let corrections = 0
  let reconciliations = 0
  let replayedFrames = 0
  function reset(state: FightState | null = null) {
    history.clear()
    authority = state
    simulation = state && eligible(state) ? structuredClone(state) : null
    localFrame = 0
    baseFrame = 0
    accumulator = 0
    input = 0
    remoteVelocity = { x: 0, y: 0 }
    offset = { x: 0, y: 0 }
  }
  function step(frame: number) {
    if (!simulation) return
    for (const command of history.commands(frame, baseFrame)) {
      simulation = applyPvpCommand(simulation, 'player', command)
      if (!eligible(simulation)) {
        simulation = null
        return
      }
    }
    simulation = tickFight(simulation, unpackReplayInput(history.input(frame, input)), {
      dt: FIXED_STEP,
      opponentInput: EMPTY_INPUT,
      ai: false,
    })
    if (!eligible(simulation)) simulation = null
    steps++
  }
  function projection(): FightVisualPrediction | null {
    if (!authority || !simulation || !eligible(authority)) return null
    if (clock() - acceptedAt > PREDICTION_STALE_MS || authoritativeReaction(authority)) return null
    if (!safeVisual(simulation) || !sameControlledBody(authority, simulation)) return null
    const player = fighterVisual(authority.player, simulation.player)
    player.x += offset.x
    player.y = Math.max(0, player.y + offset.y)
    const age = Math.min(2, Math.max(0, (clock() - acceptedAt) / (FIXED_STEP * 1000)))
    return {
      source: authority,
      player,
      opponent: {
        x: Math.min(93, Math.max(7, authority.opponent.x + remoteVelocity.x * age)),
        y: Math.max(0, authority.opponent.y + remoteVelocity.y * age),
      },
    }
  }
  function rebuild() {
    simulation =
      authority && eligible(authority)
        ? structuredClone({ ...authority, mode: 'versus-local' })
        : null
    const target = Math.min(localFrame, baseFrame + MAX_PREDICTION_FRAMES)
    for (let frame = baseFrame + 1; frame <= target; frame++) {
      step(frame)
      replayedFrames++
    }
  }
  function reserveControls() {
    if (!authority || localFrame - baseFrame < MAX_PREDICTION_FRAMES) return
    if (clock() - acceptedAt > PREDICTION_STALE_MS) return
    const before = projection()
    baseFrame = localFrame - MAX_PREDICTION_FRAMES + 4
    rebuild()
    offset = correctionOffset(before, projection(), false)
  }
  return {
    command(command: PvpCommand) {
      reserveControls()
      return history.command(command, localFrame + 1)
    },
    sent(packet: PvpInputPacket, ids: number[]) {
      history.sent(packet, ids, localFrame)
    },
    accept(state: FightState, view: PvpView) {
      const before = projection()
      const previous = authority
      const tickDelta = view.tick - serverTick
      const acknowledgedFrame = history.acknowledge(view.appliedSequence)
      const changedRound = roundChanged(state, round) || view.inputEpoch !== inputEpoch
      const missingAck = acknowledgedFrame === undefined && view.appliedSequence !== unknownAck
      if (needsHistoryReset(changedRound, view.appliedSequence, missingAck)) {
        reset(state)
        unknownAck = view.appliedSequence
      }
      round = state.roundNumber
      inputEpoch = view.inputEpoch
      reconciliations++
      serverTick = view.tick
      baseFrame =
        acknowledgedFrame === undefined
          ? (history.firstFrame ?? localFrame)
          : acknowledgedFrame + Math.max(0, view.tick - view.appliedAtTick)
      // Reserve four local ticks for fresh controls between pushes. A delayed receipt
      // may compress this visual window; only appliedSequence retires an intent.
      baseFrame = Math.max(baseFrame, localFrame - MAX_PREDICTION_FRAMES + 4)
      localFrame = Math.max(localFrame, baseFrame)
      authority = state
      acceptedAt = clock()
      remoteVelocity = changedRound ? { x: 0, y: 0 } : remoteMotion(previous, state, tickDelta)
      rebuild()
      offset = { x: 0, y: 0 }
      offset = correctionOffset(before, projection(), changedRound || authoritativeReaction(state))
      if (Math.abs(offset.x) + Math.abs(offset.y) > 0.001) corrections++
    },
    advance(dt: number, nextInput: number) {
      if (nextInput !== input) reserveControls()
      input = nextInput
      accumulator += Math.min(0.05, Math.max(0, dt))
      let count = 0
      while (accumulator + 1e-9 >= FIXED_STEP && count++ < 3) {
        accumulator = Math.max(0, accumulator - FIXED_STEP)
        history.record(++localFrame, input)
        if (
          localFrame - baseFrame <= MAX_PREDICTION_FRAMES &&
          clock() - acceptedAt <= PREDICTION_STALE_MS
        )
          step(localFrame)
      }
      const fade = Math.exp(-Math.max(0, dt) * 60)
      offset.x *= fade
      offset.y *= fade
      return projection()
    },
    get current() {
      return projection()
    },
    clear: () => reset(),
    get stats() {
      return {
        steps,
        corrections,
        reconciliations,
        replayedFrames,
        pending: history.pending,
        authorityAgeMs: clock() - acceptedAt,
        backlogFrames: Math.max(0, localFrame - baseFrame),
        available: Boolean(projection()),
        leadFrames: Math.min(MAX_PREDICTION_FRAMES, Math.max(0, localFrame - baseFrame)),
      }
    },
  }
}
function correctionOffset(
  before: FightVisualPrediction | null,
  after: FightVisualPrediction | null,
  snap: boolean,
) {
  if (snap || !before || !after) return { x: 0, y: 0 }
  const x = before.player.x - after.player.x
  const y = before.player.y - after.player.y
  return Math.abs(x) + Math.abs(y) <= 3 ? { x, y } : { x: 0, y: 0 }
}

function roundChanged(state: FightState, round: number) {
  return state.roundNumber !== round || state.phase !== 'fighting'
}
function needsHistoryReset(changedRound: boolean, sequence: number, missing: boolean) {
  return changedRound || (sequence > 0 && missing)
}
function remoteMotion(previous: FightState | null, current: FightState, ticks: number) {
  if (!previous || ticks <= 0) return { x: 0, y: 0 }
  const x = current.opponent.x - previous.opponent.x
  if (Math.abs(x) >= 10) return { x: 0, y: 0 }
  return { x: x / ticks, y: (current.opponent.y - previous.opponent.y) / ticks }
}

function safeVisual(state: FightState) {
  if (state.phase !== 'fighting' || state.player.health <= 0) return false
  return !['hit', 'down', 'ko', 'wakeup', 'victory'].includes(state.player.pose)
}
