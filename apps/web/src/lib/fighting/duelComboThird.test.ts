import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { hasPlantedPaper } from './kallutoPaper'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['illumi', 'kalluto', 'shizuku', 'leorio'] as const
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

describe('third expansion personal mechanics', () => {
  it('prepares Illumi’s altered face through real vulnerable time without implanting a puppet', () => {
    const initial = createCombatRouteFight(combatRoute('illumi:disguise'))
    expect(initial.frame).toBeGreaterThanOrEqual(30)
    expect(initial.player.aura).toBeGreaterThanOrEqual(80)
    expect(initial.player.aura).toBeLessThan(81)
    expect(initial.player.illumi).toMatchObject({ disguised: true, preparation: 0 })
    expect(initial.opponent.needlePuppet).toBeUndefined()
    const result = play('illumi:disguise', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.state.opponent.needlePuppet).toBeUndefined()
    expect(result.state.player.wakeupInvulnerableFrames).toBe(0)
    const base = play('illumi:economy')
    expect(play('illumi:economy', { initial }).damage).toBe(base.damage)
    expect(
      comboChoices(play('illumi:economy', { steps: 2 }).state).every(
        (choice) => choice.move.kind !== 'special',
      ),
    ).toBe(true)
  })

  it('keeps Kalluto’s Serpent unavailable without the matching real fragment', () => {
    const prepared = createCombatRouteFight(combatRoute('kalluto:serpent'))
    expect(hasPlantedPaper(prepared, 'player', 'torso')).toBe(true)
    expect(prepared.player.aura).toBeLessThan(85)
    expect(prepared.opponent.comboHits).toBe(0)
    const result = play('kalluto:serpent', { initial: prepared })
    expect(result.spent).toBe(24)
    expect(result.state.impact?.projectileId).toBeDefined()
    expect(result.state.nextProjectileId - prepared.nextProjectileId).toBe(1)
    expect(hasPlantedPaper(result.state, 'player', 'torso')).toBe(true)
    let state = play('kalluto:economy', { steps: 2 }).state
    expect(hasPlantedPaper(state, 'player')).toBe(false)
    expect(
      comboChoices(state).find((choice) => choice.move.slot === 'forwardSpecial')?.status,
    ).toBe('unavailable')
    expect(command(state, 'forwardSpecial').player.attack).toBe(state.player.attack)
    state = {
      ...state,
      opponent: { ...state.opponent, plantedPaper: [{ owner: 'player', zone: 'feet' }] },
    }
    expect(command(state, 'forwardSpecial').player.attack).toBe(state.player.attack)
  })

  it('uses Shizuku’s actual club strike without automatically starting suction, healing or aura theft', () => {
    const result = play('shizuku:low-strike')
    expect(result.spent).toBe(24)
    expect(result.state.player.attack?.moveId).toBe('shizuku:forwardSpecial')
    expect(result.state.player.health).toBe(result.state.player.maxHealth)
    expect(result.state.player.hatsuEffects.blinkyFrames).toBe(0)
    expect(result.state.opponent.openWounds).toBeGreaterThanOrEqual(3)
    expect(result.state.player.blinky?.lastObject).toBeUndefined()
    expect(
      comboChoices(play('shizuku:economy', { steps: 2 }).state).some(
        (choice) => choice.move.slot === 'finisher',
      ),
    ).toBe(false)
  })

  it('waits for Leorio’s real surface travel and rise rather than dealing an immediate melee hit', () => {
    const result = play('leorio:remote')
    expect(result.spent).toBe(40)
    expect(result.timings.at(-1)).toBeGreaterThanOrEqual(18 + 12 + 4)
    expect(result.state.impact?.projectileId).toBeDefined()
    expect(result.state.player.attack?.projectileSpawned).toBe(true)
    expect(result.state.nextProjectileId).toBe(2)
    expect(play('leorio:low-remote').spent).toBe(40)
  })

  it.each(['aura', 'air', 'sealed'] as const)(
    'still rejects Leorio’s punch when prevented by %s',
    (reason) => {
      let state = play('leorio:remote', { steps: 3 }).state
      const fighter = { ...state.player }
      if (reason === 'aura') fighter.aura = 0
      if (reason === 'air') fighter.y = 2
      if (reason === 'sealed') fighter.hatsuEffects = { ...fighter.hatsuEffects, hatsuStolen: 1 }
      state = { ...state, player: fighter }
      const rejected = command(state, 'neutralSpecial')
      expect(rejected.player.attack).toBe(state.player.attack)
      expect(rejected.player.aura).toBe(state.player.aura)
      expect(rejected.nextProjectileId).toBe(state.nextProjectileId)
      if (reason === 'air')
        expect(command(state, 'lowHeavy').player.attack).toBe(state.player.attack)
      else expect(command(state, 'lowHeavy').player.attack?.moveId).toBe('leorio:lowHeavy')
    },
  )
})
