import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { toggleChrolloBookmark } from './chrolloBook'
import { attackData } from './frameData'
import { FIXED_STEP } from './fightClock'
import { REPLAY_FIGHTERS, type ReplayFighter } from './fightReplayTypes'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function duel(id: ReplayFighter): FightState {
  const state = beginFight(
    createFight(id, id === 'chrollo' ? 'hisoka' : 'chrollo', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50, aura: 100, guardFrames: 30 },
  }
}
function frames(state: FightState, count: number, opponent: Partial<FightInput> = {}): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, {
      dt: FIXED_STEP,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, ...opponent },
    })
  return state
}
const strike = (
  state: FightState,
  action: 'light' | 'heavy' | 'special' | 'throw',
  input: Partial<FightInput> = {},
) => performTrainingAction({ state, side: 'player', action, input: { ...EMPTY_INPUT, ...input } })

describe.each(REPLAY_FIGHTERS)('%s reference confrontation situations', (id) => {
  it('requires crouching guard for a low heavy strike', () => {
    const low = frames(strike(duel(id), 'heavy', { down: true }), 40, { guard: true, down: true })
    const high = frames(strike(duel(id), 'heavy', { down: true }), 40, { guard: true })
    expect(low.impact?.blocked).toBe(true)
    expect(high.impact?.blocked).toBe(false)
    expect(high.opponent.health).toBeLessThan(low.opponent.health)
  })
  it('can intercept an actual jumping opponent with the standing heavy', () => {
    const jumped = frames(duel(id), 8, { jump: true })
    expect(jumped.opponent.y).toBeGreaterThan(0)
    const result = frames(strike(jumped, 'heavy'), 30)
    expect(result.impact?.attacker).toBe('player')
    expect(result.impact?.antiAir).toBe(true)
  })
  it('resolves simultaneous close throws as a tech without damage', () => {
    let state = duel(id)
    state = { ...state, player: { ...state.player, x: 46 } }
    for (const side of ['player', 'opponent'] as const) {
      const book = state[side].chrolloBook
      if (book?.open)
        state = { ...state, [side]: { ...state[side], chrolloBook: toggleChrolloBookmark(book) } }
    }
    const first = strike(state, 'throw')
    const both = performTrainingAction({ state: first, side: 'opponent', action: 'throw' })
    expect(both.player.attack?.variant).toBe('throw')
    expect(both.opponent.attack?.variant).toBe('throw')
    const result = frames(both, 9)
    expect(result.throwTech).toBeDefined()
    expect(result.player.health).toBe(state.player.health)
    expect(result.opponent.health).toBe(state.opponent.health)
    expect(result.score).toEqual(state.score)
  })
  it.each([1, -1] as const)(
    'creates space after guard pressure at the wall facing %i',
    (facing) => {
      const fresh = duel(id)
      const state = {
        ...fresh,
        player: { ...fresh.player, x: facing === 1 ? 87 : 13, facing },
        opponent: {
          ...fresh.opponent,
          x: facing === 1 ? 93 : 7,
          facing: facing === 1 ? (-1 as const) : (1 as const),
        },
      }
      const result = frames(strike(state, 'heavy'), 40, { guard: true })
      expect(result.impact?.blocked).toBe(true)
      expect(Math.abs(result.player.x - result.opponent.x)).toBeGreaterThan(6)
    },
  )
  it('leaves a whiffed heavy punishable during its declared recovery', () => {
    const started = strike(duel(id), 'heavy')
    const data = attackData('heavy', started.player)
    // Controlled lab situation: the heavy has whiffed and just entered recovery.
    const recovering = {
      ...started,
      player: {
        ...started.player,
        attack: { ...started.player.attack!, frame: data.startup + data.active },
      },
    }
    const counter = performTrainingAction({ state: recovering, side: 'opponent', action: 'light' })
    const result = frames(counter, 20)
    expect(result.impact?.attacker).toBe('opponent')
    expect(result.impact?.punish).toBe(true)
  })
  it('respects finite wakeup protection, then permits the next strike', () => {
    const fresh = duel(id)
    const waking = {
      ...fresh,
      opponent: { ...fresh.opponent, pose: 'wakeup' as const, wakeupInvulnerableFrames: 10 },
    }
    const protectedHit = frames(strike(waking, 'light'), 9)
    expect(protectedHit.opponent.health).toBe(waking.opponent.health)
    const ready = frames(protectedHit, 30)
    const exposed = frames(strike(ready, 'light'), 20)
    expect(exposed.opponent.health).toBeLessThan(waking.opponent.health)
  })
  it('refuses Hatsu under exhausted Zetsu without paying a new aura cost', () => {
    const fresh = duel(id)
    const exhausted = {
      ...fresh,
      player: {
        ...fresh.player,
        aura: 0,
        auraExhausted: true,
        nen: { ...fresh.player.nen, mode: 'zetsu' as const },
      },
    }
    const result = strike(exhausted, 'special')
    expect(result.player.attack).toBeNull()
    expect(result.player.aura).toBe(0)
    expect(result.commandFeedback?.player?.outcome).toBe('refused')
    expect(['nen', 'aura']).toContain(result.commandFeedback?.player?.reason)
  })
})
