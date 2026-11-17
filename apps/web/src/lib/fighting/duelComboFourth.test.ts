import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { SENSE_BITS } from './saiyuSenses'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['saiyu', 'bonolenov', 'hinrigh', 'mizaistom'] as const
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

describe('fourth expansion personal mechanics', () => {
  it.each([
    ['neutralSpecial', 'sight', 40],
    ['forwardSpecial', 'hearing', 24],
    ['downSpecial', 'speech', 20],
  ] as const)('Saiyu selects %s without sealing any other sense', (slot, sense, cost) => {
    let state = play('saiyu:economy', { steps: 2 }).state
    const before = state.player.aura
    state = command(state, slot)
    expect(before - state.player.aura).toBe(cost)
    for (let i = 0; i < 90 && state.opponent.comboHits < 3; i++) state = tick(state)
    expect(state.opponent.comboHits).toBe(3)
    expect(state.opponent.hatsuEffects.senseSeals).toBe(SENSE_BITS[sense])
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBeFalsy()
  })

  it('Bonolenov prepares real Prologue and links the spear after recovery', () => {
    const initial = createCombatRouteFight(combatRoute('bonolenov:spear'))
    expect(initial.frame).toBeGreaterThanOrEqual(60)
    expect(initial.player.battleCantabile?.prologue).toBe(true)
    expect(initial.player.aura).toBeGreaterThanOrEqual(60)
    expect(initial.player.aura).toBeLessThan(62)
    let state = play('bonolenov:spear', { initial, steps: 2 }).state
    const choice = comboChoices(state).find((entry) => entry.move.slot === 'forwardSpecial')
    expect(choice?.status).toBe('wait')
    expect(command(state, 'forwardSpecial').player.attack).toBe(state.player.attack)
    const result = play('bonolenov:spear', { initial })
    expect(result.spent).toBe(12)
    expect(result.timings).toHaveLength(3)
    state = play('bonolenov:economy', { steps: 2 }).state
    expect(comboChoices(state).find((entry) => entry.move.slot === 'forwardSpecial')?.status).toBe(
      'unavailable',
    )
    expect(command(state, 'forwardSpecial').player.attack).toBe(state.player.attack)
    expect(play('bonolenov:economy', { initial }).damage).toBe(play('bonolenov:economy').damage)
  })

  it('Hinrigh captures with an actual inventory object and damage opens the cuffs', () => {
    const initial = createCombatRouteFight(combatRoute('hinrigh:capture'))
    expect(initial.frame).toBeGreaterThanOrEqual(18)
    expect(initial.player.aura).toBeLessThan(81)
    expect(initial.opponent.biohazardRestraint?.owner).toBe('player')
    expect(
      initial.player.biohazard?.objects.filter((object) => object.phase === 'bound'),
    ).toHaveLength(1)
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(initial.opponent.hitStun).toBe(0)
    let state = play('hinrigh:capture', { initial, steps: 1 }).state
    state = tick(state)
    expect(state.opponent.biohazardRestraint).toBeUndefined()
    expect(state.opponent.biohazardGraceFrames).toBeGreaterThan(0)
    const result = play('hinrigh:capture', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.biohazardRestraint).toBeUndefined()
    expect(result.state.player.biohazard?.objects.some((object) => object.phase === 'broken')).toBe(
      true,
    )
  })

  it('Mizaistom shows the card without damage and physical pushback never confines the warned target', () => {
    const initial = createCombatRouteFight(combatRoute('mizaistom:warning'))
    expect(initial.frame).toBeGreaterThanOrEqual(18)
    expect(initial.player.aura).toBeLessThan(61)
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(initial.opponent.crossGame).toMatchObject({ phase: 'warning', noticeFrames: 0 })
    expect(initial.opponent.hitStun).toBe(0)
    const result = play('mizaistom:warning', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.crossGame?.phase).toBe('warning')
    const violation = performMove({ state: initial, side: 'opponent', action: 'light' })
    expect(violation.opponent.crossGame?.phase).toBe('restrained')
    expect(violation.opponent.health).toBe(initial.opponent.health)
  })

  it.each(['hinrigh', 'mizaistom'] as const)(
    '%s never offers utility as a guaranteed damaging cancel',
    (fighter) => {
      const state = play(`${fighter}:economy`, { steps: 2 }).state
      expect(comboChoices(state).every((choice) => choice.move.kind !== 'special')).toBe(true)
      expect(command(state, 'neutralSpecial').player.aura).toBe(state.player.aura)
    },
  )
})
