import { describe, expect, it, vi } from 'vitest'
import { beginFight, createFight, opponentAttack, performAttack, tickFight, useNen } from './engine'
import { EMPTY_INPUT } from './types'

function advance(state: ReturnType<typeof createFight>, seconds: number) {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) {
    next = tickFight(next, EMPTY_INPUT, 0.02)
  }
  return next
}

describe('fighting engine', () => {
  it('starts a duel with the selected Black Whale fighters', () => {
    const state = createFight('kurapika', 'hisoka')
    expect(state.player.id).toBe('kurapika')
    expect(state.opponent.id).toBe('hisoka')
    expect(beginFight(state).phase).toBe('fighting')
  })

  it('deals damage on the strike frame rather than on button press', () => {
    let state = beginFight(createFight('benjamin', 'morena'))
    state = { ...state, player: { ...state.player, x: 46 }, opponent: { ...state.opponent, x: 52 } }
    const armed = performAttack(state, 'player', 'heavy')
    expect(armed.opponent.health).toBe(100)
    expect(armed.impact).toBeNull()
    const struck = advance(armed, 0.24)
    expect(struck.opponent.health).toBeLessThan(100)
    expect(struck.impact?.kind).toBe('heavy')
  })

  it('reduces damage while guarding', () => {
    let state = beginFight(createFight('kurapika', 'chrollo'))
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 52, blocking: true },
    }
    const struck = advance(performAttack(state, 'player', 'heavy'), 0.24)
    expect(struck.impact?.blocked).toBe(true)
    expect(struck.impact?.damage).toBeLessThan(12)
  })

  it('spends aura on a special attack', () => {
    let state = beginFight(createFight('hisoka', 'tserriednich'))
    state = {
      ...state,
      player: { ...state.player, x: 40, aura: 70 },
      opponent: { ...state.opponent, x: 58 },
    }
    const armed = performAttack(state, 'player', 'special')
    expect(armed.player.aura).toBe(30)
    expect(armed.opponent.health).toBe(100)
    const struck = advance(armed, 0.4)
    expect(struck.opponent.health).toBeLessThan(100)
  })

  it('lets a quicker strike interrupt a heavy attack before impact', () => {
    let state = beginFight(createFight('benjamin', 'hisoka'))
    state = { ...state, player: { ...state.player, x: 46 }, opponent: { ...state.opponent, x: 52 } }
    state = performAttack(state, 'player', 'heavy')
    state = performAttack(state, 'opponent', 'light')
    const interrupted = advance(state, 0.3)
    expect(interrupted.player.health).toBeLessThan(100)
    expect(interrupted.opponent.health).toBe(100)
    expect(interrupted.player.attack).toBeNull()
  })

  it('ends on time and awards the healthier fighter', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = { ...state, time: 0.01, opponent: { ...state.opponent, health: 60 } }
    const ended = tickFight(state, EMPTY_INPUT, 0.02)
    expect(ended.phase).toBe('finished')
    expect(ended.winner).toBe('player')
  })

  it('lets the opponent attack at close range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    let state = beginFight(createFight('kurapika', 'benjamin'))
    state = { ...state, player: { ...state.player, x: 47 }, opponent: { ...state.opponent, x: 53 } }
    const armed = opponentAttack(state)
    expect(armed.player.health).toBe(100)
    expect(advance(armed, 0.25).player.health).toBeLessThan(100)
    vi.restoreAllMocks()
  })

  it('starts in Ten and exposes the standard Nen techniques', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    expect(state.player.nen.mode).toBe('ten')
    state = useNen(state, 'player', 'ren')
    expect(state.player.nen.mode).toBe('ren')
    state = useNen(state, 'player', 'gyo')
    expect(state.player.nen.gyo).toBe(true)
    state = useNen(state, 'player', 'en')
    expect(state.player.nen.en?.radius).toBe(12)
  })

  it('uses Zetsu to recover aura but prevents Hatsu', () => {
    let state = beginFight(createFight('hisoka', 'morena'))
    state = {
      ...state,
      player: { ...state.player, x: 40, aura: 50 },
      opponent: { ...state.opponent, x: 58 },
    }
    state = useNen(state, 'player', 'zetsu')
    const denied = performAttack(state, 'player', 'special')
    expect(denied.opponent.health).toBe(100)
    expect(tickFight(state, EMPTY_INPUT, 0.05).player.aura).toBeGreaterThan(50)
    expect(useNen(state, 'player', 'ken').player.nen.ken).toBe(false)
  })

  it('makes Ken reduce incoming Nen damage', () => {
    let exposed = beginFight(createFight('benjamin', 'chrollo'))
    exposed = {
      ...exposed,
      player: { ...exposed.player, x: 46 },
      opponent: { ...exposed.opponent, x: 52 },
    }
    const guarded = useNen(exposed, 'opponent', 'ken')
    const exposedHit = advance(performAttack(exposed, 'player', 'heavy'), 0.24)
    const guardedHit = advance(performAttack(guarded, 'player', 'heavy'), 0.24)
    expect(guardedHit.impact!.damage).toBeLessThan(exposedHit.impact!.damage)
  })

  it('concentrates Ko into the next strike, then releases it', () => {
    let base = beginFight(createFight('kurapika', 'hisoka'))
    base = {
      ...base,
      player: { ...base.player, x: 46, aura: 90 },
      opponent: { ...base.opponent, x: 52 },
    }
    const focused = useNen(base, 'player', 'ko')
    const normalHit = advance(performAttack(base, 'player', 'heavy'), 0.24)
    const koHit = advance(performAttack(focused, 'player', 'heavy'), 0.24)
    expect(koHit.impact!.damage).toBeGreaterThan(normalHit.impact!.damage)
    expect(koHit.player.nen.ko).toBeNull()
    expect(koHit.player.nen.ryu).toEqual({})
  })
})
