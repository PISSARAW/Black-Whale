import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { advanceEmperorClock, toggleEmperorTime } from './kurapikaActions'
import { restoreDolphinDonor } from './dolphinReturn'
import { EMPEROR_BLACKOUT_THRESHOLD } from './kurapika'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

function frames(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function syringe(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
function base(source: FighterId = 'biscuit'): FightState {
  const state = beginFight(
    createFight('kurapika', source, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['animals'], cohorts: [] } },
    }),
  )
  const x = source === 'sayird' ? 72 : 44
  return {
    ...state,
    player: { ...state.player, x, aura: 100 },
    opponent: { ...state.opponent, x: x + 5, aura: 100 },
  }
}
function equipped(source: FighterId = 'biscuit'): FightState {
  const stolen = frames(syringe(base(source)), 220)
  return syringe(toggleEmperorTime(stolen, 'player'))
}
function lend(state: FightState): FightState {
  return performArsenalCommand(state, 'player', {
    action: 'dolphin-lend',
    target: 'body:opponent:0',
  })
}
function use(state: FightState): FightState {
  return performArsenalAction(
    { state, side: 'opponent', command: { action: 'dolphin-use' } },
    performAuraAttack,
  )
}
function stoppedCookie(): FightState {
  const treated = performArsenalCommand(lend(equipped()), 'opponent', {
    action: 'cookie-massage',
    loan: true,
  })
  expect(treated.opponent.cookie).toBeDefined()
  const stopped = performArsenalCommand(treated, 'opponent', { action: 'cookie-stop', loan: true })
  return frames(stopped, 1)
}
describe('returning the original Hatsu independently of Dolphin dismissal', () => {
  it('returns the real donor’s Hatsu as its application ends, leaving the equipped device and ET running', () => {
    const stopped = stoppedCookie()
    expect(stopped.opponent.stolenChainAbility).toBeUndefined()
    expect(stopped.opponent.dolphinLoan!.held.returned).toBe(true)
    expect(stopped.player.kurapika!.emperorTime).toBe(true)
    expect(stopped.player.kurapika!.dolphinLoans).toHaveLength(1)
    const further = advanceEmperorClock(stopped)
    expect(further.player.kurapika!.lifespanFrames).toBe(
      stopped.player.kurapika!.lifespanFrames + 1,
    )
    expect(use(stopped).opponent.dolphinLoan).toBeUndefined()
  })
  it('also lets the awake lender dismiss a returned loan through their shared Dolphin connection', () => {
    const stopped = stoppedCookie()
    const released = toggleEmperorTime(stopped, 'player')
    expect(released.player.kurapika!.emperorTime).toBe(false)
    expect(released.player.kurapika!.dolphinLoans).toBeUndefined()
    expect(released.opponent.dolphinLoan).toBeUndefined()
  })
  it('keeps Little Eye and its loan during the actual linked blackout, and returns the Hatsu when its animal dies', () => {
    const active = use(lend(equipped('sayird')))
    const animal = active.battlefield!.entities.find(
      (entry) => entry.controller?.side === 'opponent',
    )!
    expect(animal?.controller?.source).toBe('sayird')
    active.player.kurapika!.continuousFrames = EMPEROR_BLACKOUT_THRESHOLD - 1
    const asleep = frames(advanceEmperorClock(active), 10)
    expect(
      asleep.battlefield!.entities.find((entry) => entry.id === animal.id)!.controller,
    ).toBeDefined()
    expect(asleep.opponent.dolphinLoan!.held.returned).not.toBe(true)
    const deadAnimal = {
      ...asleep,
      battlefield: {
        ...asleep.battlefield!,
        entities: asleep.battlefield!.entities.map((entry) =>
          entry.id === animal.id ? { ...entry, health: 0, present: false } : entry,
        ),
      },
    }
    const returned = frames(deadAnimal, 1)
    expect(returned.opponent.stolenChainAbility).toBeUndefined()
    expect(returned.opponent.dolphinLoan!.held.returned).toBe(true)
    expect(returned.player.kurapika!.emperorTime).toBe(true)
    expect(use(returned)).toBe(returned)
    returned.player.kurapika!.blackoutFrames = 1
    const awake = advanceEmperorClock(returned)
    expect(awake.opponent.nen.mode).toBe('zetsu')
    expect(use(awake).opponent.dolphinLoan).toBeUndefined()
  })
  it('gives successive real thefts different identities and never clears the newer seal with an older loan', () => {
    const first = equipped()
    const old = first.player.kurapika!.held!
    let returned = lend(first)
    returned = performArsenalCommand(returned, 'opponent', { action: 'cookie-massage', loan: true })
    returned = performArsenalCommand(returned, 'opponent', { action: 'cookie-stop', loan: true })
    returned = frames(returned, 1)
    const newer = frames(syringe(returned), 100)
    expect(newer.player.kurapika!.held!.theftId).not.toBe(old.theftId)
    const seal = newer.opponent.stolenChainAbility!
    expect(seal.theftId).toBe(newer.player.kurapika!.held!.theftId)
    expect(restoreDolphinDonor(newer, old).opponent.stolenChainAbility).toBe(seal)
    const closed = use(newer)
    expect(closed.opponent.dolphinLoan).toBeUndefined()
    expect(closed.opponent.stolenChainAbility).toBe(seal)
    expect(closed.player.kurapika!.held).toEqual(newer.player.kurapika!.held)
  })
  it('does not allow a voluntary utility stop or an enabled menu during the recipient’s blackout', () => {
    const treated = performArsenalCommand(lend(equipped()), 'opponent', {
      action: 'cookie-massage',
      loan: true,
    })
    treated.player.kurapika!.continuousFrames = EMPEROR_BLACKOUT_THRESHOLD - 1
    const asleep = advanceEmperorClock(treated)
    expect(performArsenalCommand(asleep, 'opponent', { action: 'cookie-stop', loan: true })).toBe(
      asleep,
    )
    expect(arsenalOptions(asleep, 'opponent').every((option) => !option.ready)).toBe(true)
  })
})
describe('Steal Chain remembers the actual technique before its hit interrupts the victim', () => {
  it('steals an executing Texture Surprise and keeps the resulting loan until the surface effect ends', () => {
    const needle = frames(syringe(base('hisoka')), 10)
    const texture = performAuraAttack({
      state: needle,
      side: 'opponent',
      kind: 'special',
      moveId: 'hisoka:downSpecial',
      auraCharged: false,
    })
    expect(texture.opponent.attack?.moveId).toBe('hisoka:downSpecial')
    const stolen = frames(texture, 220)
    expect(stolen.player.kurapika!.held!.moveId).toBe('hisoka:downSpecial')
    const loaded = syringe(toggleEmperorTime(stolen, 'player'))
    const loaned = use(lend(loaded))
    const surface = frames(loaned, 60)
    expect(surface.opponent.textureSurprise).toBeDefined()
    expect(surface.opponent.dolphinLoan!.held.returned).not.toBe(true)
    expect(surface.opponent.dolphinLoan!.held.sustainedKeys).toContain('texture')
    expect(use(surface).opponent.textureSurprise).toBeUndefined()
  })
})
