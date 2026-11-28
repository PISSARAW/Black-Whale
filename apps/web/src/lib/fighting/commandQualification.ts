import { get } from 'svelte/store'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { initialReplayState, executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import { canStartFighterAttack } from './fighterAttacks'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { combatRouteContactId } from './combatRouteContacts'
import { INPUT_BUFFER_FRAMES } from './fightClock'
import { moveForSlot, canUseMovesetMove } from './movesets'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightSide, type FightState, type MoveSlot } from './types'
import { packReplayInput } from './fightReplayInput'
import type { FightReplay } from './fightReplayTypes'

export function qualificationState(
  replay: FightReplay,
  options: { side: FightSide; mirrored: boolean },
) {
  const initial = initialReplayState(replay.setup)
  const player = options.side === 'player' ? initial.player : initial.opponent
  const opponent = options.side === 'player' ? initial.opponent : initial.player
  const facing = options.mirrored ? (-1 as const) : (1 as const)
  const target = options.side === 'player' ? 'opponent' : 'player'
  return {
    ...initial,
    player: { ...player },
    opponent: { ...opponent },
    [options.side]: { ...initial.player, x: 50 - facing * 6, facing },
    [target]: { ...initial.opponent, x: 50, facing: facing === 1 ? (-1 as const) : (1 as const) },
  } as FightState
}

interface QueueProbeOptions {
  initial: FightState
  side: FightSide
  hz: number
  stun: number
  hitstop?: number
  cancel?: boolean
  slot?: MoveSlot
}

function queueInitialState(options: QueueProbeOptions) {
  return {
    ...options.initial,
    hitstop: options.hitstop ?? 0,
    [options.side]: {
      ...options.initial[options.side],
      hitStun: options.stun,
      ...(options.slot === 'airLight' ? { y: 8, velocityY: -1 } : {}),
    },
  }
}

export function probeCommandQueue(options: QueueProbeOptions) {
  let elapsed = 0
  const runtime = createFightMatchRuntime(() => elapsed, { record: false })
  let state = queueInitialState(options)
  runtime.begin(state)
  const slot = options.slot ?? 'standingHeavy'
  const expectedMove = `${state[options.side].id}:${slot}`
  let actualMove: string | null = null
  runtime.observeFrames((next) => {
    actualMove ??= combatRouteContactId(next[options.side].attack?.moveId) ?? null
  })
  runtime.enqueue(state, {
    kind: 'move',
    side: options.side,
    action: combatRouteAction(slot),
    input: packReplayInput(combatRouteInput(slot, state[options.side].facing)),
  })
  if (options.cancel) runtime.clear()
  for (let tick = 0; tick < options.hz / 2; tick++) {
    elapsed += 1000 / options.hz
    state = runtime.advance(state, EMPTY_INPUT, { dt: 1 / options.hz, opponentInput: EMPTY_INPUT })
  }
  const attempt = get(runtime.diagnostics)[0]
  const expected = expectedQueueOutcome(options)
  return {
    hz: options.hz,
    stun: options.stun,
    hitstop: options.hitstop ?? 0,
    side: options.side,
    outcome: attempt.outcome,
    queueMs: attempt.queueMs ?? null,
    executedFrame: attempt.executedFrame ?? null,
    expected,
    expectedMove,
    actualMove,
    pass: attempt.outcome === expected && (expected !== 'executed' || actualMove === expectedMove),
  }
}

function expectedQueueOutcome(options: QueueProbeOptions) {
  if (options.cancel) return 'cancelled'
  return options.stun > INPUT_BUFFER_FRAMES ? 'refused' : 'executed'
}

/** Samples actual timeline states on both sides of each authored cancel/recovery boundary. */
export function probeRouteWindows(replay: FightReplay) {
  let state = initialReplayState(replay.setup)
  const observations: {
    frame: number
    attackFrame: number
    from: string
    to: MoveSlot
    admitted: boolean
    started: boolean
    hitstop: number
    confirmed: boolean
  }[] = []
  for (const packet of replay.packets) {
    const attack = state.player.attack
    if (attack) {
      for (const slot of [
        'standingHeavy',
        'forwardLight',
        'lowHeavy',
        'forwardHeavy',
        'forwardSpecial',
        'neutralSpecial',
        'finisher',
      ] as const)
        if (moveForSlot(state.player.id, slot)) observations.push(windowAttempt(state, slot))
    }
    state = executeReplayPacket(state, packet)
  }
  return { finalHash: fightReplayHash(state), observations }
}

function windowAttempt(state: FightState, slot: MoveSlot) {
  const move = moveForSlot(state.player.id, slot)!
  const admitted =
    canStartFighterAttack(state.player, move.kind, move.id) &&
    canUseMovesetMove(state, 'player', move)
  const isolated = structuredClone(state)
  const previousAttack = isolated.player.attack
  const after = performTrainingAction({
    state: isolated,
    side: 'player',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.player.facing),
  })
  return {
    frame: state.frame,
    attackFrame: state.player.attack!.frame,
    from: state.player.attack!.moveId ?? state.player.attack!.kind,
    to: slot,
    admitted,
    started:
      after.player.attack !== previousAttack &&
      combatRouteContactId(after.player.attack?.moveId) === move.id &&
      after.player.attack?.frame === 0,
    hitstop: state.hitstop,
    confirmed: Boolean(state.player.attack?.confirmedHit),
  }
}
