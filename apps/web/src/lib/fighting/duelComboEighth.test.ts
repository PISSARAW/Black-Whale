import { performArsenalCommand } from './retrospectiveArsenal'
import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { hatsuAvoidsImpact, hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { controlledEntities, preparedActionReady } from './preparationActions'
import { luiniAnchor } from './luiniSpatial'
import { updateEntity } from './preparationWorld'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['bill', 'cluck', 'sayird', 'luini'] as const
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

const SCENARIOS = [
  ['bill:growth', 'plants', 20],
  ['cluck:courier', 'birds', 5],
  ['sayird:little-eye-setup', 'animals', 2],
  ['luini:anchor', 'rooms', 20],
] as const

describe('eighth expansion scenario prerequisites', () => {
  it.each(SCENARIOS)(
    '%s prepares a real %s scenario and pays %s aura before physical hits',
    (id, resource, cost) => {
      const initial = createCombatRouteFight(combatRoute(id))
      expect(initial.environment.preparation).toMatchObject({
        mode: 'scenario',
        resources: [resource],
        cohorts: [],
      })
      expect(initial.frame).toBeGreaterThanOrEqual(18)
      expect(initial.player.preparationRecovery).toBe(0)
      expect(initial.player.aura).toBeGreaterThanOrEqual(100 - cost)
      expect(initial.player.aura).toBeLessThan(101 - cost)
      expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
      expect(initial.opponent.hitStun).toBe(0)
      expect(initial.opponent.comboHits).toBe(0)
      expect(initial.impact).toBeNull()
      expect(initial.battlefield!.entities.every((entity) => entity.material === 'real')).toBe(true)
      const result = play(id, { initial })
      expect(result.spent).toBe(0)
      expect(result.state.opponent.comboHits).toBe(5)
      expect(hatsuDamageFactor(result.state.player)).toBe(1)
      expect(hatsuDefenceFactor(result.state.player)).toBe(1)
      expect(hatsuAvoidsImpact(result.state.player)).toBe(false)
      const plain = createCombatRouteFight({ ...combatRoute(id), setup: undefined })
      expect(play(id, { initial: plain }).damage).toBe(result.damage)
    },
  )

  it('Bill germinates the actual seed without healing himself or conjuring an attacking plant', () => {
    const initial = createCombatRouteFight(combatRoute('bill:growth'))
    const seed = initial.battlefield!.entities.find((entity) => entity.id === 'player:seed')!
    expect(seed).toMatchObject({ kind: 'seed', present: true, material: 'real', growth: 1 })
    expect(initial.battlefield!.completed.player).toBe(1)
    const result = play('bill:growth', { initial })
    expect(result.state.player.health).toBe(initial.player.health)
    expect(result.state.battlefield!.entities.find((entity) => entity.id === seed.id)?.growth).toBe(
      1,
    )
    expect(result.state.projectiles).toHaveLength(0)
    // Lot 4 of COMBO_GRAMMAR.md: the former recovery link is a chain under the derived grammar.
    const waiting = play('bill:precision', { steps: 2 }).state
    expect(
      comboChoices(waiting).find((choice) => choice.move.slot === 'standingHeavy'),
    ).toMatchObject({ link: false, status: 'ready' })
    expect(command(waiting, 'standingHeavy').player.attack?.moveId).toBe('bill:standingHeavy')
  })

  it('Cluck’s pigeon travels and completes its actual delivery without creating extra hits', () => {
    const initial = createCombatRouteFight(combatRoute('cluck:courier'))
    const bird = controlledEntities(initial, 'player', 'cluck')[0]
    expect(bird).toMatchObject({ kind: 'bird', material: 'real', delivered: false })
    expect(bird.x).toBeGreaterThan(28)
    let state = play('cluck:courier', { initial }).state
    const health = state.opponent.health
    const sequence = state.impact!.sequence
    for (
      let i = 0;
      i < 200 && !state.battlefield!.entities.find((entry) => entry.id === bird.id)?.delivered;
      i++
    )
      state = tick(state)
    expect(state.battlefield!.entities.find((entry) => entry.id === bird.id)).toMatchObject({
      delivered: true,
      controller: undefined,
    })
    expect(state.battlefield!.completed.player).toBe(1)
    expect(state.opponent.health).toBe(health)
    expect(state.impact!.sequence).toBe(sequence)
  })

  it('Sayird’s real animal follows its ordered destination while physical hits do the damage', () => {
    const initial = performArsenalCommand(
      createCombatRouteFight(combatRoute('sayird:little-eye-setup')),
      'player',
      { action: 'little-eye-right' },
    )
    const animal = controlledEntities(initial, 'player', 'sayird')[0]
    expect(animal).toMatchObject({
      kind: 'animal',
      material: 'real',
      controller: { side: 'player', source: 'sayird' },
    })
    const result = play('sayird:little-eye-setup', { initial })
    const observing = controlledEntities(result.state, 'player', 'sayird')[0]
    expect(observing.id).toBe(animal.id)
    expect(observing.x).toBeGreaterThan(animal.x)
    expect(result.state.opponent.hatsuEffects.manipulatedFrames).toBe(0)
    expect(result.state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
    expect(result.state.opponent.aura).toBe(100)
    expect(result.state.projectiles).toHaveLength(0)
  })

  it('Luini keeps an actual anchored room and opening its door still burns it permanently', () => {
    const initial = createCombatRouteFight(combatRoute('luini:anchor'))
    const room = luiniAnchor(initial, 'player')!
    expect(room).toMatchObject({
      kind: 'room',
      material: 'real',
      sealed: true,
      singleDoor: true,
      invalidated: false,
    })
    expect(initial.battlefield!.entities.find((entry) => entry.id === room.linkedTo)).toMatchObject(
      { kind: 'destination', visitedBy: ['player'] },
    )
    let state = play('luini:anchor', { initial }).state
    expect(luiniAnchor(state, 'player')?.id).toBe(room.id)
    expect(state.player.x).toBeGreaterThan(room.x + 6)
    state = tick(updateEntity(state, room.id, { sealed: false }))
    expect(luiniAnchor(state, 'player')).toBeUndefined()
    const reclosed = updateEntity(state, room.id, { sealed: true })
    expect(reclosed.battlefield!.entities.find((entry) => entry.id === room.id)?.invalidated).toBe(
      true,
    )
    expect(luiniAnchor(reclosed, 'player')).toBeUndefined()
  })

  it.each(SCENARIOS)('%s refuses a power when its real material prerequisite is absent', (id) => {
    const initial = createCombatRouteFight({ ...combatRoute(id), setup: undefined })
    expect(initial.battlefield!.entities).toHaveLength(0)
    expect(preparedActionReady(initial, 'player')).toBe(false)
    const refused = command(initial, 'neutralSpecial')
    expect(refused.player.aura).toBe(initial.player.aura)
    expect(refused.player.attack).toBeNull()
    expect(refused.opponent.health).toBe(initial.opponent.health)
  })

  it.each(FIGHTERS)('%s keeps utility commands outside damaging cancel choices', (fighter) => {
    const state = play(`${fighter}:economy`, { steps: 2 }).state
    expect(comboChoices(state).every((choice) => choice.move.kind !== 'special')).toBe(true)
    expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
    expect(command(state, 'neutralSpecial').player.aura).toBe(state.player.aura)
  })
})
