import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performMove } from './engine'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { createReplayPlayer } from './fightReplayPlayer'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { panelReplayCommand, applyPanelReplay, readPanelReplayCommand } from './fightReplayPanels'
import { cloneReplayValue, encodeReplay, decodeReplay } from './clashReplayCodec'
import { replayChanges, applyReplayChanges } from './clashReplayPatch'
import { composeBashoPoem } from './bashoAction'
import { BASHO_POEMS } from './bashoPoem'
import { offerMoonlightContract, respondMoonlightContract } from './moonlightContract'
import { designateBlinkyTarget } from './blinky'
import { createChallengeFight } from './fightChallenges'
import { FIGHTING_ROSTER } from './roster'
import { FUTURE_PREPARATION_FRAMES } from './parallelFutureTypes'
import { EMPTY_INPUT, type FightInput, type FightState, type FighterId } from './types'
import type { FightReplay } from './fightReplayTypes'
import { MAX_REPLAY_BYTES, type ReplayPacket } from './fightReplayTypes'

function recording(initial: FightState) {
  let state = initial
  const runtime = createFightMatchRuntime(() => 0)
  runtime.begin(state)
  return {
    runtime,
    get state() {
      return state
    },
    edit(run: (current: FightState) => FightState) {
      state = run(state)
    },
    advance(count: number, partial: Partial<FightInput> = {}) {
      for (let i = 0; i < count; i++)
        state = runtime.advance(
          state,
          { ...EMPTY_INPUT, ...partial },
          { dt: 1 / 60, opponentInput: EMPTY_INPUT },
        )
    },
    async save() {
      const saved = await runtime.replays.save()
      expect(saved).not.toBeNull()
      return saved!.replay
    },
  }
}
function replayAll(replay: FightReplay): FightState {
  const player = createReplayPlayer(decodeFightReplay(JSON.stringify(replay)))
  for (let renders = 0; !player.done && renders < 10000; renders++) player.advance(0.05, 2)
  expect(player.done).toBe(true)
  expect(player.error).toBe('')
  return player.state
}
function duel(id: FighterId): FightState {
  const state = beginFight(
    createFight(id, 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100, x: 44 },
    opponent: { ...state.opponent, aura: 100, x: 50 },
  }
}

describe('complete Clash replay coverage', () => {
  it.each(FIGHTING_ROSTER.map(({ id }) => id))(
    're-simulates %s from its actual seed and complete configuration',
    async (id) => {
      const initial = createFight(id, 'kurapika', {
        mode: 'versus-ai',
        formatId: 'knockout',
        environment: { stageId: 'heavens-arena', arenaInteractions: false },
      })
      initial.rng = 61016
      const run = recording(initial)
      run.edit((state) => run.runtime.apply(state, { kind: 'start' }))
      run.advance(24)
      const replay = await run.save()
      expect(replay.setup.seed).toBe(61016)
      expect(fightReplayHash(replayAll(replay))).toBe(fightReplayHash(run.state))
    },
  )
  it('records Basho’s editor command and writing, rather than invalidating capture', async () => {
    const run = recording(duel('basho'))
    run.runtime.queue((state) =>
      composeBashoPoem({ state, side: 'player', text: BASHO_POEMS.fr }, performAuraAttack),
    )
    run.advance(75)
    expect(run.state.player.bashoPoem?.ready).toBe(true)
    const replay = await run.save()
    expect(
      replay.packets.some((packet) => packet[3].some((command) => command.kind === 'panel')),
    ).toBe(true)
    const played = replayAll(replay)
    expect(played.player.bashoPoem).toEqual(run.state.player.bashoPoem)
    expect(played.player.aura).toBe(run.state.player.aura)
  })
  it('records both voluntary contract signatures and their actual consequences', async () => {
    const run = recording(duel('longhi'))
    run.runtime.queue((state) => offerMoonlightContract({ state, side: 'player' }))
    run.advance(1)
    expect(run.state.moonlight?.offer).toBeDefined()
    run.runtime.queue((state) =>
      respondMoonlightContract({ state, side: 'opponent', accept: true }),
    )
    run.advance(12)
    const played = replayAll(await run.save())
    expect(played.moonlight).toEqual(run.state.moonlight)
    expect(fightReplayHash(played)).toBe(fightReplayHash(run.state))
  })
  it('journals an immediate panel selection outside the queued attack path', async () => {
    const run = recording(duel('shizuku'))
    run.advance(1)
    run.edit((state) => designateBlinkyTarget(state, 'player', 'stone'))
    run.advance(4)
    const replay = await run.save()
    expect(replay.packets.filter((packet) => packet[0] === 0).length).toBeGreaterThan(0)
    expect(fightReplayHash(replayAll(replay))).toBe(fightReplayHash(run.state))
  })
  it('preserves training Infinity and an already prepared projection and projectile', async () => {
    const run = recording({
      ...createChallengeFight('protect-body'),
      time: Infinity,
      remainingFrames: Infinity,
    })
    expect(run.state.projectiles.length).toBeGreaterThan(0)
    expect(run.state.player.hanzoProjection).toBeDefined()
    run.advance(10)
    const played = replayAll(await run.save())
    expect(played.time).toBe(Infinity)
    expect(played.player.hanzoProjection).toEqual(run.state.player.hanzoProjection)
    expect(played.projectiles).toEqual(run.state.projectiles)
    expect(fightReplayHash(played)).toBe(fightReplayHash(run.state))
  })
  it('does not give a copied page equipment when its command was refused', async () => {
    const initial = duel('chrollo')
    initial.player.chrolloBook = { pages: ['melody'], page: 0, open: false, bookmark: 'melody' }
    const run = recording(initial)
    run.runtime.enqueue(run.state, { kind: 'move', side: 'player', action: 'special', input: 0 })
    run.advance(1)
    expect(run.state.commandFeedback?.player?.reason).toBe('equipment')
    const played = replayAll(await run.save())
    expect(played.player.equipment).toEqual(['book'])
    expect(played.player.melodyPerformance).toBeUndefined()
    expect(fightReplayHash(played)).toBe(fightReplayHash(run.state))
  })
  it('preserves post-mortem attribution and resurrection across playback', async () => {
    const initial = duel('basho')
    initial.opponent = {
      ...createFight('basho', 'camilla').opponent,
      x: 50,
      health: 1,
      bashoBurn: { owner: 'player', remainingFrames: 1 },
    }
    const run = recording(initial)
    run.advance(1)
    expect(run.state.catsName?.killerSide).toBe('player')
    run.advance(250)
    expect(fightReplayHash(replayAll(await run.save()))).toBe(fightReplayHash(run.state))
  })
  it('replays a detached Parallel Future and the explicit command opening the eyes', async () => {
    let initial = duel('tserriednich')
    initial = performMove({ state: initial, side: 'player', action: 'special' })
    const run = recording(initial)
    run.advance(FUTURE_PREPARATION_FRAMES + 2)
    expect(run.state.parallelFuture?.phase).toBe('vision')
    run.runtime.enqueue(run.state, { kind: 'move', side: 'player', action: 'special', input: 0 })
    run.advance(30, { left: true })
    expect(run.state.parallelFuture?.phase).toBe('diverging')
    const replay = await run.save()
    expect(fightReplayHash(replayAll(replay))).toBe(fightReplayHash(run.state))
  }, 20000)
  it('stops rather than silently accepting a changed panel precondition hash', async () => {
    const run = recording(duel('basho'))
    run.runtime.queue((state) =>
      composeBashoPoem({ state, side: 'player', text: BASHO_POEMS.fr }, performAuraAttack),
    )
    run.advance(2)
    const replay = cloneReplayValue(await run.save())
    const command = replay.packets
      .flatMap((packet) => packet[3])
      .find((entry) => entry.kind === 'panel')!
    if (command.kind === 'panel') command.before = '00000000'
    const player = createReplayPlayer(replay)
    player.advance(1)
    expect(player.error).not.toBe('')
  })
})

describe('bounded replay snapshots and panel deltas', () => {
  it('keeps a valid prefix when the capture reaches its byte limit', () => {
    const initial = createFight('hisoka', 'kurapika', { mode: 'versus-local' })
    const recorder = createReplayRecorder(initial)!
    const first: ReplayPacket = [1 / 60, 0, 0, [{ kind: 'start' }]]
    const next = executeReplayPacket(initial, first)
    recorder.append(initial, first, next)
    recorder.append(
      next,
      [
        0,
        0,
        0,
        [
          {
            kind: 'panel',
            payload: 'x'.repeat(MAX_REPLAY_BYTES),
            before: '00000000',
            after: '00000000',
          },
        ],
      ],
      next,
    )
    expect(recorder.error).toBe('limit')
    const prefix = recorder.snapshot()!
    expect(prefix.packets).toHaveLength(1)
    expect(fightReplayHash(replayAll(prefix))).toBe(fightReplayHash(next))
  })
  it('round-trips explicit undefined, nonfinite training values and nested arrays', () => {
    const value = {
      field: undefined,
      values: [Infinity, -Infinity, NaN, undefined],
      text: 'undefined',
    }
    const decoded = decodeReplay(encodeReplay(value))
    expect(decoded).toEqual(value)
    expect(Object.hasOwn(decoded as object, 'field')).toBe(true)
  })
  it('applies immutable panel deltas including removals and explicit undefined', () => {
    const before = { nested: { one: 1, two: 2 }, list: [1, 2] }
    const after = { nested: { one: 3, field: undefined }, list: [4] }
    const result = applyReplayChanges(before, replayChanges(before, after))
    expect(result).toEqual(after)
    expect(before).toEqual({ nested: { one: 1, two: 2 }, list: [1, 2] })
  })
  it('rejects prototype-bearing keys, malformed paths and oversized imports', () => {
    expect(() => decodeReplay('{"__proto__":{"polluted":true}}')).toThrow()
    expect(() => decodeReplay(' '.repeat(24 * 1024 * 1024 + 1))).toThrow()
    const command = panelReplayCommand(duel('hisoka'), duel('hisoka'))
    expect(() =>
      readPanelReplayCommand({
        ...command,
        payload: '[{"path":["player","constructor"],"value":{}}]',
      }),
    ).toThrow()
    expect(() => applyPanelReplay(duel('kurapika'), command)).toThrow()
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
