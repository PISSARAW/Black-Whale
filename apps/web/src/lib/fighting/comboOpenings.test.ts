import { describe, expect, it } from 'vitest'
import { resolveFightImpacts } from './combatImpact'
import { comboChoices } from './comboChoices'
import { prepareCombatRoute } from './combatRouteSetup'
import { selectedGumLink } from './bungeeNetwork'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { attackData } from './frameData'
import { FIGHTING_ROSTER } from './roster'
import {
  EMPTY_INPUT,
  type FightSide,
  type FightState,
  type FighterId,
  type MoveAction,
  type MoveSlot,
} from './types'

function duel(fighter: FighterId, facing: 1 | -1): FightState {
  const state = beginFight(createFight(fighter, 'hisoka', { mode: 'versus-local' }))
  return {
    ...state,
    player: { ...state.player, x: 50 - 6 * facing, facing },
    opponent: { ...state.opponent, x: 50, facing: facing === 1 ? -1 : 1 },
  }
}

function command(state: FightState, action: MoveAction, direction: -1 | 0 | 1 = 0) {
  const horizontal = direction * state.player.facing
  return performMove({
    state,
    side: 'player',
    action,
    input: { ...EMPTY_INPUT, left: horizontal < 0, right: horizontal > 0 },
  })
}

function active(state: FightState): FightState {
  const fighter = state.player
  const attack = fighter.attack!
  return {
    ...state,
    player: { ...fighter, attack: { ...attack, frame: attackData(attack.kind, fighter).startup } },
  }
}

function contact(state: FightState) {
  return resolveFightImpacts(active(state), [])
}

function followup(state: FightState, direction: 1 | -1): FightState {
  const sequence = state.impact!.sequence
  let next = command(state, 'heavy', direction)
  for (let i = 0; i < 50 && next.impact?.sequence === sequence; i++) {
    next = tickFight(next, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard: true },
    })
  }
  return next
}

describe.each(FIGHTING_ROSTER.map(({ id }) => id))('%s situational conversions', (fighter) => {
  it.each([1, -1] as const)('converts a tip hit facing %s', (facing) => {
    // Chrollo's advancing light is a knockdown ender. His jab starts the tip route.
    const started = command(duel(fighter, facing), 'light', fighter === 'chrollo' ? 0 : 1)
    const reach = attackData('light', started.player).box.right
    const x = started.player.x + facing * (reach + 1.65)
    const hit = contact({ ...started, opponent: { ...started.opponent, x } })
    expect(hit.player.attack?.comboOpening).toBe('tip')
    expect(followup(hit, 1).impact).toMatchObject({ comboHits: 2, blocked: false })
  })

  it.each([1, -1] as const)('converts an anti-air facing %s', (facing) => {
    const started = command(duel(fighter, facing), 'heavy')
    const hit = contact({
      ...started,
      opponent: { ...started.opponent, y: 6, velocityY: -12 },
    })
    expect(hit.impact?.antiAir).toBe(true)
    expect(hit.player.attack?.comboOpening).toBe('anti-air')
    expect(followup(hit, 1).impact).toMatchObject({ comboHits: 2, blocked: false })
  })

  it.each([1, -1] as const)('converts a corner counter facing %s', (facing) => {
    const base = duel(fighter, facing)
    const wall = facing === 1 ? 93 : 7
    const state = {
      ...base,
      player: { ...base.player, x: wall - 6 * facing },
      opponent: { ...base.opponent, x: wall },
    }
    const side: FightSide = 'opponent'
    const attacking = performMove({ state, side, action: 'heavy', input: EMPTY_INPUT })
    const atWall = { ...attacking, opponent: { ...attacking.opponent, x: wall } }
    const hit = contact(command(atWall, 'light'))
    expect(hit.impact).toMatchObject({ counterHit: true, wallSplat: true })
    expect(hit.player.attack?.comboOpening).toBe('corner-counter')
    expect(followup(hit, -1).impact).toMatchObject({ comboHits: 2, blocked: false })
  })
})

it('only offers the contextual route after a clean confirmation and does not unlock Hatsu', () => {
  const started = command(duel('kurapika', 1), 'light', 1)
  const reach = attackData('light', started.player).box.right
  const x = started.player.x + reach + 1.2
  const aimed = { ...started, opponent: { ...started.opponent, x } }
  expect(comboChoices(aimed).some(({ move }) => move.slot === 'forwardHeavy')).toBe(false)
  const blocked = contact({
    ...aimed,
    opponent: { ...aimed.opponent, blocking: true, guardFrames: 20 },
  })
  expect(blocked.impact?.blocked).toBe(true)
  expect(blocked.player.attack?.comboOpening).toBeUndefined()
  const hit = contact(aimed)
  expect(comboChoices(hit).find(({ move }) => move.slot === 'forwardHeavy')?.status).toBe('ready')
  expect(command(hit, 'special').player.attack?.moveId).toBe('kurapika:forwardLight')
  expect(command(hit, 'special').player.aura).toBe(hit.player.aura)
})

it('does not grant the tip conversion on a whiff or through ordinary close contact', () => {
  const started = command(duel('kurapika', 1), 'light', 1)
  const whiff = contact({ ...started, opponent: { ...started.opponent, x: 93 } })
  expect(whiff.impact).toBeNull()
  expect(command(whiff, 'heavy', 1).player.attack?.moveId).toBe('kurapika:forwardLight')
  const close = contact(started)
  expect(close.impact?.comboHits).toBe(1)
  expect(command(close, 'heavy', 1).player.attack?.moveId).toBe('kurapika:forwardLight')
})

function routeMove(state: FightState, slot: MoveSlot) {
  return performMove({
    state,
    side: 'player',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.player.facing),
  })
}

function tip(fighter: FighterId, facing: 1 | -1) {
  const started = command(duel(fighter, facing), 'light', 1)
  const reach = attackData('light', started.player).box.right
  const x = started.player.x + facing * (reach + 1.65)
  return contact({ ...started, opponent: { ...started.opponent, x } })
}

function corner(fighter: FighterId, facing: 1 | -1, tether = false) {
  let state = duel(fighter, facing)
  state = { ...state, player: { ...state.player, aura: 100 } }
  if (tether) state = prepareCombatRoute(state, 'bungee')
  const x = facing === 1 ? 93 : 7
  state = {
    ...state,
    player: { ...state.player, x: x - 6 * facing, facing },
    opponent: { ...state.opponent, x, facing: facing === 1 ? -1 : 1 },
  }
  const attacking = performMove({ state, side: 'opponent', action: 'heavy', input: EMPTY_INPUT })
  const atWall = { ...attacking, opponent: { ...attacking.opponent, x } }
  return contact(command(atWall, 'light'))
}

function keepGuard(state: FightState, until: number, down = false) {
  for (let ticks = 0; ticks < 130 && (state.impact?.comboHits ?? 0) < until; ticks++) {
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard: true, down },
    })
    expect(state.impact?.blocked).toBe(false)
  }
  expect(state.impact?.comboHits).toBe(until)
  return state
}

describe.each([1, -1] as const)('personal conversions facing %s', (facing) => {
  it('steps into Kurapika’s backfist, then chooses a sweep or the divining chain', () => {
    const opening = tip('kurapika', facing)
    expect(comboChoices(opening).find(({ reward }) => reward === 'backfist')?.status).toBe('ready')
    const pushed = keepGuard(routeMove(opening, 'standingHeavy'), 2)
    const sweep = keepGuard(routeMove(pushed, 'lowHeavy'), 3, true)
    const chain = keepGuard(routeMove(pushed, 'forwardSpecial'), 3)
    expect(sweep.opponent.knockdownFrames).toBeGreaterThan(0)
    expect(chain.player.aura).toBeLessThan(sweep.player.aura - 20)
    expect(routeMove(pushed, 'neutralSpecial')).toBe(pushed)
  })

  it('lets Hisoka keep the wall, attach Gum or spend a real tether', () => {
    const opening = corner('hisoka', facing)
    expect(keepGuard(routeMove(opening, 'backHeavy'), 2).player.aura).toBeGreaterThan(95)
    expect(
      selectedGumLink(keepGuard(routeMove(opening, 'neutralSpecial'), 2), 'player'),
    ).toBeTruthy()
    expect(routeMove(opening, 'finisher').player.attack).toBe(opening.player.attack)
    const tethered = corner('hisoka', facing, true)
    expect(selectedGumLink(tethered, 'player')).toBeTruthy()
    const finisher = routeMove(tethered, 'finisher')
    expect(tethered.player.aura - finisher.player.aura).toBe(55)
    expect(selectedGumLink(keepGuard(finisher, 2), 'player')).toBeFalsy()
  })

  it('lets Franklin choose the short burst at range and either barrage from a wall counter', () => {
    const ranged = tip('franklin', facing)
    const atWall = corner('franklin', facing)
    const short = keepGuard(routeMove(ranged, 'forwardSpecial'), 11)
    expect(short.player.attack?.moveId).toBe('franklin:forwardSpecial')
    expect(routeMove(ranged, 'neutralSpecial').player.attack).toBe(ranged.player.attack)
    const shortWall = routeMove(atWall, 'forwardSpecial')
    const longWall = routeMove(atWall, 'neutralSpecial')
    expect(atWall.player.aura - shortWall.player.aura).toBe(24)
    expect(atWall.player.aura - longWall.player.aura).toBe(40)
    expect(attackData('special', shortWall.player).recovery).toBeLessThan(
      attackData('special', longWall.player).recovery,
    )
    keepGuard(shortWall, 11)
    keepGuard(longWall, 21)
  })
})
