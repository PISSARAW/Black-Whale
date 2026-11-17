import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { privateLynchReplies } from './lynchInterrogation'
import { maryState } from './bloodyMary'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['gel', 'lynch', 'padaille', 'zakuro'] as const
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

describe('fifth expansion personal mechanics', () => {
  it('Gel chooses two physical arm endings with different real costs and no added status', () => {
    for (const [id, cost] of [
      ['gel:reach', 24],
      ['gel:low-arm', 20],
    ] as const) {
      const result = play(id)
      expect(result.spent).toBe(cost)
      expect(result.state.impact?.projectileId).toBeNull()
      expect(result.state.nextProjectileId).toBe(1)
      expect(result.state.opponent.hatsuEffects.restrainedFrames).toBe(0)
      expect(result.state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
      expect(result.state.opponent.aura).toBe(100)
      expect(result.state.opponent.knockdownFrames).toBeGreaterThan(0)
    }
    expect(play('gel:reach').distance).toBeGreaterThan(play('gel:low-arm').distance)
  })

  it.each([
    ['neutralSpecial', 'hammer'],
    ['forwardSpecial', 'drill'],
    ['downSpecial', 'axe'],
  ] as const)('Padaille starts the chosen %s and pays only for that tool', (slot, tool) => {
    let state = play('padaille:economy', { steps: 2 }).state
    const aura = state.player.aura
    const health = state.opponent.health
    state = command(state, slot)
    expect(state.player.attack?.moveId).toBe(`padaille:${slot}`)
    expect(state.player.padailleTool).toBe(tool)
    expect(aura - state.player.aura).toBe(20)
    expect(state.opponent.health).toBe(health)
    for (let i = 0; i < 90 && state.opponent.comboHits < 3; i++) state = tick(state)
    expect(state.opponent.comboHits).toBe(3)
    expect(state.impact?.blocked).toBe(false)
  })

  it('Padaille can extend a real drill hit into a free sweep', () => {
    const result = play('padaille:drill')
    expect(result.spent).toBe(20)
    expect(result.state.opponent.comboHits).toBe(4)
    expect(result.state.player.padailleTool).toBe('drill')
    expect(result.state.opponent.knockdownFrames).toBeGreaterThan(0)
    const before = play('padaille:drill', { steps: 3 }).state
    expect(comboChoices(before).map((choice) => choice.move.slot)).toEqual(['lowHeavy'])
  })

  it.each(['gel', 'padaille'] as const)(
    '%s retains a free physical ending when aura cannot pay for its strike',
    (fighter) => {
      const before = play(`${fighter}:economy`, { steps: 2 }).state
      const state = { ...before, player: { ...before.player, aura: 0 } }
      expect(command(state, 'forwardSpecial').player.attack).toBe(state.player.attack)
      expect(
        comboChoices(state).find((choice) => choice.move.slot === 'forwardSpecial')?.status,
      ).toBe('unavailable')
      expect(command(state, 'lowHeavy').player.attack?.moveId).toBe(`${fighter}:lowHeavy`)
    },
  )

  it('Lynch asks before the route and obtains two paid private replies from actual fists', () => {
    const initial = createCombatRouteFight(combatRoute('lynch:question'))
    expect(initial.player.lynchQuestion).toMatchObject({ id: 'identity', target: 'opponent' })
    expect(initial.player.aura).toBe(100)
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(privateLynchReplies(initial, 'player')).toHaveLength(0)
    expect(
      privateLynchReplies(play('lynch:question', { initial, steps: 1 }).state, 'player'),
    ).toHaveLength(0)
    const result = play('lynch:question', { initial })
    expect(result.spent).toBe(0)
    // Replies are charged at impact; ordinary Ten regeneration continues between contacts.
    expect(result.state.player.aura).toBeGreaterThanOrEqual(80)
    expect(result.state.player.aura).toBeLessThan(81)
    expect(privateLynchReplies(result.state, 'player')).toHaveLength(2)
    expect(privateLynchReplies(result.state, 'opponent')).toHaveLength(2)
    expect(privateLynchReplies(result.state)).toHaveLength(0)
    for (const reply of privateLynchReplies(result.state, 'player')) {
      expect(reply.identity).toBe('chrollo')
      expect(reply.frame).toBeGreaterThan(initial.frame)
      expect(reply).not.toHaveProperty('nextAction')
    }
    const plain = createCombatRouteFight({ ...combatRoute('lynch:question'), setup: undefined })
    expect(play('lynch:question', { initial: plain }).damage).toBe(result.damage)
    expect(privateLynchReplies(play('lynch:economy').state, 'player')).toHaveLength(0)
    expect(result.state.opponent.hatsuEffects.restrainedFrames).toBe(0)
  })

  it('Zakuro sheds real blood and deploys finite scouts without turning them into extra hits', () => {
    const initial = createCombatRouteFight(combatRoute('zakuro:scouts'))
    expect(initial.player.health).toBe(initial.player.maxHealth - 2)
    expect(initial.player.aura).toBe(91)
    expect(initial.player.openWounds).toBe(1)
    expect(maryState(initial.player)).toMatchObject({ available: 3, bags: 6 })
    expect(maryState(initial.player).drops).toHaveLength(3)
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(initial.opponent.maryCapture).toBeUndefined()
    const result = play('zakuro:scouts', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(4)
    expect(maryState(result.state.player)).toMatchObject({ available: 3, bags: 6 })
    expect(maryState(result.state.player).drops).toHaveLength(3)
    const plain = createCombatRouteFight({ ...combatRoute('zakuro:scouts'), setup: undefined })
    expect(play('zakuro:scouts', { initial: plain }).damage).toBe(result.damage)
    expect(result.state.player.health).toBe(initial.player.health)
    expect(result.state.opponent.maryCapture).toBeUndefined()
  })

  it.each(['lynch', 'zakuro'] as const)(
    '%s keeps preparations outside damaging cancel choices',
    (fighter) => {
      const state = play(`${fighter}:economy`, { steps: 2 }).state
      expect(comboChoices(state).every((choice) => choice.move.kind !== 'special')).toBe(true)
      expect(command(state, 'neutralSpecial').player.aura).toBe(state.player.aura)
      expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
    },
  )
})
