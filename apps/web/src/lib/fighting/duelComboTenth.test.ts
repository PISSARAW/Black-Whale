import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { hatsuAvoidsImpact, hatsuDamageFactor } from './hatsu'
import { readyCohort, createBattlefield } from './preparationWorld'
import { canActivateLsdf } from './lsdf'
import { createFightEnvironment } from './fightEnvironment'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['halkenburg', 'yokotani'] as const
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
  it('keeps eight native routes plus six support routes and distinct free sweep and carry outcomes', () => {
    expect(combatRoutesFor(fighter).filter((route) => !route.kameo)).toHaveLength(8)
    expect(combatRoutesFor(fighter).filter((route) => route.kameo)).toHaveLength(6)
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

describe('roster completion and returning conversion branches', () => {
  it('Halkenburg gathers his real marked consenting cohort over eight simulated seconds without firing', () => {
    const initial = createCombatRouteFight(combatRoute('halkenburg:cohort'))
    expect(initial.frame).toBeGreaterThanOrEqual(480)
    expect(readyCohort(initial, 'player')).toHaveLength(3)
    for (const supporter of readyCohort(initial, 'player'))
      expect(supporter).toMatchObject({ material: 'real', feather: true, consenting: true })
    expect(initial.player.hatsuEffects.cohortWillFrames).toBe(480)
    expect(initial.player.hatsuEffects.arrowNocked).toBe(0)
    expect(initial.player.aura).toBe(100)
    expect(initial.player.health).toBe(initial.player.maxHealth)
    const result = play('halkenburg:cohort', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.state.player.health).toBe(initial.player.health)
    expect(result.state.player.hatsuEffects.cohortWillFrames).toBe(480)
    expect(result.state.opponent.hatsuEffects.possessedFrames).toBe(0)
    expect(result.state.player.halkenburgSupporter).toBeUndefined()
  })

  it('Halkenburg requires the actual cohort for an arrow and cannot cancel into it even when ready', () => {
    const plain = createCombatRouteFight(combatRoute('halkenburg:economy'))
    expect(readyCohort(plain, 'player')).toHaveLength(0)
    expect(command(plain, 'neutralSpecial').player.aura).toBe(plain.player.aura)
    const initial = createCombatRouteFight(combatRoute('halkenburg:cohort'))
    const fired = command(initial, 'neutralSpecial')
    expect(fired.player.health).toBe(initial.player.health - 8)
    expect(fired.player.hatsuEffects.arrowNocked).toBe(1)
    expect(fired.opponent.health).toBe(initial.opponent.health)
    const busy = play('halkenburg:cohort', { initial, steps: 3 }).state
    const refused = command(busy, 'neutralSpecial')
    expect(refused.player.attack).toBe(busy.player.attack)
    expect(refused.player.health).toBe(busy.player.health)
    expect(refused.player.aura).toBe(busy.player.aura)
    expect(busy.opponent.hatsuEffects.possessedFrames).toBe(0)
  })

  it('Yokotani performs five physical strikes without inventing jurisdiction or a guard restraint', () => {
    const initial = createCombatRouteFight(combatRoute('yokotani:five-strikes'))
    expect(canActivateLsdf(initial, 'player')).toBe(false)
    expect(command(initial, 'neutralSpecial').lsdf).toBeUndefined()
    const result = play('yokotani:five-strikes', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.state.lsdf).toBeUndefined()
    expect(result.state.expulsion).toBeUndefined()
    expect(hatsuAvoidsImpact(result.state.player)).toBe(false)
    expect(hatsuDamageFactor(result.state.player)).toBe(1)
  })

  it('Yokotani retains the real non-damaging introduction only in the qualified hideout', () => {
    const base = createCombatRouteFight(combatRoute('yokotani:economy'))
    const environment = createFightEnvironment({
      stageId: 'heilly-hideout',
      morenaPresent: true,
      unlawfulIntruders: { player: false, opponent: true },
    })
    const initial = { ...base, environment, battlefield: createBattlefield(environment) }
    expect(canActivateLsdf(initial, 'player')).toBe(true)
    let state = command(initial, 'neutralSpecial')
    expect(state.player.aura).toBe(initial.player.aura - 40)
    expect(state.player.attack).toBeNull()
    expect(state.lsdf?.player).toMatchObject({ target: 'opponent', phase: 'approaching' })
    for (let i = 0; i < 20; i++) state = tick(state)
    expect(state.opponent.health).toBe(initial.opponent.health)
    expect(state.opponent.comboHits).toBe(0)
    expect(state.impact).toBeNull()
    expect(state.opponent.x).not.toBe(initial.opponent.x)
    expect(hatsuAvoidsImpact(state.player)).toBe(false)
  })
})

describe.each(['kurapika', 'benjamin'] as const)('%s returning branches', (fighter) => {
  it('retains the eight previous examples and adds four recovery conversions', () => {
    expect(combatRoutesFor(fighter).filter((route) => !route.kameo)).toHaveLength(12)
    expect(combatRoutesFor(fighter).filter((route) => route.kameo)).toHaveLength(6)
    expect(
      combatRoutesFor(fighter).filter((route) => !route.kameo && !route.id.includes('recovery')),
    ).toHaveLength(8)
    const state = play(`${fighter}:recovery-sweep`, { steps: 1 }).state
    const choice = comboChoices(state).find((entry) => entry.move.slot === 'forwardLight')
    expect(choice).toMatchObject({ link: true, status: 'wait' })
    expect(command(state, 'forwardLight').player.attack).toBe(state.player.attack)
  })

  it('chooses a free close sweep, free carry or paid power from the same linked opening', () => {
    const sweep = play(`${fighter}:recovery-sweep`)
    const carry = play(`${fighter}:recovery-carry`)
    const paid = play(`${fighter}:recovery-power`)
    expect(sweep.spent).toBe(0)
    expect(carry.spent).toBe(0)
    expect(carry.distance).toBeGreaterThan(sweep.distance + 2)
    expect(carry.damage).toBeGreaterThan(sweep.damage)
    expect(paid.spent).toBe(fighter === 'kurapika' ? 24 : 40)
    expect(paid.damage).toBeGreaterThan(carry.damage)
  })

  it('confirms the new jab-to-backfist branch into a genuine five-hit conversion', () => {
    const result = play(`${fighter}:extended-recovery`)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.spent).toBe(fighter === 'kurapika' ? 0 : 40)
    expect(result.state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
  })

  it('keeps a physical finish available when the linked power cannot be paid for', () => {
    const before = play(`${fighter}:recovery-power`, { steps: 3 }).state
    const state = { ...before, player: { ...before.player, aura: 0 } }
    const slot = fighter === 'kurapika' ? 'forwardSpecial' : 'neutralSpecial'
    expect(command(state, slot).player.attack).toBe(state.player.attack)
    expect(command(state, 'lowHeavy').player.attack?.moveId).toBe(`${fighter}:lowHeavy`)
  })
})

it('Benjamin’s new linked Air Blow still requires actual inheritance', () => {
  const before = play('benjamin:recovery-power', { steps: 3 }).state
  const state = {
    ...before,
    player: {
      ...before.player,
      hatsuEffects: {
        ...before.player.hatsuEffects,
        baton: { ...before.player.hatsuEffects.baton!, inherited: [] },
      },
    },
  }
  expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
  expect(comboChoices(state).find((choice) => choice.move.slot === 'neutralSpecial')?.status).toBe(
    'unavailable',
  )
  expect(command(state, 'forwardHeavy').player.attack?.moveId).toBe('benjamin:forwardHeavy')
})
