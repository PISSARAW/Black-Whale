import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { hatsuAvoidsImpact, hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { respondMoonlightContract } from './moonlightContract'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['tserriednich', 'basho', 'camilla', 'longhi'] as const
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

describe('seventh expansion personal mechanics', () => {
  it('Tserriednich chains the heavy from the advancing light under the derived grammar', () => {
    const state = play('tserriednich:precision', { steps: 2 }).state
    const choice = comboChoices(state).find((entry) => entry.move.slot === 'standingHeavy')
    expect(choice).toMatchObject({ link: false, status: 'ready' })
    expect(command(state, 'standingHeavy').player.attack?.moveId).toBe('tserriednich:standingHeavy')
    const result = play('tserriednich:five-strikes')
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.spent).toBe(0)
    expect(result.state.parallelFuture).toBeUndefined()
    expect(result.state.player.parallelEyesClosed).toBeFalsy()
  })

  it('Tserriednich cannot turn Laplace Devil into a cancel or a free physical attack with closed eyes', () => {
    const busy = play('tserriednich:economy', { steps: 2 }).state
    expect(command(busy, 'neutralSpecial').player.attack).toBe(busy.player.attack)
    expect(command(busy, 'neutralSpecial').parallelFuture).toBeUndefined()
    const initial = createCombatRouteFight(combatRoute('tserriednich:economy'))
    const closed = command(initial, 'neutralSpecial')
    expect(closed.parallelFuture?.phase).toBe('preparing')
    expect(closed.player.parallelEyesClosed).toBe(true)
    expect(closed.player.nen.mode).toBe('zetsu')
    expect(command(closed, 'standingLight').player.attack).toBeNull()
    expect(hatsuAvoidsImpact(closed.player)).toBe(false)
    let struck = performMove({ state: closed, side: 'opponent', action: 'light' })
    for (let i = 0; i < 15 && struck.player.health === initial.player.health; i++)
      struck = tick(struck)
    expect(struck.player.health).toBeLessThan(initial.player.health)
    expect(struck.parallelFuture).toBeUndefined()
    expect(struck.impact?.avoided).toBe(false)
  })

  it('Basho actually writes for sixty vulnerable frames and only the two fists ignite', () => {
    const initial = createCombatRouteFight(combatRoute('basho:poem'))
    expect(initial.frame).toBeGreaterThanOrEqual(60)
    expect(initial.player.aura).toBeGreaterThanOrEqual(75)
    expect(initial.player.aura).toBeLessThan(77)
    expect(initial.player.bashoPoem).toMatchObject({ ready: true, writingFrames: 0 })
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(initial.opponent.bashoBurn).toBeUndefined()
    expect(play('basho:poem', { initial, steps: 1 }).state.opponent.bashoBurn).toBeUndefined()
    const firstFist = play('basho:poem', { initial, steps: 2 }).state
    expect(firstFist.opponent.bashoBurn?.owner).toBe('player')
    const lastFist = play('basho:poem', { initial, steps: 3 }).state
    const result = play('basho:poem', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.bashoBurn!.remainingFrames).toBeLessThan(
      lastFist.opponent.bashoBurn!.remainingFrames,
    )
    expect(hatsuDamageFactor(result.state.player)).toBe(1)
    const plain = createCombatRouteFight({ ...combatRoute('basho:poem'), setup: undefined })
    expect(play('basho:poem', { initial: plain }).damage).toBe(result.damage)
  })

  it('Basho’s continuing burn never fabricates extra combo impacts', () => {
    let state = play('basho:poem').state
    const sequence = state.impact!.sequence
    const health = state.opponent.health
    for (let i = 0; i < 100; i++) state = tick(state)
    expect(state.opponent.health).toBeLessThan(health)
    expect(state.impact!.sequence).toBe(sequence)
    expect(state.opponent.bashoBurn).toBeUndefined()
  })

  it('Camilla’s five-strike conversion remains physical even at one health', () => {
    const initial = createCombatRouteFight(combatRoute('camilla:five-strikes'))
    const fragile = { ...initial, player: { ...initial.player, health: 1 } }
    const result = play('camilla:five-strikes', { initial: fragile })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.state.player.health).toBe(1)
    expect(result.state.catsName).toBeFalsy()
    expect(hatsuDamageFactor(result.state.player)).toBe(1)
    expect(hatsuDefenceFactor(result.state.player)).toBe(1)
    expect(command(result.state, 'finisher').catsName).toBeFalsy()
    expect(command(result.state, 'neutralSpecial').catsName).toBeFalsy()
  })

  it('Longhi’s real offer is never signed by hits, guard or the dummy', () => {
    const initial = createCombatRouteFight(combatRoute('longhi:offer'))
    expect(initial.moonlight?.offer).toMatchObject({
      issuer: 'player',
      recipient: 'opponent',
      terms: 'no-attacks',
    })
    expect(initial.moonlight?.active).toBeUndefined()
    expect(initial.player.aura).toBe(100)
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    const result = play('longhi:offer', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.moonlight?.offer).toBeDefined()
    expect(result.state.moonlight?.active).toBeUndefined()
    expect(result.state.moonlight?.outcome).toBeUndefined()
    expect(result.state.player.moonlightZetsu).toBeFalsy()
    expect(result.state.opponent.moonlightZetsu).toBeFalsy()
    expect(result.state.opponent.moonlightLoan ?? 0).toBe(0)
    const plain = createCombatRouteFight({ ...combatRoute('longhi:offer'), setup: undefined })
    expect(play('longhi:offer', { initial: plain }).damage).toBe(result.damage)
  })

  it('Longhi’s explicit second signature still binds her and a started physical strike breaches the pact', () => {
    const initial = createCombatRouteFight(combatRoute('longhi:offer'))
    const signed = respondMoonlightContract({ state: initial, side: 'opponent', accept: true })
    expect(signed.moonlight?.active).toBeDefined()
    const breached = command(signed, 'standingLight')
    expect(breached.moonlight?.outcome).toMatchObject({ kind: 'breached', side: 'player' })
    expect(breached.player.moonlightZetsu).toBe(true)
    expect(breached.opponent.moonlightZetsu).toBeFalsy()
  })

  it.each(FIGHTERS)('%s keeps personal powers outside damaging cancel choices', (fighter) => {
    const state = play(`${fighter}:economy`, { steps: 2 }).state
    expect(comboChoices(state).every((choice) => choice.move.kind !== 'special')).toBe(true)
    expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
    expect(command(state, 'neutralSpecial').player.aura).toBe(state.player.aura)
  })
})
