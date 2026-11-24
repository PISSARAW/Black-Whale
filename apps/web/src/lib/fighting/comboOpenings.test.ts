import { describe, expect, it } from 'vitest'
import { resolveFightImpacts } from './combatImpact'
import { comboChoices } from './comboChoices'
import { prepareCombatRoute, type CombatRouteSetup } from './combatRouteSetup'
import { selectedGumLink } from './bungeeNetwork'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { attackData } from './frameData'
import { moveById } from './movesets'
import { FIGHTING_ROSTER } from './roster'
import { rosterPhysicalBranch, ROSTER_TECHNIQUE_BRANCHES } from './rosterComboBranches'
import type { ComboOpening } from './comboOpenings'
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
  return centre(state, facing)
}

function centre(state: FightState, facing: 1 | -1): FightState {
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
    expectPhysicalBranch(hit, 'tip')
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
    expectPhysicalBranch(hit, 'anti-air')
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
    expectPhysicalBranch(hit, 'corner-counter')
  })
})

it('only offers the contextual route after a clean confirmation and does not unlock Hatsu', () => {
  const started = command(duel('kurapika', 1), 'light', 1)
  const reach = attackData('light', started.player).box.right
  const x = started.player.x + reach + 1.2
  const aimed = { ...started, opponent: { ...started.opponent, x } }
  expect(comboChoices(aimed).some(({ opening }) => opening === 'tip')).toBe(false)
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
  expect(command(whiff, 'heavy', 1).player.attack?.comboOpening).toBeUndefined()
  const close = contact(started)
  expect(close.impact?.comboHits).toBe(1)
  expect(command(close, 'heavy', 1).player.attack?.comboOpening).toBeUndefined()
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
  const started = command(duel(fighter, facing), 'light', fighter === 'chrollo' ? 0 : 1)
  const reach = attackData('light', started.player).box.right
  const x = started.player.x + facing * (reach + 1.65)
  return contact({ ...started, opponent: { ...started.opponent, x } })
}

function corner(fighter: FighterId, facing: 1 | -1, setup?: CombatRouteSetup) {
  let state = duel(fighter, facing)
  state = { ...state, player: { ...state.player, aura: 100 } }
  if (setup) state = prepareCombatRoute(state, setup)
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

function antiAir(fighter: FighterId, facing: 1 | -1, setup?: CombatRouteSetup) {
  let state = duel(fighter, facing)
  state = { ...state, player: { ...state.player, aura: 100 } }
  if (setup) state = centre(prepareCombatRoute(state, setup), facing)
  const started = command(state, 'heavy')
  return contact({ ...started, opponent: { ...started.opponent, y: 6, velocityY: -12 } })
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

function expectPhysicalBranch(hit: FightState, event: ComboOpening) {
  const branch = rosterPhysicalBranch(hit.player.id, event)!
  expect(branch.slot).not.toBe(event === 'corner-counter' ? 'backHeavy' : 'forwardHeavy')
  const list = comboChoices(hit).filter(({ move }) => move.slot === branch.slot)
  expect(list).toContainEqual(expect.objectContaining({ status: 'ready', opening: event, cost: 0 }))
  for (const down of [false, true]) {
    const started = routeMove(hit, branch.slot)
    expect(moveById(started.player.attack?.moveId)?.slot).toBe(branch.slot)
    const converted = keepGuard(started, 2, down)
    if (branch.slot === 'lowHeavy') expect(converted.opponent.knockdownFrames).toBeGreaterThan(0)
  }
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
    const tethered = corner('hisoka', facing, 'bungee')
    expect(selectedGumLink(tethered, 'player')).toBeTruthy()
    const finisher = routeMove(tethered, 'finisher')
    expect(tethered.player.aura - finisher.player.aura).toBe(55)
    expect(selectedGumLink(keepGuard(finisher, 2), 'player')).toBeFalsy()
  })

  it('lets Franklin mix either barrage into a ranged hit or a wall counter', () => {
    const ranged = tip('franklin', facing)
    const atWall = corner('franklin', facing)
    const short = keepGuard(routeMove(ranged, 'forwardSpecial'), 11)
    expect(short.player.attack?.moveId).toBe('franklin:forwardSpecial')
    const long = routeMove(ranged, 'neutralSpecial')
    expect(long.player.attack?.moveId).toBe('franklin:neutralSpecial')
    const shortWall = routeMove(atWall, 'forwardSpecial')
    const longWall = routeMove(atWall, 'neutralSpecial')
    expect(atWall.player.aura - shortWall.player.aura).toBe(24)
    expect(atWall.player.aura - longWall.player.aura).toBe(40)
    expect(attackData('special', shortWall.player).recovery).toBeLessThan(
      attackData('special', longWall.player).recovery,
    )
    keepGuard(long, 21)
    keepGuard(shortWall, 11)
    keepGuard(longWall, 21)
  })

  it('gives Franklin a raking barrage against a crouched target', () => {
    for (const opening of [tip('franklin', facing), corner('franklin', facing)]) {
      const lowBurst = routeMove(opening, 'downSpecial')
      expect(opening.player.aura - lowBurst.player.aura).toBe(20)
      keepGuard(lowBurst, 11, true)
    }
  })
})

const TECHNIQUE_SETUP = { biscuit: 'true-form', kalluto: 'paper' } as Partial<
  Record<FighterId, CombatRouteSetup>
>
const OPENERS = { tip, 'anti-air': antiAir, 'corner-counter': corner }

describe.each(Object.keys(ROSTER_TECHNIQUE_BRANCHES) as FighterId[])(
  '%s signature conversion',
  (id) => {
    it.each([1, -1] as const)('lands with legal resources facing %s', (facing) => {
      for (const [opening, branches] of Object.entries(ROSTER_TECHNIQUE_BRANCHES[id]!)) {
        const event = opening as keyof typeof OPENERS
        const setup = TECHNIQUE_SETUP[id]
        const hit = OPENERS[event](id, facing, setup)
        const missingResource = id === 'theta' ? { weaponsConfiscated: true } : { aura: 0 }
        const withoutResource = { ...hit, player: { ...hit.player, ...missingResource } }
        for (const branch of branches) {
          expect(comboChoices(hit).find(({ move }) => move.slot === branch.slot)).toMatchObject({
            opening: event,
            reward: 'technique',
            status: 'ready',
          })
          expect(routeMove(withoutResource, branch.slot).player.attack).toBe(hit.player.attack)
          expect(
            comboChoices(withoutResource).find(({ move }) => move.slot === branch.slot)?.status,
          ).toBe('unavailable')
          if (setup) {
            const unprepared = OPENERS[event](id, facing)
            expect(routeMove(unprepared, branch.slot).player.attack).toBe(unprepared.player.attack)
          }
          const started = routeMove(hit, branch.slot)
          expect(started.player.attack?.comboFollowup).toBeUndefined()
          keepGuard(started, 2)
        }
      }
    })
  },
)
