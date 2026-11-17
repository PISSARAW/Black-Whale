import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { advanceBlackVoice } from './blackVoiceFrame'
import { chrolloHatsu } from './hatsu/chrollo'
import { canAct } from './fightActorState'
import { forceZetsu } from './nen'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalActionId } from './retrospectiveTypes'

function ready(): FightState {
  const state = beginFight(
    createFight('chrollo', 'illumi', {
      mode: 'training',
      environment: { preparation: { mode: 'scenario', resources: [], cohorts: ['player'] } },
    }),
  )
  return {
    ...state,
    player: {
      ...state.player,
      x: 44,
      aura: 100,
      chrolloBook: { ...state.player.chrolloBook!, page: 1 },
    },
    opponent: { ...state.opponent, x: 49, aura: 100 },
  }
}
function command(
  state: FightState,
  action: ArsenalActionId,
  target?: string,
  side: FightSide = 'player',
): FightState {
  return performArsenalCommand(state, side, { action, target })
}
function planted(): FightState {
  return command(command(ready(), 'voice-arm'), 'voice-implant', 'opponent')
}
function controlled(): FightState {
  return command(command(planted(), 'voice-phone'), 'voice-retreat', 'opponent')
}

describe('Black Voice original phone and two physical antennas', () => {
  it('does not conjure replacement gear from a page or ordinary needles', () => {
    const state = ready(),
      original = state.player.blackVoiceGear!
    expect(original.antennas).toHaveLength(2)
    expect(original.antennas.every((pin) => pin.pairId === original.phone!.pairId)).toBe(true)
    const without: FightState = {
      ...state,
      player: {
        ...state.player,
        blackVoiceGear: undefined,
        equipment: ['book', 'needles'],
      },
    }
    expect(command(without, 'voice-arm')).toBe(without)
    expect(
      performAuraAttack({
        state: without,
        side: 'player',
        kind: 'special',
        moveId: 'chrollo:neutralSpecial',
        auraCharged: false,
      }),
    ).toBe(without)
  })
  it('reserves the actual hands for the book, phone and pin', () => {
    const phone = command(ready(), 'voice-phone')
    expect(phone.player.blackVoiceGear?.phone?.hand).toBe('left')
    expect(command(phone, 'voice-arm')).toBe(phone)
    const armed = command(command(phone, 'voice-pocket'), 'voice-arm')
    expect(armed.player.blackVoiceGear?.armed?.hand).toBe('left')
    expect(command(armed, 'voice-phone')).toBe(armed)
    const pin = command(armed, 'voice-implant', 'opponent')
    expect(pin.player.blackVoiceGear?.armed).toBeUndefined()
    expect(command(pin, 'voice-phone').player.blackVoiceGear?.phone?.hand).toBe('left')
  })
  it('requires the paired phone to give an order, then maintains it beyond 90 frames', () => {
    const state = planted()
    expect(state.opponent.blackVoiceControl).toMatchObject({ active: false })
    expect(command(state, 'voice-retreat', 'opponent')).toBe(state)
    const ordered = controlled()
    let next = ordered
    for (let index = 0; index < 160; index++) next = advanceBlackVoice(next)
    expect(next.opponent.x).toBeGreaterThan(ordered.opponent.x)
    expect(next.opponent.blackVoiceControl).toMatchObject({ active: true, order: 'retreat' })
    expect(canAct(next.opponent)).toBe(false)
    expect(command(next, 'voice-remove', 'opponent', 'opponent')).toBe(next)
    const pocketed = command(ordered, 'voice-pocket')
    expect(advanceBlackVoice(pocketed).opponent.blackVoiceControl?.active).toBe(true)
    expect(command(pocketed, 'voice-stay', 'opponent')).toBe(pocketed)
  })
  it('keeps the pin physical when a lost page ends the Nen, and frees autonomy on removal', () => {
    const state = controlled()
    const lost = chrolloHatsu.onFrame({ ...state, player: forceZetsu(state.player) })
    expect(lost.opponent.blackVoiceControl).toMatchObject({ active: false })
    expect(lost.opponent.hatsuEffects.manipulatedFrames).toBe(0)
    const freeHand = command(command(controlled(), 'voice-pocket'), 'voice-approach', 'opponent')
    const near = { ...freeHand, player: { ...freeHand.player, x: 47 } }
    const released = command(near, 'voice-remove', 'opponent')
    expect(released.opponent.blackVoiceControl).toBeUndefined()
    expect(
      released.battlefield?.entities.find((e) => e.blackVoicePiece?.part === 'antenna'),
    ).toMatchObject({ present: true, material: 'real' })
    expect(canAct(released.opponent)).toBe(true)
  })
  it('consumes the two original pins across separate living people and never creates a third', () => {
    let state = ready()
    const ids = state.battlefield!.entities.filter((e) => e.kind === 'supporter').map((e) => e.id)
    state = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) => ({ ...entry, x: 46 })),
      },
    }
    for (const id of ids.slice(0, 2))
      state = command(command(state, 'voice-arm'), 'voice-implant', id)
    expect(state.player.blackVoiceGear?.antennas).toHaveLength(0)
    expect(command(state, 'voice-arm')).toBe(state)
    expect(command(state, 'voice-implant', ids[2])).toBe(state)
    state = command(state, 'voice-phone')
    for (const id of ids.slice(0, 2)) state = command(state, 'voice-attack', id)
    expect(state.battlefield!.entities.filter((e) => e.blackVoiceControl?.active)).toHaveLength(2)
  })
  it('rejects a corpse, clone, already manipulated person and distant implantation', () => {
    const state = command(ready(), 'voice-arm')
    for (const opponent of [
      { ...state.opponent, health: 0 },
      { ...state.opponent, x: 80 },
      {
        ...state.opponent,
        needlePuppet: { owner: 'player' as const, order: 'stay' as const, needleEmbedded: true },
      },
    ]) {
      const blocked = { ...state, opponent }
      expect(command(blocked, 'voice-implant', 'opponent')).toBe(blocked)
    }
  })
  it('drops and recovers original objects without giving Gallery Fake copies their binding', () => {
    const state = command(ready(), 'voice-drop', 'phone')
    expect(state.player.blackVoiceGear?.phone).toBeUndefined()
    const phone = state.battlefield!.entities.find((e) => e.blackVoicePiece?.part === 'phone')!
    const taken = command(state, 'voice-pickup', phone.id)
    expect(taken.player.blackVoiceGear?.phone?.id).toBe(phone.id)
    expect(taken.battlefield!.entities.find((e) => e.id === phone.id)?.present).toBe(false)
    expect(command(taken, 'voice-pickup', phone.id)).toBe(taken)
    const copy = {
      ...phone,
      id: 'fake-phone',
      material: 'nen' as const,
      copy: { owner: 'player' as const, originalId: phone.id, createdAt: 0, headAttached: true },
    }
    const fake = { ...state, battlefield: { ...state.battlefield!, entities: [copy] } }
    expect(command(fake, 'voice-pickup', copy.id)).toBe(fake)
  })
  it('admits a real combat implantation and exposes the phone command in the arsenal', () => {
    let state = performAuraAttack({
      state: ready(),
      side: 'player',
      kind: 'special',
      moveId: 'chrollo:neutralSpecial',
      auraCharged: false,
    })
    expect(state.player.blackVoiceGear?.armed).toBeDefined()
    for (let index = 0; index < 55; index++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(state.opponent.blackVoiceControl).toBeDefined()
    const option = arsenalOptions(state, 'player').find(
      (entry) => entry.command.action === 'voice-phone',
    )!
    expect(option.ready).toBe(true)
    state = performArsenalCommand(state, 'player', option.command)
    state = command(state, 'voice-stay', 'opponent')
    expect(state.opponent.blackVoiceControl?.active).toBe(true)
  })
})
