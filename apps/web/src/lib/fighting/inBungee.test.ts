import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { FIGHT_HATSU_AURA_COST } from './hatsu'
import { IN_CHARGE_FRAMES } from './nen'
import { EMPTY_INPUT } from './types'

function advance(state: ReturnType<typeof createFight>, seconds: number, input = EMPTY_INPUT) {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) {
    next = tickFight(next, input, 0.02)
  }
  return next
}

function closeHisokaFight() {
  const state = beginFight(createFight('hisoka', 'kurapika'))
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 54, hitStun: 90 },
  }
}

describe('In and Bungee Gum', () => {
  it('conceals a charged Hisoka Hatsu at an added aura and startup cost', () => {
    let state = advance(closeHisokaFight(), 0.5, { ...EMPTY_INPUT, hatsu: true })
    expect(state.player.hatsuChargeFrames).toBeGreaterThanOrEqual(IN_CHARGE_FRAMES)
    expect(state.player.nen.in).toBe(true)

    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      auraCharged: false,
    })
    expect(state.player.attack).toMatchObject({ kind: 'special', concealed: true })
    expect(state.player.aura).toBeLessThan(100 - FIGHT_HATSU_AURA_COST)

    const beforeHiddenImpact = advance(state, 0.3)
    expect(beforeHiddenImpact.impact).toBeNull()
    const attached = advance(beforeHiddenImpact, 0.35)
    expect(attached.impact).toMatchObject({ attacker: 'player', concealed: true })
    expect(attached.bungeeGum).toEqual({ owner: 'player', target: 'opponent', hidden: true })
  })

  it('leaves a quick Bungee Gum visible and retracts an existing attachment', () => {
    let state = performAuraAttack({
      state: closeHisokaFight(),
      side: 'player',
      kind: 'special',
      auraCharged: false,
    })
    state = advance(state, 0.5)
    expect(state.bungeeGum?.hidden).toBe(false)

    state = {
      ...state,
      player: { ...state.player, aura: 100, attack: null, hitStun: 0, blockStun: 0 },
      opponent: { ...state.opponent, x: 80, hitStun: 0, blockStun: 0 },
    }
    const retracted = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      auraCharged: false,
    })
    expect(retracted.bungeeGum).toBeNull()
    expect(Math.abs(retracted.opponent.x - retracted.player.x)).toBeLessThanOrEqual(9)
  })
})
