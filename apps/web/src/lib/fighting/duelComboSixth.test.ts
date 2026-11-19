import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performAuraAttack, performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { activeHitbox } from './frameData'
import { hatsuAvoidsImpact, hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { secretWindowVisibleTo } from './secretWindow'
import { BEYOND_CURSE } from './beyondCurse'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['theta', 'musse', 'furykov', 'beyond'] as const
function tick(state: FightState) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: { ...EMPTY_INPUT, guard: Boolean(state.impact) },
  })
}
function command(state: FightState, slot: MoveSlot) {
  return performMove({
    state,
    side: 'player',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.player.facing),
  })
}
function play(id: string, options: { initial?: FightState; steps?: number } = {}) {
  const route = combatRoute(id)
  let state = options.initial ?? createCombatRouteFight(route)
  let spent = 0
  const timings: number[] = []
  for (const [step, slot] of route.moves.slice(0, options.steps ?? route.moves.length).entries()) {
    const move = moveForSlot(route.fighter, slot)!
    for (let i = 0; i < 120 && !canStartFighterAttack(state.player, move.kind, move.id); i++)
      state = tick(state)
    const before = state.player.aura
    const started = state.frame
    state = command(state, slot)
    spent += before - state.player.aura
    expect(state.player.attack?.moveId).toBe(move.id)
    for (let i = 0; i < 120 && state.opponent.comboHits !== step + 1; i++) state = tick(state)
    expect(state.opponent.comboHits).toBe(step + 1)
    expect(state.impact?.blocked).toBe(false)
    timings.push(state.frame - started)
  }
  return {
    state,
    spent,
    timings,
    damage: state.opponent.comboDamage,
    distance: Math.abs(state.player.x - state.opponent.x),
  }
}

describe.each(FIGHTERS)('%s conversion choices', (fighter) => {
  it('offers eight routes and distinct free sweep and carry outcomes', () => {
    expect(combatRoutesFor(fighter)).toHaveLength(8)
    const sweep = play(`${fighter}:economy`)
    const carry = play(`${fighter}:carry`)
    expect(sweep.spent).toBe(0)
    expect(carry.spent).toBe(0)
    expect(carry.damage).toBeGreaterThan(sweep.damage)
    expect(carry.distance).toBeGreaterThan(sweep.distance + 2)
    expect(sweep.state.opponent.knockdownFrames).toBeGreaterThan(0)
    expect(carry.state.opponent.knockdownFrames).toBeGreaterThan(0)
  })
  it('preserves the selected free finisher without routing it into a power', () => {
    const { state } = play(`${fighter}:economy`, { steps: 2 })
    const aura = state.player.aura
    expect(command(state, 'lowHeavy').player.attack?.moveId).toBe(`${fighter}:lowHeavy`)
    expect(command(state, 'lowHeavy').player.aura).toBe(aura)
    expect(command(state, 'forwardHeavy').player.attack?.moveId).toBe(`${fighter}:forwardHeavy`)
  })
})

describe('sixth expansion personal mechanics', () => {
  it.each([
    ['neutralSpecial', 'torso'],
    ['forwardSpecial', 'head'],
    ['downSpecial', 'feet'],
  ] as const)('Theta converts into an actual %s bullet aimed at %s', (slot, zone) => {
    let state = play('theta:economy', { steps: 2 }).state
    const before = state
    state = command(state, slot)
    expect(state.player.aura).toBe(before.player.aura)
    expect(state.player.attack).toMatchObject({
      kind: 'ranged',
      moveId: `theta:${slot}`,
      hatsuSource: null,
    })
    expect(state.opponent.health).toBe(before.opponent.health)
    expect(activeHitbox(state.player)).toBeNull()
    for (let i = 0; i < 90 && state.opponent.comboHits < 3; i++) state = tick(state)
    expect(state.opponent.comboHits).toBe(3)
    expect(state.impact?.projectileId).toBeGreaterThan(0)
    expect(state.impact?.zone).toBe(zone)
    expect(state.nextProjectileId - before.nextProjectileId).toBe(1)
    expect(state.player.attack?.projectileSpawned).toBe(true)
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
    expect(state.opponent.aura).toBe(100)
  })

  it('Theta’s confirmed shot still works without aura or voluntary Nen', () => {
    const before = play('theta:economy', { steps: 2 }).state
    const initial = {
      ...before,
      player: {
        ...before.player,
        aura: 0,
        auraExhausted: true,
        nen: { ...before.player.nen, mode: 'zetsu' as const },
        on: { grudge: 0, sealFrames: 120 },
      },
    }
    let state = command(initial, 'neutralSpecial')
    expect(state.player.attack?.moveId).toBe('theta:neutralSpecial')
    expect(state.player.aura).toBe(0)
    for (let i = 0; i < 90 && state.opponent.comboHits < 3; i++) state = tick(state)
    expect(state.opponent.comboHits).toBe(3)
    expect(state.impact?.projectileId).toBeGreaterThan(0)
  })

  it('Musse physically attaches a private owl before a normal damaging conversion', () => {
    const initial = createCombatRouteFight(combatRoute('musse:owl'))
    expect(initial.frame).toBeGreaterThanOrEqual(34)
    expect(initial.player.aura).toBeGreaterThanOrEqual(84)
    expect(initial.player.aura).toBeLessThan(86)
    expect(initial.player.secretWindow?.target).toBe('opponent')
    expect(secretWindowVisibleTo(initial, 'player', 'player')).toBe(true)
    expect(secretWindowVisibleTo(initial, 'player', 'opponent')).toBe(false)
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(initial.opponent.hitStun).toBe(0)
    expect(initial.opponent.comboHits).toBe(0)
    const result = play('musse:owl', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(4)
    expect(Object.keys(result.state.player.secretWindow!.observation).sort()).toEqual([
      'action',
      'frame',
    ])
    expect(result.state.player.secretWindow!.observation.frame).toBeGreaterThan(initial.frame)
    const plain = createCombatRouteFight({ ...combatRoute('musse:owl'), setup: undefined })
    expect(play('musse:owl', { initial: plain }).damage).toBe(result.damage)
    expect(hatsuDefenceFactor(result.state.opponent)).toBe(1)
  })

  it('Furykov prepares the real console without converting its information into a buff', () => {
    const initial = createCombatRouteFight(combatRoute('furykov:console'))
    expect(initial.frame).toBeGreaterThan(0)
    expect(initial.player.aura).toBeGreaterThanOrEqual(60)
    expect(initial.player.aura).toBeLessThan(62)
    expect(initial.player.comboMaster).toEqual({ alert: null })
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(initial.opponent.comboHits).toBe(0)
    expect(hatsuDamageFactor(initial.player)).toBe(1)
    expect(hatsuDefenceFactor(initial.player)).toBe(1)
    expect(hatsuAvoidsImpact(initial.player)).toBe(false)
    const result = play('furykov:console', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.state.player.comboMaster).toEqual({ alert: null })
    expect(play('furykov:economy', { initial }).damage).toBe(play('furykov:economy').damage)
    const waiting = play('furykov:console', { initial, steps: 3 }).state
    // The former recovery link is a chain under the derived grammar (COMBO_GRAMMAR.md, lot 4).
    expect(comboChoices(waiting).find((choice) => choice.move.slot === 'backHeavy')?.status).toBe(
      'ready',
    )
  })

  it.each([
    ['beyond:palm', 24],
    ['beyond:low-strike', 20],
  ] as const)('Beyond pays for %s as a real physical strike', (id, cost) => {
    const result = play(id)
    expect(result.spent).toBe(cost)
    expect(result.state.impact?.projectileId).toBeNull()
    expect(result.state.opponent.knockdownFrames).toBeGreaterThan(0)
    expect(result.state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
    expect(result.damage).toBeGreaterThan(play('beyond:economy').damage)
  })

  it('Beyond retains a free ending without aura and cannot substitute the sacrificial curse', () => {
    const before = play('beyond:economy', { steps: 2 }).state
    const state = { ...before, player: { ...before.player, aura: 0, health: 1 } }
    expect(command(state, 'forwardSpecial').player.attack).toBe(state.player.attack)
    expect(command(state, 'lowHeavy').player.attack?.moveId).toBe('beyond:lowHeavy')
    const curse = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: BEYOND_CURSE.id,
      auraCharged: false,
    })
    expect(curse.player.attack).toBe(state.player.attack)
    expect(curse.opponent.health).toBe(state.opponent.health)
    expect(command(state, 'finisher').player.attack).toBe(state.player.attack)
  })

  it.each(['musse', 'furykov'] as const)(
    '%s keeps the information utility outside damaging cancels',
    (fighter) => {
      const state = play(`${fighter}:economy`, { steps: 2 }).state
      expect(comboChoices(state).every((choice) => choice.move.kind !== 'special')).toBe(true)
      expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
      expect(command(state, 'neutralSpecial').player.aura).toBe(state.player.aura)
    },
  )
})
