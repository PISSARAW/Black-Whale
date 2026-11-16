import { describe, expect, it } from 'vitest'
import { createFight } from './engine'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import { packReplayInput, unpackReplayInput, REPLAY_INPUT_KEYS } from './fightReplayInput'
import { decodeFightReplay } from './fightReplayCodec'
import { REPLAY_FIGHTERS, type ReplayCommand, type ReplayPacket } from './fightReplayTypes'
import { EMPTY_INPUT, type FightState } from './types'

function match(
  player: (typeof REPLAY_FIGHTERS)[number],
  opponent: (typeof REPLAY_FIGHTERS)[number],
  mode: 'versus-ai' | 'versus-local' = 'versus-local',
) {
  let state = createFight(player, opponent, {
    mode,
    formatId: 'heavens-arena',
    environment: { stageId: 'heavens-arena', arenaInteractions: true },
  })
  const recorder = createReplayRecorder(state)!
  function packet(commands: ReplayCommand[] = [], dt = 1 / 60, input = EMPTY_INPUT) {
    const frame: ReplayPacket = [
      dt,
      packReplayInput(input),
      packReplayInput({ ...EMPTY_INPUT, left: true }),
      commands,
    ]
    const after = executeReplayPacket(state, frame)
    recorder.append(state, frame, after)
    state = after
  }
  packet([{ kind: 'start' }], 0)
  return {
    packet,
    recorder,
    get state() {
      return state
    },
  }
}
function replayAll(run: ReturnType<typeof match>) {
  const data = decodeFightReplay(JSON.stringify(run.recorder.snapshot()))
  const player = createReplayPlayer(data)
  let renders = 0
  while (!player.done && renders++ < 10000) player.advance(0.05, 2)
  expect(player.error).toBe('')
  expect(player.done).toBe(true)
  expect(fightReplayHash(player.state)).toBe(fightReplayHash(run.state))
  return data
}

describe('deterministic full-match replays', () => {
  it('round-trips every held gameplay input, including advanced Nen and arena actions', () => {
    const input = { ...EMPTY_INPUT }
    REPLAY_INPUT_KEYS.forEach((key) => {
      input[key] = true
    })
    expect(packReplayInput(unpackReplayInput(packReplayInput(input)))).toBe(packReplayInput(input))
    expect(REPLAY_INPUT_KEYS.every((key) => unpackReplayInput(packReplayInput(input))[key])).toBe(
      true,
    )
  })
  for (const player of REPLAY_FIGHTERS)
    for (const opponent of REPLAY_FIGHTERS) {
      it(`re-simulates ${player} versus ${opponent} with variable render batches`, () => {
        const run = match(player, opponent, 'versus-ai')
        const steps = [0.006, 0.01, 0.032, 0.05, 0, 0.017]
        for (let i = 0; i < 300; i++) {
          const commands: ReplayCommand[] =
            i % 25 === 0
              ? [
                  {
                    kind: 'move',
                    side: 'player',
                    action: i % 50 === 0 ? 'heavy' : 'special',
                    input: 0,
                  },
                ]
              : []
          if (i === 10 && player === 'kurapika') commands.push({ kind: 'emperor', side: 'player' })
          run.packet(commands, steps[i % steps.length], {
            ...EMPTY_INPUT,
            right: i < 100,
            aura: i > 150 && i < 180,
            gyo: i > 200,
          })
          if (run.state.phase === 'finished' && !run.state.matchWinner)
            run.packet([{ kind: 'round' }], 0)
        }
        replayAll(run)
      })
    }
  it('replays a completed multi-round match including the reset of the round clock', () => {
    const run = match('kurapika', 'chrollo')
    let frames = 0
    while (!run.state.matchWinner && frames++ < 24000) {
      if (run.state.phase === 'finished') run.packet([{ kind: 'round' }], 0)
      run.packet(
        frames % 22 === 0 ? [{ kind: 'move', side: 'player', action: 'light', input: 0 }] : [],
        1 / 60,
        { ...EMPTY_INPUT, right: true },
      )
    }
    expect(run.state.matchWinner).toBe('player')
    expect(run.state.roundNumber).toBeGreaterThan(1)
    const data = replayAll(run)
    expect(data.complete).toBe(true)
  })
  it('includes refused commands, utility gestures and zero-frame packets', () => {
    const run = match('chrollo', 'benjamin')
    run.packet([{ kind: 'easter', side: 'player', slot: 1 }], 0)
    run.packet(
      [
        {
          kind: 'move',
          side: 'player',
          action: 'special',
          input: packReplayInput({ ...EMPTY_INPUT, down: true }),
        },
      ],
      0,
    )
    for (let i = 0; i < 200; i++) run.packet()
    replayAll(run)
  })
  it('detects a divergence rather than silently showing a different fight', () => {
    const run = match('hisoka', 'benjamin')
    for (let i = 0; i < 240; i++) run.packet([], 1 / 60, { ...EMPTY_INPUT, right: true })
    const data = run.recorder.snapshot()!
    data.packets = data.packets.map((packet) => [packet[0], 0, packet[2], packet[3]])
    const player = createReplayPlayer(data)
    while (!player.done) player.advance(0.1, 2)
    expect(player.error).toMatch(/^divergence:/)
    expect(player.cursor).toBeLessThanOrEqual(120)
  })
  it('refuses to continue a recording after an untracked external state change', () => {
    const run = match('hisoka', 'benjamin')
    const changed: FightState = { ...run.state, player: { ...run.state.player, aura: 1 } }
    const packet: ReplayPacket = [1 / 60, 0, 0, []]
    run.recorder.append(changed, packet, executeReplayPacket(changed, packet))
    expect(run.recorder.error).toBe('untracked')
    expect(run.recorder.snapshot()).toBeNull()
  })
  it('validates file versions, commands and bounded time values', () => {
    const run = match('hisoka', 'chrollo')
    run.packet()
    const data = run.recorder.snapshot()!
    expect(() => decodeFightReplay(JSON.stringify({ ...data, version: 100 }))).toThrow(
      'replay-version',
    )
    expect(() =>
      decodeFightReplay(JSON.stringify({ ...data, packets: [[0.2, 0, 0, []]] })),
    ).toThrow()
    expect(() =>
      decodeFightReplay(
        JSON.stringify({ ...data, packets: [[0.016, 0, 0, [{ kind: 'eval', text: 'bad' }]]] }),
      ),
    ).toThrow()
    expect(() =>
      decodeFightReplay(JSON.stringify({ ...data, setup: { ...data.setup, player: 'unknown' } })),
    ).toThrow()
  })
})
