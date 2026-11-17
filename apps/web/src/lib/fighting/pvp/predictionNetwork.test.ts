import { FIGHTING_ROSTER } from '../roster'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from '../engine'
import { EMPTY_INPUT, type FighterId, type FightState } from '../types'
import { FIXED_STEP } from '../fightClock'
import { fightReplayHash } from '../fightReplayHash'
import type { ReplayCommand } from '../fightReplayTypes'
import { createReplayRecorder } from '../fightReplayRecorder'
import { createReplayPlayer } from '../fightReplayPlayer'
import { packReplayInput, unpackReplayInput } from '../fightReplayInput'
import { applyPvpCommand } from './commands'
import { AuthoritativeClashMatch } from './serverMatch'
import { createPvpPrediction } from './prediction'
import { privatePvpState } from './view'
import { pvpConfigHash } from './config'
import { PVP_RULESET, type PvpCommand, type PvpInputPacket, type PvpView } from './types'

function envelope(server: AuthoritativeClashMatch, revision: number): PvpView {
  const state = server.snapshot(),
    setup = {
      player: state.player.id,
      opponent: state.opponent.id,
      formatId: state.formatId,
      environment: state.environment,
    }
  return {
    matchId: 'matrix',
    side: 'player',
    setup,
    ruleset: PVP_RULESET,
    configHash: pvpConfigHash(setup),
    status: 'playing',
    ready: { player: true, opponent: true },
    connected: { player: true, opponent: true },
    nextSequence: server.nextSequence('player'),
    ...server.acknowledgement('player'),
    revision,
    tick: server.tick,
    authorityHash: fightReplayHash(state),
    snapshot: '',
    snapshotHash: '',
    disconnectedSide: null,
  }
}
function exercise(player: FighterId, opponent: FighterId, rtt: number) {
  let initial = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  initial = {
    ...initial,
    player: { ...initial.player, x: 44 },
    opponent: { ...initial.opponent, x: 50 },
  }
  const server = new AuthoritativeClashMatch(initial)
  const recorder = createReplayRecorder(initial)!
  let reference = initial,
    now = 0,
    revision = 0,
    sequence = 0
  let held = 0,
    lastInputAt = 0
  const pending: Array<{ command: PvpCommand; sequence: number }> = []
  const uploads: Array<{ at: number; packet: PvpInputPacket }> = []
  const downloads: Array<{ at: number; state: FightState; view: PvpView }> = []
  const prediction = createPvpPrediction(() => now)
  prediction.accept(privatePvpState(initial, 'player'), envelope(server, ++revision))
  for (let frame = 0; frame < 300; frame++) {
    if (reference.phase !== 'fighting') break
    now = (frame * 1000) / 60
    const controls = {
      ...EMPTY_INPUT,
      guard: frame % 100 > 70,
      down: frame % 90 > 70,
      aura: frame > 180 && frame < 230,
      gyo: frame > 230,
    }
    const input = packReplayInput(controls)
    const commands: PvpCommand[] =
      frame % 40 === 0
        ? [
            {
              kind: 'move',
              action:
                frame % 120 === 0 && player !== 'tserriednich'
                  ? 'special'
                  : frame % 80 === 0
                    ? 'heavy'
                    : 'light',
              input: 0,
            },
          ]
        : []
    const ids = commands.map((command) => prediction.command(command))
    prediction.advance(FIXED_STEP, input)
    if (frame % 3 === 0 || commands.length) {
      const packet = { sequence: sequence++, input, commands }
      prediction.sent(packet, ids)
      uploads.push({ at: now + rtt / 2 + (frame % 5) * 2, packet })
    }
    uploads.sort((a, b) => a.at - b.at)
    while (uploads[0] && uploads[0].at <= now) {
      const { packet } = uploads.shift()!
      const result = server.submit('player', packet, now)
      if (result === 'accepted') {
        held = packet.input
        lastInputAt = now
        pending.push(...packet.commands.map((command) => ({ command, sequence: packet.sequence })))
        // A lost receipt is retried; accepted commands must never execute or cost twice.
        if (packet.sequence % 17 === 3)
          expect(server.submit('player', packet, now)).toBe('duplicate')
      } else expect(result).toBe('sequence')
    }
    const batch = pending.splice(0, 8)
    const before = reference
    for (const { command } of batch) reference = applyPvpCommand(reference, 'player', command)
    const active = now - lastInputAt > 250 ? 0 : held
    reference = tickFight(reference, unpackReplayInput(active), {
      dt: FIXED_STEP,
      opponentInput: EMPTY_INPUT,
      ai: false,
    })
    server.advance(now)
    recorder.append(
      before,
      [
        FIXED_STEP,
        active,
        0,
        batch.map(({ command }): ReplayCommand => {
          if (command.kind !== 'move') throw Error('matrix only records move commands')
          return { ...command, side: 'player' }
        }),
      ],
      reference,
    )
    if (frame % 30 === 0)
      expect(fightReplayHash(server.snapshot())).toBe(fightReplayHash(reference))
    if (frame % 2 === 0 && frame % 101 !== 100) {
      const view = envelope(server, ++revision)
      downloads.push({
        at: now + rtt / 2 + (frame % 7) * 2,
        state: privatePvpState(server.snapshot(), 'player'),
        view,
      })
    }
    // A stream preserves order. Application-level missed view events recover on the next one.
    while (downloads[0] && downloads[0].at <= now) {
      const next = downloads.shift()!
      prediction.accept(next.state, next.view)
    }
    const preview = prediction.current
    if (preview) {
      expect(Object.keys(preview.player)).not.toContain('health')
      expect(preview.opponent && Object.keys(preview.opponent)).toEqual(['x', 'y'])
    }
    expect(prediction.stats.leadFrames).toBeLessThanOrEqual(12)
  }
  expect(fightReplayHash(server.snapshot())).toBe(fightReplayHash(reference))
  const tape = recorder.snapshot()!
  const replay = createReplayPlayer(tape)
  for (let n = 0; n < 20 && !replay.done; n++) replay.advance(0.5)
  expect(replay.error).toBe('')
  expect(fightReplayHash(replay.state)).toBe(fightReplayHash(reference))
}
describe('sixteen matchups under delayed private views', () => {
  for (const player of ['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)
    for (const opponent of ['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)
      it.each([0, 50, 100, 150, 300])(
        `${player} / ${opponent}, RTT %sms + jitter + duplicate receipts`,
        (rtt) => exercise(player, opponent, rtt),
        30000,
      )
})

// Cover each remaining roster body with every transport profile; the full pair matrix
// lives in predictionRoster.test.ts without repeating 300 network frames per pair.
describe('forty roster bodies under delayed private views', () => {
  const roster = FIGHTING_ROSTER.map(({ id }) => id)
  for (const [index, player] of roster.entries())
    it.each([0, 50, 100, 150, 300])(
      `${player} / ${roster[(index + 17) % roster.length]}, RTT %sms`,
      (rtt) => exercise(player, roster[(index + 17) % roster.length], rtt),
      30000,
    )
})
