import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performAuraAttack } from './engine'
import { attackData } from './frameData'
import { updateControlledFighter } from './duelStep/actors'
import { resolveAllKameoContacts } from './kameos/contacts'
import { withKameos } from './kameos/state'
import { sweetHomeContacts } from './sweetHomeContacts'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'
import type { KameoSlot } from './kameos/types'
import type { PreparedEntity } from './preparationTypes'

const slotOf = (state: FightState) => state.kameos?.player as KameoSlot

const crate = (id: string, x: number, health = 100): PreparedEntity => ({
  id,
  kind: 'crate',
  material: 'real',
  owner: 'neutral',
  x,
  y: 0,
  present: true,
  health,
})

/** Terebellum at 40, her kameo Morena at 43 under the right hand, Hisoka at 48. */
function stage(crates: PreparedEntity[] = [], kameoX = 43): FightState {
  const base = beginFight(withKameos(createFight('terebellum', 'hisoka'), { player: 'morena' }))
  const slot = slotOf(base)
  return {
    ...base,
    player: { ...base.player, x: 40, aura: 100 },
    opponent: { ...base.opponent, x: 48 },
    kameos: { player: { ...slot, phase: 'acting', fighter: { ...slot.fighter, x: kameoX } } },
    battlefield: {
      entities: crates,
      interactionHeld: { player: false, opponent: false },
      completed: { player: 0, opponent: 0 },
    },
  }
}

/** Holds a Terebellum special at its first active frame, without its own carrier landing. */
function hold(state: FightState, slot: MoveSlot, object?: string): FightState {
  const armed = object ? { ...state, player: { ...state.player, sweetHomeObject: object } } : state
  const next = performAuraAttack({
    state: armed,
    side: 'player',
    kind: 'special',
    moveId: `terebellum:${slot}`,
    auraCharged: false,
  })
  const attack = next.player.attack!
  const frame = attackData(attack.kind, next.player).startup
  return { ...next, player: { ...next.player, attack: { ...attack, frame, impacted: true } } }
}

/** Hisoka's heavy reaches the kameo; Terebellum's pose stays frozen in its active frames. */
function strike(state: FightState): FightState {
  let next = performAttack(state, 'opponent', 'heavy')
  for (let frame = 0; frame < 40 && next.impact === null; frame++) {
    next = { ...next, opponent: updateControlledFighter(next.opponent, EMPTY_INPUT) }
    next = resolveAllKameoContacts(next)
  }
  return next
}

describe('Terebellum · manual transfer circuit around an ally', () => {
  it('lets the kameo take the strike when the right hand is not on it', () => {
    const struck = strike(stage())
    expect(slotOf(struck).fighter.health).toBeLessThan(slotOf(struck).fighter.maxHealth)
    expect(struck.player.health).toBe(struck.player.maxHealth)
    expect(struck.impact?.transfer).toBeUndefined()
  })

  it('sacrifices the crate under the left hand to protect the ally under the right', () => {
    const struck = strike(hold(stage([crate('box', 44)]), 'forwardSpecial', 'box'))
    const box = struck.battlefield!.entities[0]
    expect(slotOf(struck).fighter.health).toBe(slotOf(struck).fighter.maxHealth)
    expect(struck.player.health).toBe(struck.player.maxHealth)
    expect(box.health).toBeLessThan(100)
    expect(struck.impact?.damage).toBe(0)
    expect(struck.impact?.objectTransfer).toEqual({
      objectId: 'box',
      owner: 'player',
      damage: 100 - box.health,
      ally: true,
    })
  })

  it('ends the wound in her own left hand without a receptacle', () => {
    const state = hold(stage(), 'downSpecial')
    const struck = strike(state)
    expect(slotOf(struck).fighter.health).toBe(slotOf(struck).fighter.maxHealth)
    expect(struck.player.health).toBeLessThan(state.player.health)
    expect(struck.player.attack).toBeNull()
    expect(struck.impact?.zone).toBe('hands')
    expect(struck.impact?.transfer).toMatchObject({ to: 'player', backlash: true, ally: true })
  })

  it('never redirects into another nearby object once the chosen one is broken', () => {
    const state = hold(stage([crate('box', 44, 0), crate('spare', 44)]), 'forwardSpecial', 'box')
    const struck = strike(state)
    expect(struck.battlefield!.entities[1].health).toBe(100)
    expect(struck.player.health).toBeLessThan(state.player.health)
    expect(struck.impact?.transfer).toMatchObject({ backlash: true, ally: true })
  })

  it('needs the right-hand contact at impact: an ally behind her hand is not protected', () => {
    const away = stage([crate('box', 37)])
    const turned = { ...away, player: { ...away.player, facing: -1 as const } }
    const struck = strike(hold(turned, 'forwardSpecial', 'box'))
    expect(slotOf(struck).fighter.health).toBeLessThan(slotOf(struck).fighter.maxHealth)
    expect(struck.battlefield!.entities[0].health).toBe(100)
  })

  it('keeps one body per hand: protecting the ally frees the opponent from the right hand', () => {
    const near = hold({ ...stage(), opponent: { ...stage().opponent, x: 44 } }, 'downSpecial')
    expect(sweetHomeContacts(near, 'player')?.right).toBeNull()
    const alone = { ...near, kameos: undefined }
    expect(sweetHomeContacts(alone, 'player')?.right).toBe('opponent')
  })
})
