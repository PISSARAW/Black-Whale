import { createHisokaAgent, type HisokaDecision } from './hisokaAgent'
import { createFight, tickFight, performAuraAttack } from '../../src/lib/fighting/engine'
import { performArsenalAction } from '../../src/lib/fighting/arsenalExecution'
import {
  createReplayRecorder,
  type FightReplayRecorder,
} from '../../src/lib/fighting/fightReplayRecorder'
import {
  applyReplayCommand,
  executeReplayPacket,
  initialReplayState,
} from '../../src/lib/fighting/fightReplayCommands'
import { panelReplayCommand } from '../../src/lib/fighting/fightReplayPanels'
import { packReplayInput } from '../../src/lib/fighting/fightReplayInput'
import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
import { decodeFightReplay } from '../../src/lib/fighting/fightReplayCodec'
import type {
  FightReplay,
  ReplayCommand,
  ReplayPacket,
} from '../../src/lib/fighting/fightReplayTypes'
import type { FightState, FightSide } from '../../src/lib/fighting/types'

/** Native Machi CPU vs a player-side reactive Hisoka agent, through legal commands only. */
export function simulateAiDuel(seed = 20261118) {
  let state = createFight('hisoka', 'machi', {
    mode: 'versus-ai',
    formatId: 'knockout',
    environment: { stageId: 'royal-salon', arenaInteractions: false },
  })
  state = { ...state, rng: seed >>> 0 }
  const recorder = createReplayRecorder(state)
  if (!recorder) throw Error('AI duel cannot be recorded')
  const agent = createHisokaAgent(seed ^ 0x4849534f)
  const decisions: { frame: number; reason: string; accepted: boolean }[] = []
  const events: ReturnType<typeof observe>[] = []
  const audioStates: FightState[] = []
  let pending: ReplayCommand[] = [{ kind: 'start' }]
  for (let step = 0; step < 60 * 600 && !state.matchWinner; step++) {
    const before = state
    const commands = pending
    pending = []
    state = commands.reduce(applyReplayCommand, state)
    const plan = agent(state)
    const prior = state
    const applied = applyDecision(state, plan)
    commands.push(...applied.commands)
    state = applied.state
    if (plan.reason)
      decisions.push({ frame: state.frame, reason: plan.reason, accepted: applied.accepted })
    state = tickFight(state, plan.input, { dt: 1 / 60, ai: true })
    const packet: ReplayPacket = [1 / 60, packReplayInput(plan.input), 0, commands]
    recorder.append(before, packet, state)
    if (recorder.error) throw Error(`AI recording: ${recorder.error}`)
    if (notable(prior, state)) events.push(observe(state))
    audioStates.push(state)
    if (state.phase === 'finished' && !state.matchWinner) pending.push({ kind: 'round' })
  }
  return finishDuel(state, recorder, { seed, decisions, events, audioStates })
}

interface Telemetry {
  seed: number
  decisions: { frame: number; reason: string; accepted: boolean }[]
  events: ReturnType<typeof observe>[]
  audioStates: FightState[]
}

function applyDecision(state: FightState, plan: HisokaDecision) {
  const commands: ReplayCommand[] = []
  let accepted = false
  if (plan.command) {
    commands.push(plan.command)
    state = applyReplayCommand(state, plan.command)
    accepted = state.commandFeedback?.player?.outcome !== 'refused'
  }
  if (plan.arsenal) {
    const changed = performArsenalAction(
      { state, side: 'player', command: plan.arsenal },
      performAuraAttack,
    )
    if (changed !== state) commands.push(panelReplayCommand(state, changed))
    accepted = changed !== state
    state = changed
  }
  return { state, commands, accepted }
}

function verifyReplay(replay: FightReplay): FightState {
  let state = initialReplayState(replay.setup)
  const checkpoints = new Map(replay.checkpoints.map((row) => [row.packet, row.hash]))
  for (const [index, packet] of replay.packets.entries()) {
    state = executeReplayPacket(state, packet)
    const expected = checkpoints.get(index + 1)
    if (expected && expected !== fightReplayHash(state))
      throw Error(`Replay divergence at ${index + 1}`)
  }
  return state
}

function finishDuel(state: FightState, recorder: FightReplayRecorder, data: Telemetry) {
  const captured = recorder.snapshot()
  if (!captured?.complete || !state.matchWinner) throw Error('Autonomous duel did not finish')
  const replay = decodeFightReplay(JSON.stringify(captured))
  const verified = verifyReplay(replay)
  if (fightReplayHash(verified) !== fightReplayHash(state))
    throw Error('Final AI duel hash mismatch')
  return {
    replay,
    audioStates: data.audioStates,
    report: {
      method:
        'Reactive Hisoka agent vs native Machi CPU; commands and fixed ticks verified by native replay',
      seed: data.seed,
      stage: 'royal-salon',
      duration: replay.duration,
      winner: state.matchWinner,
      rounds: state.roundsWon,
      finalHash: fightReplayHash(state),
      checkpoints: replay.checkpoints.length,
      decisions: data.decisions,
      events: data.events,
      moves: collectMoves(data.events),
    },
  }
}

function notable(before: FightState, after: FightState): boolean {
  return (
    before.impact?.sequence !== after.impact?.sequence ||
    before.phase !== after.phase ||
    newMove(before, after, 'player') ||
    newMove(before, after, 'opponent')
  )
}
function newMove(before: FightState, after: FightState, side: FightSide): boolean {
  return Boolean(
    after[side].attack &&
    (before[side].attack?.moveId !== after[side].attack?.moveId ||
      after[side].attack!.frame < (before[side].attack?.frame ?? Infinity)),
  )
}
function observe(state: FightState) {
  return {
    frame: state.frame,
    round: state.roundNumber,
    time: state.time,
    player: actor(state, 'player'),
    opponent: actor(state, 'opponent'),
    impact: state.impact,
  }
}
function actor(state: FightState, side: FightSide) {
  const fighter = state[side]
  return {
    id: fighter.id,
    health: fighter.health,
    aura: fighter.aura,
    move: fighter.attack?.moveId ?? null,
    comboReceived: fighter.comboHits,
    nen: fighter.nen,
    x: fighter.x,
    y: fighter.y,
  }
}
function collectMoves(events: ReturnType<typeof observe>[]) {
  return Object.fromEntries(
    (['player', 'opponent'] as const).map((side) => [
      side,
      [...new Set(events.map((event) => event[side].move).filter(Boolean))],
    ]),
  )
}
