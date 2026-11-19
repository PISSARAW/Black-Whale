import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAuraAttack, tickFight } from './engine'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { advanceEmperorClock, toggleEmperorTime } from './kurapikaActions'
import { EMPEROR_BLACKOUT_THRESHOLD } from './kurapika'
import { updateEntity } from './preparationWorld'
import { controlledEntities } from './preparationActions'
import { speakPaperWords } from './kallutoListening'
import { privatePvpState } from './pvp/view'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

const OITO = 'person:queen-oito'
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
function prepared(source: FighterId = 'sayird'): FightState {
  const initial = beginFight(
    createFight('kurapika', source, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: 'scenario', resources: ['people', 'animals', 'plants'], cohorts: [] },
      },
    }),
  )
  const close: FightState = {
    ...initial,
    player: { ...initial.player, x: 22, aura: 100 },
    opponent: { ...initial.opponent, x: 27, aura: 30 },
  }
  const drained = frames(syringe(close), 160)
  expect(drained.player.kurapika!.held!.source).toBe(source)
  return syringe(toggleEmperorTime(drained, 'player'))
}
function person(state: FightState) {
  return state.battlefield!.entities.find((entry) => entry.id === OITO)!
}
function lend(state = prepared()): FightState {
  return performArsenalCommand(state, 'player', { action: 'dolphin-lend', target: OITO })
}
function command(
  state: FightState,
  action:
    | 'person-dolphin-use'
    | 'person-dolphin-close'
    | 'person-eye-left'
    | 'person-eye-right'
    | 'person-eye-release',
): FightState {
  return performArsenalCommand(state, 'player', { action, target: OITO })
}
function active(): FightState {
  return frames(command(lend(), 'person-dolphin-use'), 8)
}

describe('Stealth Dolphin lends to the real unawakened scenario recipient', () => {
  it('uses a separate Oito body, actual syringe reach and an unused equipped Hatsu without granting fighter statistics', () => {
    const initial = prepared()
    expect(initial.battlefield!.entities.filter((entry) => entry.person)).toHaveLength(1)
    const distant = updateEntity(initial, OITO, { x: 80 })
    expect(lend(distant)).toBe(distant)
    const absent = updateEntity(initial, OITO, { present: false })
    expect(lend(absent)).toBe(absent)
    const equipped = lend(initial)
    expect(equipped.player.id).toBe('kurapika')
    expect(equipped.opponent.id).toBe('sayird')
    expect(equipped.player.kurapika!.held).toBeNull()
    expect(equipped.player.kurapika!.dolphinLoans).toEqual([{ person: OITO }])
    expect(person(equipped).person).toMatchObject({
      identity: 'queen-oito',
      nen: 'closed',
      loan: { held: { source: 'sayird', used: false } },
    })
    expect(person(equipped).person).not.toHaveProperty('ten')
    expect(person(equipped).person).not.toHaveProperty('mastery')
    expect(person(equipped).person).not.toHaveProperty('aura')
    expect(toggleEmperorTime(equipped, 'player')).toBe(equipped)
  })
  it('activates the single external application with donor aura, opening nodes without personal Ten or a personal Hatsu', () => {
    const equipped = lend()
    const supply = person(equipped).person!.loan!.held.auraSupply!.amount
    const ownAura = equipped.player.aura
    const launched = command(equipped, 'person-dolphin-use')
    expect(person(launched).person!.nen).toBe('semi-open')
    expect(person(launched).person!.loan!.held.auraSupply!.amount).toBe(supply - 2)
    expect(launched.player.aura).toBe(ownAura)
    expect(launched.battlefield!.littleEyeShots).toHaveLength(1)
    expect(launched.battlefield!.littleEyeShots![0].person).toBe(OITO)
    expect(command(launched, 'person-dolphin-use')).toBe(launched)
    const captured = frames(launched, 8)
    const animal = captured.battlefield!.entities.find(
      (entry) => entry.controller?.person === OITO,
    )!
    expect(animal.controller!.source).toBe('sayird')
    expect(controlledEntities(captured, 'player')).toHaveLength(0)
    expect(person(captured).person!.littleEyeScreen!.animal).toBe(animal.id)
    expect(performArsenalCommand(captured, 'player', { action: 'little-eye-left' })).toBe(captured)
    expect(
      performArsenalCommand(captured, 'opponent', { action: 'person-eye-right', target: OITO }),
    ).toBe(captured)
  })
  it('keeps Little Eye and its last order throughout the linked blackout, without new commands or perceptions', () => {
    const ordered = command(active(), 'person-eye-right')
    const screen = person(ordered).person!.littleEyeScreen
    ordered.player.kurapika!.continuousFrames = EMPEROR_BLACKOUT_THRESHOLD - 1
    const asleep = frames(advanceEmperorClock(ordered), 8)
    expect(person(asleep).person!.loan!.blackoutFrames).toBeGreaterThan(0)
    expect(person(asleep).person!.littleEyeScreen).toEqual(screen)
    const before = ordered.battlefield!.entities.find((entry) => entry.controller?.person === OITO)!
    expect(asleep.battlefield!.entities.find((entry) => entry.id === before.id)!.x).toBeGreaterThan(
      before.x,
    )
    expect(command(asleep, 'person-eye-left')).toBe(asleep)
    expect(
      arsenalOptions(asleep, 'player')
        .filter((entry) => entry.command.action.startsWith('person-'))
        .every((entry) => !entry.ready),
    ).toBe(true)
  })
  it('returns the actual donor’s Hatsu on animal death and closes Dolphin separately without erasing the node opening', () => {
    let state = active()
    const animal = state.battlefield!.entities.find((entry) => entry.controller?.person === OITO)!
    state = frames(updateEntity(state, animal.id, { health: 0 }), 1)
    expect(state.opponent.stolenChainAbility).toBeUndefined()
    expect(person(state).person!.loan!.held.returned).toBe(true)
    expect(state.player.kurapika!.emperorTime).toBe(true)
    const closed = command(state, 'person-dolphin-close')
    expect(person(closed).person!.loan).toBeUndefined()
    expect(person(closed).person!.nen).toBe('semi-open')
    expect(closed.player.kurapika!.dolphinLoans).toBeUndefined()
    expect(toggleEmperorTime(closed, 'player').player.kurapika!.emperorTime).toBe(false)
  })
  it('uses Erigeron on a real contacted seed with the donor’s finite aura, as in the awakening lessons', () => {
    const equipped = lend(prepared('bill'))
    const supply = person(equipped).person!.loan!.held.auraSupply!.amount
    const used = command(equipped, 'person-dolphin-use')
    expect(used.battlefield!.entities.find((entry) => entry.id === 'player:seed')!.growth).toBe(1)
    expect(person(used).person!.loan!.held.auraSupply!.amount).toBe(supply - 20)
    expect(person(used).person!.nen).toBe('semi-open')
    expect(person(used).person!.loan!.held.returned).toBe(true)
    expect(used.opponent.stolenChainAbility).toBeUndefined()
    expect(used.player.health).toBe(equipped.player.health)
    expect(used.player.kurapika!.emperorTime).toBe(true)
  })
  it('cannot awaken or spend another person’s aura without the real material target or adequate donor stock', () => {
    const equipped = lend(prepared('bill'))
    const dry = structuredClone(equipped)
    person(dry).person!.loan!.held.auraSupply!.amount = 19
    expect(command(dry, 'person-dolphin-use')).toBe(dry)
    expect(person(dry).person!.nen).toBe('closed')
    const absent = updateEntity(equipped, 'player:seed', { present: false })
    expect(command(absent, 'person-dolphin-use')).toBe(absent)
    expect(person(absent).person!.nen).toBe('closed')
  })
  it('retains the real recipient, equipped loan and controlled animal across a round boundary', () => {
    const used = active()
    const animal = used.battlefield!.entities.find((entry) => entry.controller?.person === OITO)!
    const next = nextRound({ ...used, phase: 'finished', winner: 'player' })
    expect(person(next).person).toEqual(person(used).person)
    expect(next.battlefield!.entities.find((entry) => entry.id === animal.id)!.controller).toEqual(
      animal.controller,
    )
    expect(next.player.kurapika!.emperorTime).toBe(true)
  })
  it('keeps the animal’s speech private to its actual recipient rather than copying it into the lender’s mind', () => {
    const used = active()
    const audible = { ...used, opponent: { ...used.opponent, x: 31 } }
    const heard = speakPaperWords(audible, 'opponent', 'Je suis dans cette pièce.')
    expect(person(heard).person!.littleEyeScreen!.words.at(-1)!.text).toBe(
      'Je suis dans cette pièce.',
    )
    expect(heard.player.littleEyeScreen).toBeUndefined()
    const otherView = privatePvpState(heard, 'opponent')
    expect(person(otherView).person!.littleEyeScreen).toBeUndefined()
    expect(person(otherView).person!.loan).toBeUndefined()
    expect(person(privatePvpState(heard, 'player')).person!.loan).toBeDefined()
  })
})
