import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { FIGHT_HATSU_AURA_COST, hatsuFor } from './hatsu'
import { BUNGEE_REST_DISTANCE } from './hatsu/hisoka'
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
    expect(attached.bungeeGum).toEqual({
      owner: 'player',
      target: 'opponent',
      hidden: true,
      retracting: false,
    })
  })

  it('leaves a quick Bungee Gum visible and retracts it as an elastic pull', () => {
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
    const gap = (next: typeof state) => Math.abs(next.opponent.x - next.player.x)
    const retracting = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      auraCharged: false,
    })
    // No teleport: the trigger only puts the stretched gum under tension.
    expect(retracting.opponent.x).toBe(80)
    expect(retracting.bungeeGum).toMatchObject({ owner: 'player', retracting: true })

    const firstFrame = tickFight(retracting, EMPTY_INPUT, 1 / 60)
    expect(gap(firstFrame)).toBeLessThan(gap(retracting))
    expect(gap(firstFrame)).toBeGreaterThan(20)

    // Reeled into the still-active special, the target is struck on arrival and
    // the gum sticks again, slack, as in the Kastro fight.
    const reeled = advance(retracting, 1)
    expect(gap(reeled)).toBeLessThan(20)
    expect(reeled.impact?.attacker).toBe('player')
    expect(reeled.impact?.sequence).toBeGreaterThan(retracting.impact?.sequence ?? 0)
    expect(reeled.bungeeGum).toMatchObject({ owner: 'player', retracting: false })
  })

  it('pulls harder the more the gum is stretched, and stops at rest length', () => {
    const base = beginFight(createFight('hisoka', 'kurapika'))
    const tense = (opponentX: number) => ({
      ...base,
      player: { ...base.player, x: 20 },
      opponent: { ...base.opponent, x: opponentX },
      bungeeGum: {
        owner: 'player' as const,
        target: 'opponent' as const,
        hidden: false,
        retracting: true,
      },
    })
    const pull = (opponentX: number) =>
      opponentX - hatsuFor('hisoka').onFrame(tense(opponentX)).opponent.x
    expect(pull(85)).toBeGreaterThan(pull(40))
    expect(pull(40)).toBeGreaterThan(0)

    const slack = hatsuFor('hisoka').onFrame(tense(20 + BUNGEE_REST_DISTANCE))
    expect(slack.opponent.x).toBe(20 + BUNGEE_REST_DISTANCE)
    expect(slack.bungeeGum).toMatchObject({ retracting: false })
  })
})
