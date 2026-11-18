import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from '../engine'
import { createFastController } from './execution'
import { createQwenDuel } from './duel'
import { observeCombat, supportsQwenDuel } from './observation'
import { parseTacticalPlan } from './protocol'
import type { TacticalPlan, TacticalReply } from './protocol'

const plan: TacticalPlan = { goal: 'pressure', nen: 'ten', move: 'neutralSpecial' }
const reply: TacticalReply = { plan, model: 'qwen-test', requestId: 'actual-reply', elapsedMs: 100 }
const fight = () => ({
  ...beginFight(createFight('hisoka', 'machi', { mode: 'versus-local' })),
  frame: 20,
})
const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('perceived Qwen observations', () => {
  it('does not expose enemy aura, In, inputs, buffered commands or hidden effects', () => {
    const state = fight()
    state.opponent = { ...state.opponent, aura: 7, nen: { ...state.opponent.nen, in: true } }
    const observed = observeCombat(state, 'player')
    expect(Object.keys(observed.enemy!)).toEqual(['distance', 'pose', 'guarding'])
    expect(observed).not.toHaveProperty('opponent')
    expect(observed.self.aura).toBe(state.player.aura)
    state.opponent.aura = 99
    state.opponent.nen.in = false
    expect(observeCombat(state, 'player')).toEqual(observed)
  })
  it('removes enemy spatial information and tracking movement when sight is unavailable', () => {
    const state = fight()
    state.player.parallelEyesClosed = true
    expect(observeCombat(state, 'player').enemy).toBeNull()
    const decision = createFastController('player')(state, plan)
    expect(decision.input.left || decision.input.right).toBe(false)
    expect(decision.command).toBeUndefined()
  })
  it('supports both seats and excludes native CPU, training and unsupported fighters', () => {
    expect(supportsQwenDuel(fight())).toBe(true)
    expect(observeCombat(fight(), 'opponent').fighter).toBe('machi')
    expect(supportsQwenDuel(createFight('hisoka', 'machi'))).toBe(false)
    expect(supportsQwenDuel(createFight('chrollo', 'machi', { mode: 'versus-local' }))).toBe(true)
  })
})

describe('bounded tactics and legal execution', () => {
  it('rejects invented moves, arbitrary Nen and extra state-writing fields', () => {
    expect(parseTacticalPlan(plan, ['neutralSpecial'])).toEqual(plan)
    expect(parseTacticalPlan({ ...plan, move: 'infiniteGum' }, ['neutralSpecial'])).toBeNull()
    expect(parseTacticalPlan({ ...plan, nen: 'teleport' }, ['neutralSpecial'])).toBeNull()
    expect(parseTacticalPlan({ ...plan, health: 999 }, ['neutralSpecial'])).toBeNull()
  })
  it('cannot execute either fighter finisher without its native prerequisite', () => {
    for (const side of ['player', 'opponent'] as const) {
      const state = fight()
      state.player.x = 45
      state.opponent.x = 53
      state[side].aura = 100
      const before = JSON.stringify(state)
      const decision = createFastController(side)(state, { ...plan, move: 'finisher' })
      expect(decision.command?.action).not.toBe('finisher')
      expect(JSON.stringify(state)).toBe(before)
    }
  })
  it('produces opponent-side commands rather than swapping global fighter ownership', () => {
    const state = fight()
    state.player.x = 45
    state.opponent.x = 50
    const decision = createFastController('opponent')(state, { ...plan, move: 'downSpecial' })
    expect(decision.command?.side).toBe('opponent')
    expect(decision.command?.action).toBe('special')
  })
})

describe('nonblocking tactical scheduler', () => {
  it('keeps one inference in flight, then alternates seats and applies a validated reply', async () => {
    let now = 0
    let deliver!: (value: TacticalReply) => void
    const requested: string[] = []
    const duel = createQwenDuel({
      clock: () => now,
      transport: (observation) => {
        requested.push(observation.fighter)
        return new Promise((resolve) => {
          deliver = resolve
        })
      },
    })
    let status: unknown
    duel.subscribe((value) => {
      status = value
    })
    duel.setEnabled(true)
    expect(duel.step(fight())).not.toBeNull()
    duel.step(fight())
    expect(requested).toEqual(['hisoka'])
    deliver(reply)
    await settle()
    expect(status).toMatchObject({ accepted: 1 })
    now = 1700
    duel.step(fight())
    expect(requested).toEqual(['hisoka', 'machi'])
    expect(status).toMatchObject({ source: { player: 'qwen', opponent: 'local' } })
    deliver({ ...reply, plan: { ...plan, move: 'downSpecial' } })
    await settle()
    duel.dispose()
  })
  it('discards replies from a previous round or disabled session', async () => {
    const pending: ((value: TacticalReply) => void)[] = []
    const duel = createQwenDuel({
      transport: () => new Promise((resolve) => pending.push(resolve)),
    })
    duel.setEnabled(true)
    duel.step(fight())
    duel.step({ ...fight(), roundNumber: 2 })
    pending[0](reply)
    await settle()
    expect(duel.evidence).toHaveLength(0)
    duel.setEnabled(false)
    pending[1](reply)
    await settle()
    expect(duel.evidence).toHaveLength(0)
  })
  it('reports expired responses and preserves fallback control on network failure', async () => {
    let now = 0
    let deliver!: (value: TacticalReply) => void
    const duel = createQwenDuel({
      clock: () => now,
      transport: () =>
        new Promise((resolve) => {
          deliver = resolve
        }),
    })
    let status: unknown
    duel.subscribe((value) => {
      status = value
    })
    duel.setEnabled(true)
    duel.step(fight())
    now = 18001
    deliver(reply)
    await settle()
    expect(status).toMatchObject({ stale: 1, accepted: 0 })
    expect(duel.step(fight())).not.toBeNull()
    duel.dispose()
  })
  it('does not call inference while disabled or in the native AI mode', () => {
    let calls = 0
    const duel = createQwenDuel({
      transport: async () => {
        calls++
        return reply
      },
    })
    expect(duel.step(fight())).toBeNull()
    duel.setEnabled(true)
    expect(duel.step(beginFight(createFight('hisoka', 'machi')))).toBeNull()
    expect(calls).toBe(0)
    duel.dispose()
  })
})
