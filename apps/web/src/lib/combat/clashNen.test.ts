import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from './reducer'
import { clashAttackFactor, clashDamageFactor, CLASH_KO_COST, CLASH_KO_HOLD } from './clashNen'
import type { CombatAction, CombatState, FighterState } from './types'
import type { MoveSlot } from '../fighting/types'

const setup = {
  playerAt: [0, 0] as const,
  opponentAt: [1.5, 0] as const,
  terrain: initialCombatState().terrain,
}

function clashDuel(
  player: Partial<FighterState> = {},
  opponent: Partial<FighterState> = {},
): CombatState {
  const base = initialCombatState(setup)
  return {
    ...base,
    nenRules: 'clash',
    player: { ...base.player, ...player },
    opponent: { ...base.opponent, ...opponent },
  }
}

const act = (state: CombatState, action: CombatAction) => combatReducer(state, action)
const tick = (state: CombatState, seconds: number) => act(state, { type: 'TICK', dt: seconds })
const press = (state: CombatState, slot: MoveSlot) =>
  act(state, {
    type: 'FIGHTING_MOVE',
    side: 'player',
    fighterId: 'kurapika',
    slot,
    targetAt: [3, 0],
  })

describe("Clash's aura economy in Arena", () => {
  it.each([
    ['ten', {}, 1.4],
    ['ren', { mode: 'ren' as const }, -4],
    ['ken', { ken: true }, -8],
    ['zetsu', { mode: 'zetsu' as const }, 10],
    ['gyo in ten', { gyo: true }, -2.4],
    ['in in ren', { mode: 'ren' as const, in: true }, -7],
  ])('%s flows at its Clash rate', (_, fighter, perSecond) => {
    const state = tick(clashDuel({ aura: 50, ...fighter }), 1)
    expect(state.player.aura).toBeCloseTo(50 + perSecond)
  })

  it('leaves every other duel on its own economy', () => {
    const legacy = tick(
      { ...initialCombatState(setup), player: { ...initialCombatState(setup).player, aura: 50 } },
      1,
    )
    expect(legacy.nenRules).toBeUndefined()
    expect(legacy.player.aura).toBe(50)
  })
})

describe("Clash's exchange factors in Arena", () => {
  it('lets a Zetsu body still land a physical blow, at Clash’s 0.7', () => {
    const zetsu = clashDuel({ mode: 'zetsu' })
    expect(clashAttackFactor(zetsu.player, 'hands')).toBe(0.7)
    const landed = tick(press(zetsu, 'standingLight'), 4 / 60)
    expect(landed.lastEvent?.impact).toBe('clean')
  })

  it('makes a Zetsu body take more than Ten, and Ken take less', () => {
    const { player: ten } = clashDuel()
    const { player: zetsu } = clashDuel({ mode: 'zetsu' })
    const { player: ken } = clashDuel({ ken: true })
    expect(clashDamageFactor(zetsu, 'torso')).toBeGreaterThan(clashDamageFactor(ten, 'torso'))
    expect(clashDamageFactor(ken, 'head')).toBeLessThan(clashDamageFactor(ten, 'head'))
  })

  it('blocks a Clash move with the guard command, but not a throw', () => {
    const guarded = act(clashDuel(), { type: 'GUARD', side: 'opponent' })
    expect(tick(press(guarded, 'standingLight'), 4 / 60).lastEvent?.impact).toBe('blocked')
    const thrown = tick(press(guarded, 'throw'), 7 / 60)
    expect(thrown.lastEvent?.impact).not.toBe('blocked')
  })
})

describe("Clash's Ko in Arena", () => {
  it('engages on a zone for the next move instead of striking by itself', () => {
    const engaged = act(clashDuel(), { type: 'KO', side: 'player', zone: 'arms' })
    expect(engaged.player.aura).toBe(100 - CLASH_KO_COST)
    expect(engaged.player.ko?.zone).toBe('arms')

    const lapsed = tick(engaged, CLASH_KO_HOLD + 0.1)
    expect(lapsed.player.ko).toBeNull()
    expect(lapsed.lastEvent).toBeNull()
  })

  it('turns a jab on the Ko limb into a critical aura strike, then is spent', () => {
    const plain = tick(press(clashDuel(), 'standingLight'), 4 / 60)
    expect(plain.lastEvent?.impact).toBe('clean')

    const engaged = act(clashDuel(), { type: 'KO', side: 'player', zone: 'arms' })
    const struck = tick(press(engaged, 'standingLight'), 4 / 60)
    expect(struck.lastEvent?.impact).toBe('critical')
    expect(struck.player.ko).toBeNull()
  })

  it('lets the body walk while the Ko is held, and refuses a Ryu shift', () => {
    const engaged = act(clashDuel(), { type: 'KO', side: 'player', zone: 'arms' })
    const walking = tick(act(engaged, { type: 'MOVE', side: 'player', vector: [0, 1] }), 0.1)
    expect(walking.player.position[1]).toBeGreaterThan(0)
    expect(act(engaged, { type: 'RYU', side: 'player', guard: 'head' })).toBe(engaged)
  })

  it('weakens a blow from another limb and bares every other zone', () => {
    const { player } = act(clashDuel(), { type: 'KO', side: 'player', zone: 'legs' })
    expect(clashAttackFactor(player, 'hands')).toBe(0.7)
    expect(clashDamageFactor(player, 'head')).toBeGreaterThan(clashDamageFactor(player, 'feet'))
  })
})
