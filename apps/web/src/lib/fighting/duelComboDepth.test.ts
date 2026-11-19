import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performTrainingAction } from './trainingAction'
import { tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { attackData, attackTotal } from './frameData'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

function step(state: FightState, guard = true) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: { ...EMPTY_INPUT, guard },
  })
}

function command(state: FightState, slot: MoveSlot): FightState {
  return performTrainingAction({
    state,
    side: 'player',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.player.facing),
  })
}

function contact(state: FightState) {
  const previous = state.impact?.sequence ?? 0
  for (let frame = 0; frame < 100 && (state.impact?.sequence ?? 0) === previous; frame++)
    state = step(state, previous > 0)
  expect(state.impact?.sequence).toBe(previous + 1)
  return state
}

function execute(id: string) {
  const route = combatRoute(id)
  let state = createCombatRouteFight(route)
  let spent = 0
  for (const slot of route.moves) {
    const move = moveForSlot(route.fighter, slot)!
    for (
      let frame = 0;
      frame < 100 && !canStartFighterAttack(state.player, move.kind, move.id);
      frame++
    )
      state = step(state)
    const before = state.player.aura
    state = command(state, slot)
    spent += before - state.player.aura
    expect(state.player.attack?.moveId).toBe(move.id)
    state = contact(state)
    expect(state.impact?.blocked).toBe(false)
  }
  expect(state.opponent.comboHits).toBe(route.moves.length)
  return {
    state,
    spent,
    damage: state.opponent.comboDamage,
    distance: Math.abs(state.opponent.x - state.player.x),
  }
}

describe.each(['kurapika', 'benjamin'] as const)('%s combo decisions', (fighter) => {
  it('offers different damage, spacing and aura outcomes from the same opening', () => {
    const economy = execute(`${fighter}:economy`)
    const carry = execute(`${fighter}:carry`)
    const paid = execute(`${fighter}:confirm`)
    expect(economy.spent).toBe(0)
    expect(carry.spent).toBe(0)
    expect(paid.spent).toBe(fighter === 'kurapika' ? 24 : 40)
    expect(carry.distance).toBeGreaterThan(economy.distance + 2)
    expect(carry.damage).toBeGreaterThan(economy.damage)
    expect(paid.damage).toBeGreaterThan(carry.damage)
    expect(attackData('heavy', carry.state.player).recovery).toBeGreaterThan(
      attackData('heavy', economy.state.player).recovery,
    )
    expect(economy.state.opponent.knockdownFrames).toBeGreaterThan(0)
    expect(carry.state.opponent.knockdownFrames).toBeGreaterThan(0)
  })

  it('uses the actual directional choice for both finishers, in either facing', () => {
    for (const facing of [1, -1] as const) {
      const fresh = createCombatRouteFight(combatRoute(`${fighter}:confirm`))
      let state = {
        ...fresh,
        player: { ...fresh.player, x: facing === 1 ? 44 : 56, facing },
        opponent: { ...fresh.opponent, facing: facing === 1 ? (-1 as const) : (1 as const) },
      }
      state = contact(command(state, 'standingLight'))
      state = contact(command(state, 'standingHeavy'))
      for (const slot of ['lowHeavy', 'forwardHeavy'] as const) {
        const branch = command(state, slot)
        expect(branch.player.attack?.moveId).toBe(`${fighter}:${slot}`)
        expect(branch.player.aura).toBe(state.player.aura)
        expect(contact(branch).impact?.blocked).toBe(false)
      }
    }
  })

  it('shows resource failure and leaves the free branch available without spending aura', () => {
    let state = createCombatRouteFight(combatRoute(`${fighter}:confirm`))
    state = contact(command(state, 'standingLight'))
    state = contact(command(state, 'standingHeavy'))
    state = { ...state, player: { ...state.player, aura: 0 } }
    const slot = fighter === 'kurapika' ? 'forwardSpecial' : 'neutralSpecial'
    const paid = comboChoices(state).find((choice) => choice.move.slot === slot)!
    expect(paid.status).toBe('unavailable')
    expect(comboChoices(state).find((choice) => choice.move.slot === 'lowHeavy')?.status).toBe(
      'ready',
    )
    const refused = command(state, slot)
    expect(refused.player.attack).toBe(state.player.attack)
    expect(refused.player.aura).toBe(0)
    expect(command(refused, 'lowHeavy').player.attack?.moveId).toBe(`${fighter}:lowHeavy`)
  })

  it('refuses cancels after the authored window and lets the defender guard again', () => {
    let state = createCombatRouteFight(combatRoute(`${fighter}:confirm`))
    state = contact(command(state, 'standingLight'))
    state = contact(command(state, 'standingHeavy'))
    while (
      state.hitstop ||
      state.player.attack!.frame <= attackData('heavy', state.player).cancelEnd
    )
      state = step(state)
    const attempted = command(state, 'lowHeavy')
    expect(attempted.player.attack?.moveId).toBe(`${fighter}:standingHeavy`)
    for (let frame = 0; frame < 60; frame++) state = step(state)
    const blocked = contact(command(state, 'standingHeavy'))
    expect(blocked.impact?.blocked).toBe(true)
    expect(blocked.opponent.comboHits).toBe(0)
  })

  it('keeps every taught route finite and excludes utility techniques from combo cancels', () => {
    expect(combatRoutesFor(fighter)).toHaveLength(12)
    for (const slot of fighter === 'kurapika'
      ? (['neutralSpecial', 'backSpecial', 'downSpecial', 'finisher'] as const)
      : (['forwardSpecial', 'downSpecial', 'finisher'] as const)) {
      const utility = moveForSlot(fighter, slot)!
      expect(combatRoutesFor(fighter).every((route) => !route.moves.includes(slot))).toBe(true)
      for (const normal of ['standingLight', 'standingHeavy', 'forwardLight', 'backHeavy'] as const)
        expect(moveForSlot(fighter, normal)!.cancelInto).not.toContain(utility.id)
    }
  })
})

describe('personal execution and conditions', () => {
  it('gives Kurapika a real recovery link that works without a declared cancel', () => {
    let state = createCombatRouteFight(combatRoute('kurapika:recovery-sweep'))
    state = contact(command(state, 'backHeavy'))
    const back = moveForSlot('kurapika', 'backHeavy')!
    expect(back.cancelInto).not.toContain('kurapika:forwardLight')
    expect(comboChoices(state).find((choice) => choice.move.slot === 'forwardLight')).toMatchObject(
      { link: true, status: 'wait' },
    )
    expect(command(state, 'forwardLight').player.attack?.moveId).toBe('kurapika:backHeavy')
    // A deliberately timed input after recovery follows the ordinary attack admission path.
    while (state.player.attack) state = step(state)
    const linked = contact(command(state, 'forwardLight'))
    expect(linked.impact?.blocked).toBe(false)
    expect(linked.opponent.comboHits).toBe(2)
  })

  it('gives Benjamin a confirmed cancel at the same point in his extended route', () => {
    let state = createCombatRouteFight(combatRoute('benjamin:power'))
    state = contact(command(state, 'standingLight'))
    state = contact(command(state, 'forwardLight'))
    const old = state.player.attack!
    expect(old.frame).toBeLessThan(attackTotal(attackData('light', state.player)))
    expect(
      comboChoices(state).find((choice) => choice.move.slot === 'standingHeavy'),
    ).toMatchObject({ link: false, status: 'ready' })
    const canceled = command(state, 'standingHeavy')
    expect(canceled.player.attack?.moveId).toBe('benjamin:standingHeavy')
    expect(execute('benjamin:power').damage).toBeGreaterThan(execute('benjamin:confirm').damage)
  })

  it('requires inherited Air Blow even with enough aura during a confirmed combo', () => {
    let state = createCombatRouteFight(combatRoute('benjamin:confirm'))
    state = contact(command(state, 'standingLight'))
    state = contact(command(state, 'standingHeavy'))
    const baton = state.player.hatsuEffects.baton!
    state = {
      ...state,
      player: {
        ...state.player,
        hatsuEffects: { ...state.player.hatsuEffects, baton: { ...baton, inherited: [] } },
      },
    }
    expect(
      comboChoices(state).find((choice) => choice.move.slot === 'neutralSpecial')?.status,
    ).toBe('unavailable')
    expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
    expect(command(state, 'forwardHeavy').player.attack?.moveId).toBe('benjamin:forwardHeavy')
  })
})
