import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from '../engine'
import { EMPTY_INPUT } from '../types'
import type { ArcadeFighter, FightInput, FightMode, FightState } from '../types'
import { KAMEO_CATALOGUE } from './catalogue'
import { kameoCall } from './runtime'
import { withKameos } from './state'
import type { KameoId, KameoSlot } from './types'

const CALL: FightInput = { ...EMPTY_INPUT, kameo: true }
const slotOf = (state: FightState, side: 'player' | 'opponent' = 'player') =>
  state.kameos?.[side] as KameoSlot

interface Setup {
  id: KameoId
  mode?: FightMode
  side?: 'player' | 'opponent'
  player?: Partial<ArcadeFighter>
  opponent?: Partial<ArcadeFighter>
}

function duel({ id, mode = 'versus-local', side = 'player', player, opponent }: Setup) {
  const base = beginFight(withKameos(createFight('kurapika', 'hisoka', { mode }), { [side]: id }))
  return {
    ...base,
    player: { ...base.player, x: 30, ...player },
    opponent: { ...base.opponent, x: 70, ...opponent },
  }
}

function frame(state: FightState, input: FightInput = EMPTY_INPUT): FightState {
  const opponentInput = state.mode === 'versus-ai' ? undefined : EMPTY_INPUT
  return tickFight(state, input, { dt: 1 / 60, opponentInput, ai: state.mode === 'versus-ai' })
}

function run(state: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++) state = frame(state)
  return state
}

const STAY = KAMEO_CATALOGUE.tubeppa.timing

describe('kameo calls (lot 5)', () => {
  it('reads the call direction relative to the leader facing', () => {
    expect(kameoCall(EMPTY_INPUT, 1)).toBeUndefined()
    expect(kameoCall(CALL, 1)).toBe('neutral')
    expect(kameoCall({ ...CALL, right: true }, 1)).toBe('forward')
    expect(kameoCall({ ...CALL, right: true }, -1)).toBe('back')
    expect(kameoCall({ ...CALL, left: true }, -1)).toBe('forward')
  })

  it('places the kameo beside, in front of or behind its leader', () => {
    const state = duel({ id: 'tubeppa' })
    const placed = (input: FightInput) => {
      const next = frame(state, input)
      return slotOf(next).fighter.x - next.player.x
    }
    expect(placed(CALL)).toBeCloseTo(3)
    expect(placed({ ...CALL, right: true })).toBeCloseTo(8)
    expect(placed({ ...CALL, left: true })).toBeCloseTo(-6)
  })

  it('runs one full stay: enter, land the effect once, leave, then cool down', () => {
    const state = duel({ id: 'tubeppa', player: { health: 200 } })
    let next = frame(state, CALL)
    expect(slotOf(next).phase).toBe('entering')
    next = run(next, STAY.enter)
    expect(slotOf(next).phase).toBe('acting')
    next = run(next, STAY.startup - 1)
    expect(next.player.health).toBe(200)
    const auraBefore = slotOf(next).fighter.aura
    next = run(next, 1)
    expect(next.player.health).toBe(208)
    expect(auraBefore - slotOf(next).fighter.aura).toBeGreaterThan(19)
    next = run(next, STAY.recovery)
    expect(slotOf(next).phase).toBe('leaving')
    next = run(next, STAY.leave)
    expect(slotOf(next).phase).toBe('reserve')
    expect(slotOf(next).cooldownFrames).toBe(KAMEO_CATALOGUE.tubeppa.cooldownFrames)
    expect(next.player.health).toBe(208)
    expect(slotOf(frame(next, CALL)).phase).toBe('reserve')
  })

  it('cannot be called while the leader is busy or the kameo lacks aura', () => {
    const stunned = duel({ id: 'tubeppa', player: { hitStun: 20 } })
    expect(slotOf(frame(stunned, CALL)).phase).toBe('reserve')
    const state = duel({ id: 'tubeppa' })
    const tired = {
      ...state,
      kameos: { player: { ...slotOf(state), fighter: { ...slotOf(state).fighter, aura: 10 } } },
    }
    expect(slotOf(frame(tired, CALL)).phase).toBe('reserve')
  })

  it('shields its leader from a strike when standing nearer, and is interrupted', () => {
    const state = duel({ id: 'tubeppa', player: { x: 20, health: 200 }, opponent: { x: 34 } })
    let next = performAttack(frame(state, { ...CALL, right: true }), 'opponent', 'heavy')
    for (let i = 0; i < 40 && slotOf(next).phase !== 'leaving'; i++) next = frame(next)
    expect(slotOf(next).phase).toBe('leaving')
    expect(slotOf(next).fighter.health).toBeLessThan(slotOf(next).fighter.maxHealth)
    expect(next.player.health).toBe(200)
    next = run(next, STAY.leave + 5)
    expect(next.player.health).toBe(200)
    expect(slotOf(next).phase).toBe('reserve')
  })

  it('lays a Luzurus trap that binds the opposing leader stepping on it', () => {
    let state = frame(duel({ id: 'luzurus' }), { ...CALL, right: true })
    state = run(state, STAY.enter + STAY.startup)
    const trapX = slotOf(state).trap!.x
    expect(trapX - state.player.x).toBeCloseTo(8)
    state = { ...state, opponent: { ...state.opponent, x: trapX + 2 } }
    state = frame(state)
    expect(state.opponent.hatsuEffects.desireFrames).toBeGreaterThan(0)
    expect(slotOf(state).trap).toBeUndefined()
  })

  it('lets the AI call its own kameo when the effect would help', () => {
    const wounded = duel({ id: 'tubeppa', mode: 'versus-ai', side: 'opponent' })
    const hurt = { ...wounded, opponent: { ...wounded.opponent, health: 100 } }
    expect(slotOf(frame(hurt), 'opponent').phase).toBe('entering')
    const healthy = duel({ id: 'tubeppa', mode: 'versus-ai', side: 'opponent' })
    expect(slotOf(frame(healthy), 'opponent').phase).toBe('reserve')
    const local = duel({ id: 'tubeppa', side: 'opponent', opponent: { health: 100 } })
    expect(slotOf(frame(local), 'opponent').phase).toBe('reserve')
  })
})
