import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createFight, beginFight, tickFight } from './engine'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { FIXED_STEP } from './fightClock'
import { fightReplayHash } from './fightReplayHash'
import { createReplayPlayer } from './fightReplayPlayer'
import { EMPTY_INPUT, type FightState } from './types'

function lab() {
  let time = 0
  const runtime = createFightMatchRuntime(() => time)
  const fresh = beginFight(createFight('hisoka', 'chrollo', { mode: 'training' }))
  let state: FightState = {
    ...fresh,
    player: { ...fresh.player, x: 44 },
    opponent: { ...fresh.opponent, x: 50 },
  }
  return {
    runtime,
    get state() {
      return state
    },
    set state(value: FightState) {
      state = value
    },
    clock(value: number) {
      time = value
    },
    command(action: 'light' | 'heavy' | 'special' = 'light') {
      runtime.enqueue(state, { kind: 'move', side: 'player', action, input: 0 })
    },
    step(dt = FIXED_STEP) {
      state = runtime.advance(state, EMPTY_INPUT, { dt, opponentInput: EMPTY_INPUT })
    },
    rows() {
      return get(runtime.diagnostics)
    },
  }
}

describe('response diagnostics observe the actual command lifecycle', () => {
  it('keeps an arrival queued until the next real simulation tick', () => {
    const run = lab()
    run.command()
    expect(run.rows()[0].outcome).toBe('queued')
    run.clock(5)
    run.step(0.001)
    expect(run.state.player.attack).toBeNull()
    expect(run.rows()[0].outcome).toBe('queued')
    run.clock(17)
    run.step(FIXED_STEP)
    expect(run.state.player.attack).not.toBeNull()
    expect(run.rows()[0]).toMatchObject({
      outcome: 'executed',
      queueMs: 17,
      receivedFrame: 0,
      appliedFrame: 0,
      executedFrame: 0,
    })
  })
  it('reports an actual aura refusal without changing the combat body', () => {
    const run = lab()
    run.state = { ...run.state, player: { ...run.state.player, aura: 0 } }
    run.command('special')
    run.step()
    expect(run.rows()[0]).toMatchObject({ outcome: 'refused', reason: 'aura' })
    expect(run.state.player.attack).toBeNull()
  })
  it('tracks a buffered action until the exact simulation tick on which it starts', () => {
    const run = lab()
    run.state = { ...run.state, player: { ...run.state.player, hitStun: 3, pose: 'hit' } }
    run.command('heavy')
    run.step()
    expect(run.rows()[0].outcome).toBe('buffered')
    let expected: number | undefined
    for (let i = 0; i < 8 && !expected; i++) {
      run.step()
      if (run.state.player.attack) expected = run.state.frame
    }
    expect(expected).toBeDefined()
    expect(run.rows()[0]).toMatchObject({ outcome: 'executed', executedFrame: expected })
  })
  it('does not mistake hitstop or pause for the expiry of a buffer', () => {
    const run = lab()
    run.state = {
      ...run.state,
      hitstop: 5,
      player: { ...run.state.player, hitStun: 3, pose: 'hit' },
    }
    run.command('heavy')
    run.step()
    const remaining = run.state.player.bufferedAttack!.bufferFrames
    for (let i = 0; i < 3; i++) run.step()
    expect(run.state.player.bufferedAttack!.bufferFrames).toBe(remaining)
    expect(run.rows()[0].outcome).toBe('buffered')
    run.runtime.clear()
    expect(run.rows()[0].outcome).toBe('buffered')
    for (let i = 0; i < 10; i++) run.step()
    expect(run.rows()[0].outcome).toBe('executed')
  })
  it('distinguishes an expired buffer from an executed command', () => {
    const run = lab()
    run.state = { ...run.state, player: { ...run.state.player, hitStun: 3, pose: 'hit' } }
    run.command('heavy')
    run.step()
    run.state = { ...run.state, player: { ...run.state.player, hitStun: 30 } }
    for (let i = 0; i < 12; i++) run.step()
    expect(run.rows()[0]).toMatchObject({ outcome: 'expired', reason: 'buffer-expired' })
    expect(run.state.player.attack).toBeNull()
  })
  it('labels replacement of a buffered command and follows its successor', () => {
    const run = lab()
    run.state = { ...run.state, player: { ...run.state.player, hitStun: 3, pose: 'hit' } }
    run.command('heavy')
    run.step()
    run.command('light')
    run.step()
    expect(run.rows()[0]).toMatchObject({ outcome: 'cancelled', reason: 'replaced' })
    for (let i = 0; i < 8; i++) run.step()
    expect(run.rows()[1].outcome).toBe('executed')
  })
  it('cancels an unapplied command on focus/reset without executing it later', () => {
    const run = lab()
    run.command()
    run.runtime.clear()
    run.step()
    expect(run.rows()[0]).toMatchObject({ outcome: 'cancelled', reason: 'cleared' })
    expect(run.state.player.attack).toBeNull()
  })
  it('bounds the queue and explains commands discarded before the next tick', () => {
    const run = lab()
    for (let i = 0; i < 100; i++) run.command()
    expect(run.rows()).toHaveLength(80)
    expect(run.rows().at(-1)).toMatchObject({ outcome: 'cancelled', reason: 'queue-full' })
  })
  it('observes each completed frame once, including multi-frame rendering batches', () => {
    const state = beginFight(createFight('hisoka', 'chrollo'))
    const frames: number[][] = []
    tickFight(state, EMPTY_INPUT, {
      dt: 0,
      onFrame: (before, after) => frames.push([before.frame, after.frame]),
    })
    expect(frames).toHaveLength(0)
    tickFight(state, EMPTY_INPUT, {
      dt: FIXED_STEP * 3 + 1e-8,
      onFrame: (before, after) => frames.push([before.frame, after.frame]),
    })
    expect(frames).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ])
  })
  it('records queued live input and replays it without the diagnostic observer', async () => {
    const runtime = createFightMatchRuntime(() => 10)
    let state = createFight('hisoka', 'benjamin', { mode: 'versus-local' })
    runtime.begin(state)
    state = runtime.apply(state, { kind: 'start' })
    runtime.enqueue(state, { kind: 'move', side: 'player', action: 'heavy', input: 0 })
    for (let i = 0; i < 160; i++)
      state = runtime.advance(state, { ...EMPTY_INPUT, right: true }, { dt: FIXED_STEP })
    const saved = await runtime.replays.save()
    expect(saved).not.toBeNull()
    const player = createReplayPlayer(saved!.replay)
    while (!player.done) player.advance(0.1)
    expect(player.error).toBe('')
    expect(fightReplayHash(player.state)).toBe(fightReplayHash(state))
  })
})
