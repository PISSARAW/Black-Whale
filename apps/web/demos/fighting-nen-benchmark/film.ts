import { createFight, tickFight } from '../../src/lib/fighting/engine'
import { createFastController } from '../../src/lib/fighting/qwen/execution'
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
/** A reactive local player controller fights the native opponent CPU; the identical seeded protocol before and after, without scripted contacts or resource resets. */
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
  const plan: TacticalPlan = { goal: 'pressure', nen: 'ryu', move: 'none' }
  for (let frame = 0; frame < 60 * 12; frame++) {
    const before = state
    const commands: ReplayCommand[] = frame === 0 ? [{ kind: 'start' }] : []
    if (state.phase === 'finished' && !state.matchWinner) commands.push({ kind: 'round' })
    state = commands.reduce(applyReplayCommand, state)
    const decision = controller(state, plan)
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
    timeline: bout.states
      .filter((_, i) => i % 60 === 0)
      .map((s) => ({
        frame: s.frame,
        gap: Math.abs(s.player.x - s.opponent.x),
        player: {
          aura: s.player.aura,
          goal: s.player.nenTactics?.goal,
          move: s.player.attack?.moveId,
          paper: s.player.kallutoPaper,
        },
        opponent: {
          aura: s.opponent.aura,
          goal: s.opponent.nenTactics?.goal,
          move: s.opponent.attack?.moveId,
        },
      })),
    player: bout.player,
    opponent: bout.opponent,
    seconds: bout.states.length / 60,
    verified: bout.verified,
    moves: { player: moves('player'), opponent: moves('opponent') },
    impacts: [...impacts.values()],
    conversions: {
      player: Math.max(...bout.states.map((s) => s.player.nenConversionCount ?? 0)),
      opponent: Math.max(...bout.states.map((s) => s.opponent.nenConversionCount ?? 0)),
    },
    maxCombo: Math.max(...bout.states.flatMap((s) => [s.player.comboHits, s.opponent.comboHits])),
    transfers: bout.states.filter((s) => s.player.nenTransfer || s.opponent.nenTransfer).length,
    ko: bout.states.filter((s) => s.player.nen.ko || s.opponent.nen.ko).length,
    ryu: bout.states.filter(
      (s) => Object.keys(s.player.nen.ryu).length || Object.keys(s.opponent.nen.ryu).length,
    ).length,
  }
}
