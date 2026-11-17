import { initialReplayState, executeReplayPacket } from './fightReplayCommands'
import { performTrainingAction } from './trainingAction'
import { tickFight } from './engine'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'
import type { FightReplay } from './fightReplayTypes'

export function probeRecoveryLink(options: { replay: FightReplay; from: MoveSlot; to: MoveSlot }) {
  const { free, before } = recoveryBoundary(options.replay, options.from)
  const rows = [
    attempt({ initial: before, to: options.to, offset: -1, combo: free.opponent.comboHits }),
  ]
  for (let offset = 0; offset <= 40; offset++) {
    const row = attempt({ initial: free, to: options.to, offset, combo: free.opponent.comboHits })
    rows.push(row)
    if (!row.guaranteed) break
  }
  const firstFailure = rows.find((row) => row.offset >= 0 && !row.guaranteed)?.offset ?? null
  return {
    fighter: free.player.id,
    from: options.from,
    to: options.to,
    freeFrame: free.frame,
    lastGuaranteedOffset: firstFailure === null ? null : firstFailure - 1,
    firstFailure,
    pass:
      rows.find((row) => row.offset === 0)?.guaranteed === true &&
      firstFailure !== null &&
      !rows[0].startedImmediately,
    rows,
  }
}

function recoveryBoundary(replay: FightReplay, slot: MoveSlot) {
  let state = initialReplayState(replay.setup)
  let before: FightState | null = null
  const source = `${state.player.id}:${slot}`
  for (const packet of replay.packets) {
    if (state.player.attack?.moveId === source) before = structuredClone(state)
    if (before && !state.player.attack && state.opponent.hitStun > 0) return { free: state, before }
    state = executeReplayPacket(state, packet)
  }
  throw Error(`Recovery link boundary not found: ${source}`)
}

function step(state: FightState) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: { ...EMPTY_INPUT, guard: true },
  })
}

function attempt(options: { initial: FightState; to: MoveSlot; offset: number; combo: number }) {
  let state = structuredClone(options.initial)
  for (let tick = 0; tick < options.offset; tick++) state = step(state)
  const target = `${state.player.id}:${options.to}`
  const previous = state.impact?.sequence
  state = performTrainingAction({
    state,
    side: 'player',
    action: combatRouteAction(options.to),
    input: combatRouteInput(options.to, state.player.facing),
  })
  const startedImmediately =
    state.player.attack?.moveId === target && state.player.attack.frame === 0
  for (let tick = 0; tick < 120 && state.impact?.sequence === previous; tick++) state = step(state)
  return {
    offset: options.offset,
    startedImmediately,
    ...linkContact(state, previous, options.combo),
  }
}

function linkContact(state: FightState, previous: number | undefined, combo: number) {
  const impact = state.impact
  if (!impact || impact.sequence === previous || impact.attacker !== 'player')
    return { connected: false, blocked: false, combo: null, guaranteed: false }
  return {
    connected: true,
    blocked: impact.blocked,
    combo: impact.comboHits,
    guaranteed:
      !impact.blocked && !impact.parried && !impact.avoided && impact.comboHits === combo + 1,
  }
}
