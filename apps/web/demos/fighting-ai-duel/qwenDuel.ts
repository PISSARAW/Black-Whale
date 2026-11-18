import { get } from 'svelte/store'
import { createFight } from '../../src/lib/fighting/engine'
import { createFightMatchRuntime } from '../../src/lib/fighting/fightMatchRuntime'
import { createQwenDuel, type QwenTransport } from '../../src/lib/fighting/qwen/duel'
import { initialReplayState, executeReplayPacket } from '../../src/lib/fighting/fightReplayCommands'
import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
import { EMPTY_INPUT, type FightState } from '../../src/lib/fighting/types'
import type { FightReplay } from '../../src/lib/fighting/fightReplayTypes'

/** Real wall-clock match: inference runs concurrently while the unchanged fixed-tick engine advances. */
export async function testQwenDuel(options: {
  transport: QwenTransport
  progress?: (value: unknown) => void
  maxSeconds?: number
}) {
  const qwen = createQwenDuel({ transport: options.transport })
  const match = createFightMatchRuntime(undefined, { qwen })
  let state = createFight('hisoka', 'machi', {
    mode: 'versus-local',
    formatId: 'knockout',
    environment: { stageId: 'royal-salon', arenaInteractions: false },
  })
  match.begin(state)
  state = match.apply(state, { kind: 'start' })
  qwen.setEnabled(true)
  const moves = { player: new Set<string>(), opponent: new Set<string>() }
  const hits = { player: 0, opponent: 0 }
  let frames = 0
  match.observeFrames((next) => {
    frames++
    for (const side of ['player', 'opponent'] as const) {
      const attack = next[side].attack
      if (attack?.moveId) moves[side].add(attack.moveId)
    }
  })
  const start = performance.now()
  let last = start
  let reportAt = start + 10000
  let impact: number | undefined
  try {
    while (trialActive(state, { start, maxSeconds: options.maxSeconds })) {
      await new Promise((resolve) => setTimeout(resolve, 1000 / 60))
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      state = match.advance(state, EMPTY_INPUT, { dt, opponentInput: EMPTY_INPUT })
      if (state.impact && state.impact.sequence !== impact) {
        impact = state.impact.sequence
        hits[state.impact.attacker]++
      }
      if (state.phase === 'finished' && !state.matchWinner)
        state = match.apply(state, { kind: 'round' })
      if (now >= reportAt) {
        reportAt = now + 10000
        options.progress?.({
          seconds: Math.round((now - start) / 1000),
          round: state.roundNumber,
          health: [state.player.health, state.opponent.health],
          aura: [state.player.aura, state.opponent.aura],
          qwen: get(qwen),
        })
      }
    }
    if (!state.matchWinner) throw Error('Qwen duel did not complete within wall-clock limit')
    return await finishTrial({ state, match, qwen, stats: { start, frames, moves, hits } })
  } finally {
    qwen.dispose()
  }
}
function trialActive(state: FightState, timing: { start: number; maxSeconds?: number }) {
  return !state.matchWinner && performance.now() - timing.start < (timing.maxSeconds ?? 420) * 1000
}

async function finishTrial(options: {
  state: FightState
  match: ReturnType<typeof createFightMatchRuntime>
  qwen: ReturnType<typeof createQwenDuel>
  stats: {
    start: number
    frames: number
    moves: { player: Set<string>; opponent: Set<string> }
    hits: { player: number; opponent: number }
  }
}) {
  const { state, match, qwen, stats } = options
  const entry = await match.replays.save()
  if (!entry?.replay.complete) throw Error('No complete native replay')
  const verified = verify(entry.replay)
  if (fightReplayHash(verified) !== fightReplayHash(state)) throw Error('Final replay divergence')
  const evidence = qwen.evidence
  const status = get(qwen)
  if (!['player', 'opponent'].every((side) => evidence.some((row) => row.side === side)))
    throw Error('Both seats must receive real Qwen decisions; fallback-only match is not accepted')
  return {
    replay: entry.replay,
    report: {
      method:
        'Real-time autonomous Qwen strategy over Tailscale, local fast execution, native CPU disabled for both seats',
      seconds: (performance.now() - stats.start) / 1000,
      frames: stats.frames,
      stage: state.environment.stageId,
      winner: state.matchWinner,
      rounds: state.roundsWon,
      hits: stats.hits,
      moves: { player: [...stats.moves.player], opponent: [...stats.moves.opponent] },
      finalHash: fightReplayHash(state),
      checkpoints: entry.replay.checkpoints.length,
      qwen: status,
      evidence,
    },
  }
}

function verify(replay: FightReplay): FightState {
  let state = initialReplayState(replay.setup)
  const checkpoints = new Map(replay.checkpoints.map((row) => [row.packet, row.hash]))
  for (const [index, packet] of replay.packets.entries()) {
    state = executeReplayPacket(state, packet)
    const expected = checkpoints.get(index + 1)
    if (expected && expected !== fightReplayHash(state))
      throw Error(`Replay divergence at packet ${index + 1}`)
  }
  return state
}
