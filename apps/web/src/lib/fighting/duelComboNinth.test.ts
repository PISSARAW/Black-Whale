import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { hatsuAvoidsImpact, hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { predatorReady } from './predator'
import { melodyParryBonus } from './melodyHearing'
import { DOOR_FRAMES } from './voconteDoors'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['rihan', 'melody', 'terebellum', 'voconte'] as const
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

describe('ninth expansion personal mechanics', () => {
  it('Rihan opens real observation without inventing a manifestation or completed analysis', () => {
    const initial = createCombatRouteFight(combatRoute('rihan:observation'))
    expect(initial.player.predator).toMatchObject({
      watching: true,
      known: [],
      analysis: null,
      hunt: null,
      successes: 0,
    })
    expect(initial.player.aura).toBe(100)
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(predatorReady(initial, 'player')).toBe(false)
    expect(command(initial, 'finisher').player.predator?.hunt).toBeNull()
    const result = play('rihan:observation', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.state.player.predator).toMatchObject({ analysis: null, hunt: null, successes: 0 })
    expect(result.state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
    const plain = createCombatRouteFight({ ...combatRoute('rihan:observation'), setup: undefined })
    expect(play('rihan:observation', { initial: plain }).damage).toBe(result.damage)
    expect(hatsuDefenceFactor(result.state.player)).toBe(1)
  })

  it('Rihan links the heavy after the advancing light’s recovery instead of cancelling it', () => {
    const state = play('rihan:precision', { steps: 2 }).state
    expect(
      comboChoices(state).find((choice) => choice.move.slot === 'standingHeavy'),
    ).toMatchObject({ link: true, status: 'wait' })
    expect(command(state, 'standingHeavy').player.attack).toBe(state.player.attack)
    expect(play('rihan:precision').state.opponent.comboHits).toBe(4)
  })

  it('Melody actually listens for twelve frames without casting music or pacifying the dummy', () => {
    const initial = createCombatRouteFight(combatRoute('melody:listening'))
    expect(initial.frame).toBeGreaterThanOrEqual(12)
    expect(initial.player.melodyHearing).toMatchObject({ frames: 12, target: 'opponent' })
    expect(initial.player.melodyPerformance).toBeUndefined()
    expect(initial.player.aura).toBe(100)
    expect(initial.opponent.hatsuEffects.entrancedFrames).toBe(0)
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    expect(melodyParryBonus(initial.player, initial.opponent)).toBe(3)
    const result = play('melody:listening', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.state.opponent.hatsuEffects.entrancedFrames).toBe(0)
    expect(hatsuAvoidsImpact(result.state.player)).toBe(false)
    expect(hatsuDamageFactor(result.state.player)).toBe(1)
    const silent = {
      ...initial,
      player: {
        ...initial.player,
        aura: 0,
        nen: { ...initial.player.nen, mode: 'zetsu' as const },
      },
    }
    expect(melodyParryBonus(tick(silent).player, silent.opponent)).toBe(3)
  })

  it('Melody’s real flute stops pacifying before an ordinary strike can follow it', () => {
    const initial = createCombatRouteFight(combatRoute('melody:economy'))
    let state = command(initial, 'neutralSpecial')
    expect(state.player.aura).toBe(92)
    for (let i = 0; i < 20; i++) state = tick(state)
    expect(state.opponent.hatsuEffects.entrancedFrames).toBe(1)
    expect(state.opponent.health).toBe(initial.opponent.health)
    expect(state.opponent.comboHits).toBe(0)
    state = command(state, 'neutralSpecial')
    expect(state.player.melodyPerformance).toBeUndefined()
    expect(state.opponent.hatsuEffects.entrancedFrames).toBe(0)
    expect(command(state, 'standingLight').player.attack?.moveId).toBe('melody:standingLight')
  })

  it('Terebellum pays for an actual strike without healing old wounds or manufacturing a transferred injury', () => {
    const initial = createCombatRouteFight(combatRoute('terebellum:left-hand'))
    const hurt = { ...initial, player: { ...initial.player, health: 37 } }
    const result = play('terebellum:left-hand', { initial: hurt })
    expect(result.spent).toBe(40)
    expect(result.state.player.health).toBe(37)
    expect(result.state.opponent.comboHits).toBe(4)
    expect(result.state.impact?.transfer).toBeUndefined()
    expect(result.state.impact?.objectTransfer).toBeUndefined()
    expect(result.state.impact?.projectileId).toBeNull()
    expect(result.state.opponent.knockdownFrames).toBeGreaterThan(0)
    expect(hatsuDamageFactor(result.state.player)).toBe(1)
  })

  it('Terebellum retains a free physical ending if aura cannot pay for the committed strike', () => {
    const before = play('terebellum:economy', { steps: 2 }).state
    const state = { ...before, player: { ...before.player, aura: 0 } }
    expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
    expect(
      comboChoices(state).find((choice) => choice.move.slot === 'neutralSpecial')?.status,
    ).toBe('unavailable')
    expect(command(state, 'lowHeavy').player.attack?.moveId).toBe('terebellum:lowHeavy')
  })

  it('Voconte connects the actual frames and the conversion does not itself trigger a transit', () => {
    const initial = createCombatRouteFight(combatRoute('voconte:doors'))
    expect(initial.frame).toBeGreaterThanOrEqual(31)
    expect(initial.player.aura).toBeGreaterThanOrEqual(80)
    expect(initial.player.aura).toBeLessThan(82)
    expect(initial.voconteDoors?.networks.player).toEqual({ active: true })
    expect(initial.voconteDoors?.lastTransit).toBeUndefined()
    expect(initial.opponent.health).toBe(initial.opponent.maxHealth)
    const result = play('voconte:doors', { initial })
    expect(result.spent).toBe(0)
    expect(result.state.opponent.comboHits).toBe(5)
    expect(result.state.voconteDoors?.lastTransit).toBeUndefined()
    expect(hatsuAvoidsImpact(result.state.player)).toBe(false)
    const plain = createCombatRouteFight({ ...combatRoute('voconte:doors'), setup: undefined })
    expect(play('voconte:doors', { initial: plain }).damage).toBe(result.damage)
  })

  it('Voconte’s existing network still transports only an actual directed crossing', () => {
    const initial = createCombatRouteFight(combatRoute('voconte:doors'))
    const entry = DOOR_FRAMES.find((frame) => frame.id === 'A')!
    const exit = DOOR_FRAMES.find((frame) => frame.id === entry.destination)!
    const near = { ...initial, player: { ...initial.player, x: entry.x - 0.05 } }
    const crossed = tickFight(
      near,
      { ...EMPTY_INPUT, right: true },
      { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT },
    )
    expect(crossed.voconteDoors?.lastTransit?.player).toMatchObject({
      from: entry.id,
      to: exit.id,
      owner: 'player',
    })
    expect(crossed.player.x).toBeGreaterThan(exit.x)
    expect(crossed.player.health).toBe(initial.player.health)
    expect(crossed.opponent.health).toBe(initial.opponent.health)
    expect(crossed.impact).toBeNull()
  })

  it.each(['rihan', 'melody', 'voconte'] as const)(
    '%s keeps the non-damaging utility outside confirmed cancels',
    (fighter) => {
      const state = play(`${fighter}:economy`, { steps: 2 }).state
      expect(comboChoices(state).every((choice) => choice.move.kind !== 'special')).toBe(true)
      expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
      expect(command(state, 'neutralSpecial').player.aura).toBe(state.player.aura)
    },
  )
})
