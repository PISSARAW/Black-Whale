import { describe, expect, it } from 'vitest'
import { combatRoute, combatRoutesFor } from './combatRoutes'
import { combatRouteAction, combatRouteInput, createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { comboChoices } from './comboChoices'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

const FIGHTERS = ['hisoka', 'chrollo', 'feitan', 'phinks'] as const
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
function contact(state: FightState) {
  const previous = state.impact?.sequence ?? 0
  for (let frame = 0; frame < 100 && (state.impact?.sequence ?? 0) === previous; frame++)
    state = tick(state)
  expect(state.impact?.sequence).toBe(previous + 1)
  expect(state.impact?.blocked).toBe(false)
  return state
}
function execute(id: string, initial?: FightState) {
  const route = combatRoute(id)
  let state = initial ?? createCombatRouteFight(route)
  let spent = 0
  for (const slot of route.moves) {
    const move = moveForSlot(route.fighter, slot)!
    for (
      let frame = 0;
      frame < 100 && !canStartFighterAttack(state.player, move.kind, move.id);
      frame++
    )
      state = tick(state)
    const aura = state.player.aura
    state = command(state, slot)
    spent += aura - state.player.aura
    expect(state.player.attack?.moveId).toBe(move.id)
    state = contact(state)
  }
  expect(state.opponent.comboHits).toBe(route.moves.length)
  return {
    state,
    spent,
    damage: state.opponent.comboDamage,
    distance: Math.abs(state.player.x - state.opponent.x),
  }
}
function pivot(fighter: (typeof FIGHTERS)[number]) {
  let state = createCombatRouteFight(combatRoute(`${fighter}:economy`))
  for (const slot of combatRoute(`${fighter}:economy`).moves.slice(0, 2))
    state = contact(command(state, slot))
  return state
}

describe.each(FIGHTERS)('%s personal combo branches', (fighter) => {
  it('offers executable economy and carry examples with distinct free finish outcomes', () => {
    expect(combatRoutesFor(fighter).map((route) => route.id)).toEqual(
      expect.arrayContaining([`${fighter}:economy`, `${fighter}:carry`]),
    )
    const economy = execute(`${fighter}:economy`)
    const carry = execute(`${fighter}:carry`)
    expect(economy.spent).toBe(0)
    expect(carry.spent).toBe(0)
    expect(carry.distance).toBeGreaterThan(economy.distance + 2)
    expect(carry.damage).toBeGreaterThan(economy.damage)
    expect(economy.state.opponent.knockdownFrames).toBeGreaterThan(0)
    if (fighter === 'chrollo') expect(carry.state.opponent.knockdownFrames).toBe(0)
    else expect(carry.state.opponent.knockdownFrames).toBeGreaterThan(0)
  })

  it('honors the exact physical finisher selected after a common opening', () => {
    const state = pivot(fighter)
    const choices = [
      'lowHeavy',
      fighter === 'hisoka' ? 'backHeavy' : fighter === 'chrollo' ? 'forwardLight' : 'forwardHeavy',
    ] as const
    for (const slot of choices) {
      const next = command(state, slot)
      expect(next.player.attack?.moveId).toBe(`${fighter}:${slot}`)
      expect(next.player.aura).toBe(state.player.aura)
      const landed = contact(next)
      if (fighter === 'chrollo' && slot === 'forwardLight') {
        expect(landed.opponent.knockdownFrames).toBe(0)
        expect(landed.opponent.x).toBeGreaterThan(state.opponent.x)
      } else expect(landed.opponent.knockdownFrames).toBeGreaterThan(0)
    }
  })

  it('never routes a normal confirmation into utility or preparation casts', () => {
    const state = pivot(fighter)
    const forbidden =
      fighter === 'hisoka'
        ? ['forwardSpecial', 'backSpecial', 'downSpecial']
        : fighter === 'chrollo'
          ? ['forwardSpecial', 'backSpecial', 'downSpecial', 'finisher']
          : fighter === 'feitan'
            ? ['neutralSpecial', 'finisher']
            : ['neutralSpecial']
    expect(comboChoices(state).every((choice) => !forbidden.includes(choice.move.slot))).toBe(true)
  })
})

describe('personal powers and recovery links', () => {
  it('attaches Gum through real contact, then consumes a pre-existing tether with the finisher', () => {
    const attach = execute('hisoka:extension')
    expect(attach.spent).toBe(40)
    expect(attach.state.bungeeGum).toMatchObject({ owner: 'player', target: 'opponent' })
    const prepared = createCombatRouteFight(combatRoute('hisoka:tether'))
    expect(prepared.bungeeGum).toMatchObject({ owner: 'player', target: 'opponent' })
    expect(prepared.player.aura).toBeLessThan(100)
    expect(prepared.opponent.comboHits).toBe(0)
    expect(prepared.impact).toBeNull()
    const finish = execute('hisoka:tether', prepared)
    expect(finish.spent).toBe(55)
    expect(finish.state.bungeeGum).toBeNull()
    const unprepared = pivot('hisoka')
    expect(comboChoices(unprepared).find((choice) => choice.move.slot === 'finisher')?.status).toBe(
      'unavailable',
    )
    expect(command(unprepared, 'finisher').player.attack).toBe(unprepared.player.attack)
  })

  it('lets Chrollo trade physical damage for a Sun mark and preserves book requirements', () => {
    const marked = execute('chrollo:confirm')
    const physical = execute('chrollo:economy')
    expect(marked.spent).toBe(24)
    expect(marked.state.opponent.hatsuEffects.sunMark).toBe(1)
    expect(marked.damage).toBeLessThan(physical.damage)
    let state = pivot('chrollo')
    state = {
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    }
    expect(
      comboChoices(state).find((choice) => choice.move.slot === 'neutralSpecial')?.status,
    ).toBe('unavailable')
    expect(command(state, 'neutralSpecial').player.attack).toBe(state.player.attack)
    expect(command(state, 'lowHeavy').player.attack?.moveId).toBe('chrollo:lowHeavy')
  })

  it('chains Chrollo’s heavy into the back heavy without granting a book cancel', () => {
    // Lot 3 of COMBO_GRAMMAR.md: the former recovery link is a chain under the tiered grammar.
    let state = createCombatRouteFight(combatRoute('chrollo:precision'))
    state = contact(command(state, 'standingLight'))
    state = contact(command(state, 'standingHeavy'))
    expect(comboChoices(state).find((choice) => choice.move.slot === 'backHeavy')).toMatchObject({
      link: false,
      status: 'ready',
    })
    const chained = contact(command(state, 'backHeavy'))
    expect(chained.player.attack?.moveId).toBe('chrollo:backHeavy')
    expect(chained.opponent.comboHits).toBe(3)
    expect(moveForSlot('chrollo', 'standingHeavy')!.cancelInto).not.toContain('chrollo:finisher')
  })

  it('executes Feitan’s longer blade routes without granting injuries, armor or a sun', () => {
    const fast = execute('feitan:speed')
    const long = execute('feitan:speed-economy')
    expect(fast.spent).toBe(0)
    expect(long.spent).toBe(0)
    expect(long.state.opponent.comboHits).toBe(5)
    expect(fast.state.player.hatsuEffects.painPacker).toMatchObject({
      injuries: 0,
      packedDamage: 0,
      armour: false,
      sun: null,
    })
  })

  it('pays for a complete Phinks rotation, preserves it on a sweep, and spends it on a real link', () => {
    const prepared = createCombatRouteFight(combatRoute('phinks:charged'))
    expect(prepared.player.hatsuEffects.cyclotronTurns).toBe(1)
    expect(prepared.player.aura).toBeCloseTo(98, 1)
    expect(prepared.player.cyclotronWindup).toBeUndefined()
    expect(execute('phinks:economy', prepared).state.player.hatsuEffects.cyclotronTurns).toBe(1)
    let state = prepared
    state = contact(command(state, 'standingLight'))
    state = contact(command(state, 'standingHeavy'))
    expect(comboChoices(state).find((choice) => choice.move.slot === 'finisher')).toMatchObject({
      link: true,
      status: 'wait',
    })
    expect(command(state, 'finisher').player.attack?.moveId).toBe('phinks:standingHeavy')
    expect(state.player.hatsuEffects.cyclotronTurns).toBe(1)
    while (state.player.attack) state = tick(state)
    const started = command(state, 'finisher')
    expect(started.player.hatsuEffects.cyclotronTurns).toBe(0)
    expect(started.player.attack?.cyclotronTurns).toBe(1)
    expect(contact(started).opponent.comboHits).toBe(3)
    expect(
      comboChoices(pivot('phinks')).find((choice) => choice.move.slot === 'finisher')?.status,
    ).toBe('unavailable')
  })
})
