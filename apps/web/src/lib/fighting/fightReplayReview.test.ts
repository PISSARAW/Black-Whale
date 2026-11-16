import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { executeReplayPacket } from './fightReplayCommands'
import { initialReplayState } from './fightReplayCommands'
import { fightReplayHash } from './fightReplayHash'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { createCareerTracker } from './career/runtime'
import { practiceReplay } from './fightReplayPractice'
import { FUTURE_PREPARATION_FRAMES } from './parallelFutureTypes'
import { EMPTY_INPUT, type FightState } from './types'
import type { ReplayPacket } from './fightReplayTypes'

function recorded(count = 16) {
  let state = createFight('hisoka', 'kurapika', { mode: 'versus-local', formatId: 'knockout' })
  const recorder = createReplayRecorder(state)!
  for (let index = 0; index < count; index++) {
    const packet: ReplayPacket = [
      index === 0 ? 0 : index % 3 ? 1 / 60 : 1 / 30,
      index % 4 ? 0 : 2,
      0,
      index === 0 ? [{ kind: 'start' }] : [],
    ]
    const next = executeReplayPacket(state, packet)
    recorder.append(state, packet, next)
    state = next
  }
  return recorder.snapshot()!
}
function unmarked(state: FightState) {
  const { replayPractice: _, ...plain } = state
  return plain as FightState
}
function active(player: 'hisoka' | 'chrollo' | 'tserriednich' | 'basho' = 'hisoka') {
  return beginFight(createFight(player, 'kurapika', { mode: 'versus-local', formatId: 'knockout' }))
}

describe('deterministic replay review', () => {
  it.each([0, 1, 2, 5, 8, 16])(
    'rebuilds exact packet boundary %s without estimating frame time',
    (target) => {
      const replay = recorded(),
        player = createReplayPlayer(replay)
      while (!player.done) player.advance(0.05)
      expect(player.seek(target)).toBe(true)
      while (player.seeking) player.advance(0)
      const expected = replay.packets
        .slice(0, target)
        .reduce(executeReplayPacket, initialReplayState(replay.setup))
      expect(player.cursor).toBe(target)
      expect(fightReplayHash(player.state)).toBe(fightReplayHash(expected))
      expect(player.elapsed).toBeCloseTo(
        replay.packets.slice(0, target).reduce((sum, packet) => sum + packet[0], 0),
      )
    },
  )
  it('bounds reconstruction work per render and cancels an older seek', () => {
    const player = createReplayPlayer(recorded(601))
    player.seek(600)
    player.advance(0)
    expect(player.cursor).toBe(240)
    expect(player.seeking).toBe(true)
    player.seek(10)
    player.advance(0)
    expect(player.cursor).toBe(10)
    expect(player.seeking).toBe(false)
    expect(player.seek(NaN)).toBe(false)
    expect(player.seek(-1)).toBe(false)
    expect(player.seek(602)).toBe(false)
    expect(player.seek(1.5)).toBe(false)
    expect(player.cursor).toBe(10)
  })
  it('discards accumulated playback time when selecting a new position', () => {
    const replay = recorded(),
      player = createReplayPlayer(replay)
    player.advance(0.019)
    player.seek(2)
    player.advance(0)
    player.advance(0.015)
    expect(player.cursor).toBe(2)
    player.advance(0.002)
    expect(player.cursor).toBe(3)
  })
  it('stops at a divergent checkpoint during a seek and refuses takeover', async () => {
    const replay = recorded(150)
    replay.checkpoints.find((point) => point.packet === 120)!.hash = '00000000'
    const runtime = createFightMatchRuntime()
    const entry = await runtime.replays.import(JSON.stringify(replay))
    runtime.replays.open(entry!.id, null)
    runtime.seekReplay(150)
    expect(get(runtime.replays).playback?.error).toBe('divergence:120')
    expect(runtime.takeoverReplay()).toBeNull()
  })
  it('isolates repeatable rehearsals, keeps the source and restores the suspended capture', async () => {
    const results: unknown[] = [],
      runtime = createFightMatchRuntime(undefined, {
        career: createCareerTracker((match) => results.push(match)),
      })
    let live = active()
    runtime.begin(live)
    live = runtime.advance(live, EMPTY_INPUT, { dt: 1 / 60 })
    const entry = await runtime.replays.import(JSON.stringify(recorded()))
    const source = JSON.stringify(entry!.replay)
    runtime.replays.open(entry!.id, live)
    runtime.seekReplay(8)
    const baseline = runtime.takeoverReplay()!,
      hash = fightReplayHash(baseline)
    expect(await runtime.replays.save()).toBeNull()
    expect(runtime.replays.restart()).toBeNull()
    expect(runtime.replays.active).toBe(false)
    expect(runtime.replays.practicing).toBe(true)
    runtime.enqueue(baseline, { kind: 'move', side: 'player', action: 'light', input: 0 })
    let changed = runtime.advance(baseline, EMPTY_INPUT, { dt: 1 / 60 })
    expect(changed.player.attack).not.toBeNull()
    const repeated = runtime.repeatReplayPractice()!
    expect(fightReplayHash(repeated)).toBe(hash)
    changed = runtime.advance(repeated, EMPTY_INPUT, { dt: 1 / 60 })
    expect(changed.player.attack).toBeNull() // queued rehearsal commands were discarded
    expect(runtime.returnToReplay()?.replayPractice).toBeUndefined()
    expect(get(runtime.replays).playback?.packet).toBe(8)
    expect(runtime.replays.close()).toBe(live)
    live = runtime.advance(live, EMPTY_INPUT, { dt: 1 / 60 })
    const saved = await runtime.replays.save()
    const played = createReplayPlayer(saved!.replay)
    while (!played.done) played.advance(0.05)
    expect(played.error).toBe('')
    expect(fightReplayHash(played.state)).toBe(fightReplayHash(live))
    expect(JSON.stringify(entry!.replay)).toBe(source)
    expect(results).toEqual([])
  })
})

describe('Nen commitments during replay takeover', () => {
  it('keeps a copied page, missing equipment, Zetsu and exact resource values', () => {
    const state = active('chrollo')
    state.player.chrolloBook = { pages: ['melody'], page: 0, open: false, bookmark: 'melody' }
    state.player.aura = 7
    const branch = practiceReplay(state, 'copy', 0)!
    expect(branch.player.chrolloBook).toEqual(state.player.chrolloBook)
    const refused = performMove({ state: branch, side: 'player', action: 'special' })
    expect(refused.player.aura).toBe(7)
    expect(refused.player.melodyPerformance).toBeUndefined()
    expect(refused.player.equipment).toEqual(['book'])
    branch.player.nen.mode = 'zetsu'
    expect(
      performMove({ state: branch, side: 'player', action: 'special' }).player.attack,
    ).toBeNull()
    expect(state.player.nen.mode).toBe('ten')
  })
  it('clones the actual Parallel Future state and keeps the explicit eye-opening condition', () => {
    let state = performMove({ state: active('tserriednich'), side: 'player', action: 'special' })
    for (let i = 0; i < FUTURE_PREPARATION_FRAMES + 2; i++)
      state = tickFight(state, EMPTY_INPUT, 1 / 60)
    expect(state.parallelFuture?.phase).toBe('vision')
    let branch = practiceReplay(state, 'future', 30)!
    expect(branch.player.parallelEyesClosed).toBe(true)
    expect(branch.parallelFuture).toEqual(state.parallelFuture)
    expect(branch.parallelFuture).not.toBe(state.parallelFuture)
    branch = performMove({ state: branch, side: 'player', action: 'special' })
    state = performMove({ state, side: 'player', action: 'special' })
    for (let i = 0; i < 12; i++) {
      branch = tickFight(branch, EMPTY_INPUT, 1 / 60)
      state = tickFight(state, EMPTY_INPUT, 1 / 60)
    }
    expect(fightReplayHash(unmarked(branch))).toBe(fightReplayHash(state))
  }, 20000)
  it('does not resolve Cat’s Name early, restore costs or grant career points', () => {
    let state = active('basho')
    state.opponent = {
      ...createFight('basho', 'camilla').opponent,
      health: 1,
      bashoBurn: { owner: 'player', remainingFrames: 1 },
    }
    state = tickFight(state, EMPTY_INPUT, 1 / 60)
    expect(state.catsName).toBeDefined()
    let branch = practiceReplay(state, 'cat', 1)!
    expect(branch.opponent.health).toBe(0)
    const results: unknown[] = [],
      tracker = createCareerTracker((match) => results.push(match))
    tracker.begin(branch)
    for (let i = 0; i < 250; i++) {
      const before = branch
      branch = tickFight(branch, EMPTY_INPUT, 1 / 60)
      state = tickFight(state, EMPTY_INPUT, 1 / 60)
      tracker.observe(before, branch)
    }
    expect(fightReplayHash(unmarked(branch))).toBe(fightReplayHash(state))
    expect(results).toEqual([])
  })
  it('rejects redacted PvP, spectator, forecast and finished states', () => {
    const state = active()
    for (const change of [
      { pvpSeat: 'player' as const },
      { spectatorView: true },
      { forecastSimulation: true },
      { phase: 'finished' as const },
    ])
      expect(practiceReplay({ ...state, ...change }, 'private', 0)).toBeNull()
  })
})
