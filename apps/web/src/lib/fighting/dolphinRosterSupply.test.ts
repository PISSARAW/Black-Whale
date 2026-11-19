import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { captureDolphinAura } from './dolphinAura'
import { performDolphinLoan, advanceLoanGuest } from './dolphinLoan'
import { advanceRosterGuestActors } from './rosterGuestActors'
import { createKurapika } from './kurapika'
import { dolphinIsBusy } from './kurapikaDolphin'
import { fightReplayHash } from './fightReplayHash'
import { toggleEmperorTime } from './kurapikaActions'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function loan(side: FightSide, amount = 80): FightState {
  const state = beginFight(
    createFight(
      side === 'player' ? 'kurapika' : 'hisoka',
      side === 'opponent' ? 'kurapika' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  const donor = createFight('franklin', 'hisoka').player
  return {
    ...state,
    [side]: {
      ...state[side],
      aura: 100,
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        held: {
          victim: side === 'player' ? 'opponent' : 'player',
          source: 'franklin',
          moveId: 'franklin:neutralSpecial',
          auraSupply: { ...captureDolphinAura(donor), amount },
          loaded: true,
          used: false,
          sustainedKeys: [],
        },
      },
    },
  }
}
function call(state: FightState, side: FightSide) {
  return performDolphinLoan({ state, side, command: { action: 'dolphin-loan' } })
}

describe('the roster recipient uses one finite donor reserve', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`casts with an exhausted recipient’s body but the donor’s aura for ${side}`, () => {
      const called = call(loan(side), side)
      const guest = called.rosterGuests![0]
      const exhausted = {
        ...guest,
        fighter: { ...guest.fighter, aura: 0, auraExhausted: true },
      }
      const ready = { ...called, rosterGuests: [exhausted] }
      const cast = advanceLoanGuest(ready, exhausted, performAuraAttack)
      const body = cast.rosterGuests![0].fighter
      expect(body.attack?.moveId).toBe('franklin:neutralSpecial')
      expect(body.aura).toBe(0)
      expect(body.auraExhausted).toBe(true)
      expect(body.dolphinExecution).toBeUndefined()
      expect(body.id).toBe(guest.fighter.id)
      const supply = body.kurapika!.held!.auraSupply!
      expect(supply.originalOwner).toBe('franklin')
      expect(supply.amount).toBeLessThan(80)
      expect(supply.committed).toBeGreaterThan(0)
      expect(cast[side].kurapika!.held!.auraSupply).toEqual(supply)
      expect(cast[side].aura).toBe(called[side].aura)
    })
    it(`cannot substitute the recipient’s own large reserve for insufficient donor aura for ${side}`, () => {
      const called = call(loan(side, 1), side)
      const guest = called.rosterGuests![0]
      const wealthy = { ...guest, fighter: { ...guest.fighter, aura: 100 } }
      const result = advanceLoanGuest(
        { ...called, rosterGuests: [wealthy] },
        wealthy,
        performAuraAttack,
      )
      expect(result.rosterGuests![0].fighter.attack).toBeNull()
      expect(result[side].dolphinLoanResult).toBe('conditions-unmet')
      expect(result[side].kurapika!.held!.auraSupply!.amount).toBe(1)
      expect(result[side].kurapika!.held!.used).toBe(false)
    })
    it(`keeps the lender connected through the actual attack and projectiles for ${side}`, () => {
      let state = call(loan(side), side)
      const enemy = side === 'player' ? 'opponent' : 'player'
      state = { ...state, [enemy]: { ...state[enemy], x: side === 'player' ? 97 : 3 } }
      const guestId = state.rosterGuests![0].id
      expect(dolphinIsBusy(state, side, state[side].kurapika!.held!)).toBe(true)
      expect(toggleEmperorTime(state, side)).toBe(state)
      let sawGuestProjectile = false
      for (let frame = 0; frame < 24; frame++) {
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
        sawGuestProjectile ||= state.projectiles.some((shot) => shot.sourceBody === guestId)
      }
      expect(state[side].kurapika!.held!.lentTo).toBe(guestId)
      expect(sawGuestProjectile).toBe(true)
      expect(state[side].kurapika!.lifespanFrames).toBeGreaterThan(0)
      for (let frame = 0; frame < 180; frame++)
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      expect(state[side].kurapika!.held).toBeNull()
      expect(state.rosterGuests![0].phase).not.toBe('acting')
      expect(state[side].kurapika!.emperorTime).toBe(true)
    })
    it(`does not invent a donor reserve for ${side}`, () => {
      const state = loan(side, 0)
      expect(call(state, side)).toBe(state)
      const absent = {
        ...state,
        [side]: {
          ...state[side],
          kurapika: {
            ...state[side].kurapika!,
            held: { ...state[side].kurapika!.held!, auraSupply: undefined },
          },
        },
      }
      expect(call(absent, side)).toBe(absent)
    })
  }
  it('remains deterministic through the real guest update', () => {
    const state = call(loan('player'), 'player')
    const first = advanceRosterGuestActors(state, performAuraAttack)
    const second = advanceRosterGuestActors(structuredClone(state), performAuraAttack)
    expect(fightReplayHash(first)).toBe(fightReplayHash(second))
  })
})
