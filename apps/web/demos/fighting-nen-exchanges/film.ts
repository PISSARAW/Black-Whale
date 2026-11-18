import { createFight, tickFight } from '../../src/lib/fighting/engine'
import { createFastController } from '../../src/lib/fighting/qwen/execution'
import { observeCombat } from '../../src/lib/fighting/qwen/observation'
import { offeredMoves } from '../../src/lib/fighting/qwen/catalogue'
import { createReplayRecorder } from '../../src/lib/fighting/fightReplayRecorder'
import {
  applyReplayCommand,
  initialReplayState,
  executeReplayPacket,
} from '../../src/lib/fighting/fightReplayCommands'
import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
import { packReplayInput } from '../../src/lib/fighting/fightReplayInput'
import type { FightState } from '../../src/lib/fighting/types'
import type { ReplayCommand, ReplayPacket } from '../../src/lib/fighting/fightReplayTypes'
import type { TacticalPlan } from '../../src/lib/fighting/qwen/protocol'

const PAIRS = [
  ['hisoka', 'machi'],
  ['kurapika', 'phinks'],
  ['kalluto', 'franklin'],
] as const
/** A reactive local player controller fights the native opponent CPU; no scripted contacts or resource resets. */
export function makeNenBout(index: number) {
  const [player, opponent] = PAIRS[index]
  let state = createFight(player, opponent, {
    mode: 'versus-ai',
    formatId: 'knockout',
    environment: { stageId: 'royal-salon', arenaInteractions: false },
  })
  state = { ...state, rng: 20261118 + index * 47 }
  const recorder = createReplayRecorder(state)!
  const controller = createFastController('player', 117 + index)
  const states: FightState[] = []
  const decisions: string[] = []
  let plan: TacticalPlan = { goal: 'pressure', nen: 'ryu', move: 'none' }
  let random = 71 + index
  for (let frame = 0; frame < 60 * 20; frame++) {
    const before = state
    const commands: ReplayCommand[] = frame === 0 ? [{ kind: 'start' }] : []
    if (state.phase === 'finished' && !state.matchWinner) commands.push({ kind: 'round' })
    state = commands.reduce(applyReplayCommand, state)
    if (frame % 30 === 0) {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0
      plan = reactivePlan(state, random / 4294967296)
    }
    // Releasing Aura after a charged input is the ordinary paid Ko command.
    const held = state.player.attack?.auraCharged ? { ...plan, nen: 'ten' as const } : plan
    const decision = controller(state, held)
    const gap = Math.abs(state.player.x - state.opponent.x)
    if (
      state.player.id === 'kurapika' &&
      !decision.command &&
      !state.player.attack &&
      (state.player.defensiveKo ? state.player.aura > 0 : state.player.aura >= 24) &&
      state.opponent.pose === 'heavy' &&
      gap < 13
    ) {
      decision.input = {
        ...decision.input,
        left: false,
        right: false,
        aura: true,
        guard: true,
        gyo: true,
        focusHands: false,
        focusTorso: true,
      }
    }
    if (decision.command) {
      commands.push(decision.command)
      state = applyReplayCommand(state, decision.command)
      decisions.push(`${state.frame}:${decision.command.action}`)
    }
    state = tickFight(state, decision.input, { dt: 1 / 60, ai: true })
    const packet: ReplayPacket = [1 / 60, packReplayInput(decision.input), 0, commands]
    recorder.append(before, packet, state)
    if (recorder.error) throw Error(recorder.error)
    states.push(state)
    if (state.matchWinner) break
  }
  const replay = recorder.snapshot()!
  let verified = initialReplayState(replay.setup)
  const checkpoints = new Map(replay.checkpoints.map((c) => [c.packet, c.hash]))
  for (const [i, packet] of replay.packets.entries()) {
    verified = executeReplayPacket(verified, packet)
    if (checkpoints.has(i + 1) && fightReplayHash(verified) !== checkpoints.get(i + 1))
      throw Error(`Replay mismatch ${i + 1}`)
  }
  return {
    player,
    opponent,
    states,
    replay,
    decisions,
    verified: fightReplayHash(verified) === fightReplayHash(state),
  }
}
function reactivePlan(state: FightState, roll: number): TacticalPlan {
  const observation = observeCombat(state, 'player')
  const moves = offeredMoves(observation)
  const hisokaSlot = observation.self.linked ? 'forwardSpecial' : 'neutralSpecial'
  const choice =
    state.player.id === 'hisoka'
      ? moves.find((move) => move.slot === hisokaSlot)
      : roll > 0.6
        ? moves[Math.floor(roll * moves.length)]
        : undefined
  const hurt = observation.self.aura < 22
  const distant = state.player.id === 'kalluto'
  const openingReserve =
    state.player.id === 'kurapika' &&
    observation.self.health === 100 &&
    observation.self.aura < 75 &&
    (observation.enemy?.distance ?? 0) > 20
  const nen = openingReserve
    ? 'zetsu'
    : state.player.id === 'kurapika' && observation.self.aura > 68
      ? 'ko'
      : 'ryu'
  return {
    goal: openingReserve || hurt ? 'recover' : distant ? 'zone' : 'pressure',
    nen,
    move: choice?.slot ?? 'none',
  }
}
export function boutEvidence(bout: ReturnType<typeof makeNenBout>) {
  const moves = (side: 'player' | 'opponent') => [
    ...new Set(bout.states.map((s) => s[side].attack?.moveId).filter(Boolean)),
  ]
  const impacts = new Map(
    bout.states
      .filter((s) => s.impact)
      .map((s) => [`${s.roundNumber}:${s.impact!.sequence}`, s.impact!]),
  )
  return {
    player: bout.player,
    opponent: bout.opponent,
    seconds: bout.states.length / 60,
    verified: bout.verified,
    moves: { player: moves('player'), opponent: moves('opponent') },
    impacts: [...impacts.values()],
    maxCombo: Math.max(...bout.states.flatMap((s) => [s.player.comboHits, s.opponent.comboHits])),
    transfers: bout.states.filter((s) => s.player.nenTransfer || s.opponent.nenTransfer).length,
    ko: bout.states.filter((s) => s.player.nen.ko || s.opponent.nen.ko).length,
    ryu: bout.states.filter(
      (s) => Object.keys(s.player.nen.ryu).length || Object.keys(s.opponent.nen.ryu).length,
    ).length,
  }
}
