import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { beginFight, createFight } from './engine'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { createReplayPlayer } from './fightReplayPlayer'
import { createReplayRecorder } from './fightReplayRecorder'
import { decodeFightReplay } from './fightReplayCodec'
import { executeReplayPacket } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import { panelReplayCommand, readPanelReplayCommand } from './fightReplayPanels'
import { encodeReplay } from './clashReplayCodec'
import { resetTraining, setTrainingResources } from './trainingSession'
import { EMPTY_INPUT } from './types'

function replayToEnd(data: Parameters<typeof createReplayPlayer>[0]) {
  const player = createReplayPlayer(decodeFightReplay(JSON.stringify(data)))
  for (let i = 0; !player.done && i < 1000; i++) player.advance(0.05, 2)
  expect(player.done).toBe(true)
  expect(player.error).toBe('')
  return player.state
}

describe('replay boundaries for panels and training', () => {
  it('keeps the initial RNG, infinite training clock and resource setup', () => {
    let state = beginFight(createFight('benjamin', 'kurapika', { mode: 'training' }))
    state = setTrainingResources(state, 'player', { aura: 29 })
    state = { ...state, rng: 932841, time: Infinity }
    const recorder = createReplayRecorder(state)!
    const packet = [1 / 60, 0, 0, []] as const
    const after = executeReplayPacket(state, [packet[0], packet[1], packet[2], []])
    recorder.append(state, [packet[0], 0, 0, []], after)
    const restored = replayToEnd(recorder.snapshot()!)
    expect(
      createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot()))).state.time,
    ).toBe(Infinity)
    expect(fightReplayHash(restored)).toBe(fightReplayHash(after))
  })
  it('journals panel callbacks and explicit lab resets at command boundaries', async () => {
    const runtime = createFightMatchRuntime()
    let state = beginFight(createFight('chrollo', 'hisoka', { mode: 'training' }))
    runtime.begin(state)
    runtime.queue((current) => setTrainingResources(current, 'player', { aura: 31 }))
    state = runtime.advance(state, EMPTY_INPUT, { dt: 1 / 60 })
    state = resetTraining(state, 'right')
    state = runtime.advance(state, EMPTY_INPUT, { dt: 1 / 60 })
    await runtime.replays.save()
    const data = get(runtime.replays).library[0].replay
    expect(
      data.packets.flatMap((packet) => packet[3]).filter((command) => command.kind === 'panel'),
    ).toHaveLength(2)
    expect(fightReplayHash(replayToEnd(data))).toBe(fightReplayHash(state))
  })
  it('rejects a modified panel payload against its result hash', () => {
    const before = beginFight(createFight('hisoka', 'chrollo'))
    const after = { ...before, player: { ...before.player, aura: 33 } }
    const command = panelReplayCommand(before, after)
    command.payload = encodeReplay([{ path: ['player', 'aura'], value: 1 }])
    expect(() => executeReplayPacket(before, [0, 0, 0, [command]])).toThrow('panel-divergence')
  })
  it('rejects prototype keys and oversized patch paths at import', () => {
    for (const path of [['__proto__', 'polluted'], Array.from({ length: 101 }, () => 'x')])
      expect(() =>
        readPanelReplayCommand({
          kind: 'panel',
          before: '00000000',
          after: '00000000',
          payload: encodeReplay([{ path, value: true }]),
        }),
      ).toThrow('invalid-replay')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
