import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { routeStepHits } from './combatRouteContacts'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { moveForSlot } from './movesets'
import { canStartFighterAttack } from './fighterAttacks'
import { comboChoices } from './comboChoices'
import { createCombatSchool, advanceCombatSchool } from './combatSchool'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['machi', 'biscuit', 'franklin', 'hanzo'] as const
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
function play(id: string, initial?: FightState) {
  const route = combatRoute(id)
  let state = initial ?? createCombatRouteFight(route)
  let spent = 0,
    total = 0
  const commands: MoveSlot[] = []
  for (const [step, slot] of route.moves.entries()) {
    const move = moveForSlot(route.fighter, slot)!
    for (
      let frame = 0;
      frame < 120 && !canStartFighterAttack(state.player, move.kind, move.id);
      frame++
    )
      state = tick(state)
    const aura = state.player.aura
    state = command(state, slot)
    spent += aura - state.player.aura
    commands.push(slot)
    expect(state.player.attack?.moveId).toBe(move.id)
    total += routeStepHits(route, step)
    for (let frame = 0; frame < 180 && state.opponent.comboHits < total; frame++)
      state = tick(state)
    expect(state.opponent.comboHits).toBe(total)
    expect(state.impact?.blocked).toBe(false)
  }
  return {
    state,
    spent,
    commands,
    damage: state.opponent.comboDamage,
    distance: Math.abs(state.player.x - state.opponent.x),
  }
}

describe.each(FIGHTERS)('%s physical combo choices', (fighter) => {
  it('offers eight routes and different damage, spacing and recovery tradeoffs', () => {
    expect(combatRoutesFor(fighter)).toHaveLength(8)
    const economy = play(`${fighter}:economy`)
    const carry = play(`${fighter}:carry`)
    expect(economy.spent).toBe(0)
    expect(carry.spent).toBe(0)
    expect(carry.damage).toBeGreaterThan(economy.damage)
    expect(carry.distance).toBeGreaterThan(economy.distance + 2)
    expect(economy.state.opponent.knockdownFrames).toBeGreaterThan(0)
    expect(carry.state.opponent.knockdownFrames).toBeGreaterThan(0)
  })

  it('keeps a free sweep available after the heavy without substituting another command', () => {
    const route = combatRoute(`${fighter}:economy`)
    let state = createCombatRouteFight(route)
    for (const slot of route.moves.slice(0, 2)) {
      state = command(state, slot)
      const previous = state.impact?.sequence ?? 0
      for (let i = 0; i < 80 && (state.impact?.sequence ?? 0) === previous; i++) state = tick(state)
    }
    const aura = state.player.aura
    const next = command(state, 'lowHeavy')
    expect(next.player.attack?.moveId).toBe(`${fighter}:lowHeavy`)
    expect(next.player.aura).toBe(aura)
  })
})

describe('second expansion power conditions', () => {
  it('preserves Machi’s real tracking marker without turning it into restraint or a free finisher', () => {
    const initial = createCombatRouteFight(combatRoute('machi:tracking'))
    expect(initial.opponent.machiThread).toMatchObject({ kind: 'mark', owner: 'player' })
    expect(initial.opponent.hatsuEffects.stitchedFrames).toBe(0)
    expect(initial.player.aura).toBeLessThan(83)
    const result = play('machi:tracking', initial)
    expect(result.spent).toBe(0)
    expect(result.state.opponent.machiThread?.kind).toBe('mark')
    expect(result.state.opponent.hatsuEffects.stitchedFrames).toBe(0)
    expect(result.commands).not.toContain('finisher')
    let state = result.state
    for (let i = 0; i < 100; i++) state = tick(state)
    expect(performMove({ state, side: 'opponent', action: 'light' }).opponent.attack).not.toBeNull()
  })

  it('reveals Biscuit’s true form with its real command and keeps the finisher conditional', () => {
    const initial = createCombatRouteFight(combatRoute('biscuit:true-form'))
    expect(initial.player.biscuitTrueForm).toBe(true)
    expect(initial.player.aura).toBe(100)
    expect(initial.player.health).toBe(initial.player.maxHealth)
    expect(initial.impact).toBeNull()
    const result = play('biscuit:true-form', initial)
    expect(result.spent).toBe(55)
    expect(result.state.player.biscuitTrueForm).toBe(true)
    expect(play('biscuit:mastery').spent).toBe(24)
    const fresh = createCombatRouteFight(combatRoute('biscuit:economy'))
    expect(command(fresh, 'finisher').player.attack).toBeNull()
    expect(play('biscuit:economy', initial).damage).toBeGreaterThan(play('biscuit:economy').damage)
  })

  it('lands Franklin’s travelling bullets from a single firing command and pays the full cost', () => {
    const short = play('franklin:short-burst')
    const long = play('franklin:long-burst')
    expect(short.spent).toBe(24)
    expect(long.spent).toBe(40)
    expect(short.commands.filter((slot) => slot === 'forwardSpecial')).toHaveLength(1)
    expect(long.commands.filter((slot) => slot === 'neutralSpecial')).toHaveLength(1)
    expect(short.state.player.attack?.projectilesSpawned).toBe(10)
    expect(long.state.player.attack?.projectilesSpawned).toBe(20)
    expect(short.state.opponent.comboHits).toBe(12)
    expect(long.state.opponent.comboHits).toBe(23)
    expect(long.state.impact?.projectileId).toBeDefined()
    expect(long.damage).toBeGreaterThan(short.damage)
  })

  it('does not award Franklin’s full barrage after only its first bullet or after Nen is cut', () => {
    const school = createCombatSchool()
    const match = createFightMatchRuntime(undefined, { record: false })
    match.observeFrames(school.observe)
    let state = school.start('franklin:long-burst', true)
    match.begin(state)
    for (let i = 0; i < 200 && !get(school)!.stepHits; i++)
      state = advanceCombatSchool({
        school,
        match,
        state,
        dt: 1 / 60,
        input: EMPTY_INPUT,
        opponentInput: EMPTY_INPUT,
      })
    expect(get(school)).toMatchObject({ step: 3, complete: false, failed: false })
    expect(get(school)!.stepHits).toBeLessThan(20)
    state = { ...state, player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' } } }
    for (let i = 0; i < 180 && !get(school)!.failed; i++)
      state = advanceCombatSchool({
        school,
        match,
        state,
        dt: 1 / 60,
        input: EMPTY_INPUT,
        opponentInput: EMPTY_INPUT,
      })
    expect(get(school)).toMatchObject({ complete: false, failed: true })
  })

  it('lets Hanzo chain a martial backhand without creating a projection', () => {
    let state = createCombatRouteFight(combatRoute('hanzo:precision'))
    for (const slot of ['standingLight', 'forwardLight'] as const) {
      const previous = state.impact?.sequence ?? 0
      state = command(state, slot)
      for (let i = 0; i < 80 && (state.impact?.sequence ?? 0) === previous; i++) state = tick(state)
    }
    expect(comboChoices(state).find((choice) => choice.move.slot === 'backHeavy')).toMatchObject({
      link: false,
      status: 'ready',
    })
    const linked = command(state, 'backHeavy')
    expect(linked.player.attack?.moveId).toBe('hanzo:backHeavy')
    expect(linked.player.hanzoProjection).toBeUndefined()
    expect(linked.player.wakeupInvulnerableFrames).toBe(0)
    expect(play('hanzo:low-precision').spent).toBe(0)
  })
})
