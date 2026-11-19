import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { CHROLLO_TURN, type ChrolloPage } from './chrolloBook'
import { bodyPartFunctional } from './bodyDamage'
import { dismissDolphinGum, dolphinIsBusy } from './kurapikaDolphin'
import { privatePvpState } from './pvp/view'
import { styleMobility } from './styleMobility'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(side: FightSide, spec: { book: ChrolloPage; loan: string }): FightState {
  const lender = side === 'player' ? 'opponent' : 'player'
  const state = beginFight(
    createFight(
      side === 'player' ? 'chrollo' : 'kurapika',
      side === 'opponent' ? 'chrollo' : 'kurapika',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          preparation: {
            mode: 'scenario',
            resources: [],
            cohorts: [],
            injuries: { [side]: 'hand-and-lower-leg' },
          },
        },
      },
    ),
  )
  return {
    ...state,
    [side]: {
      ...state[side],
      aura: 100,
      health: 37,
      chrolloBook: { pages: [spec.book, 'sun-and-moon'], page: 0, open: true, bookmark: null },
      dolphinLoan: {
        lender: { owner: lender, member: 0 },
        held: {
          source: 'hisoka',
          moveId: spec.loan,
          victim: lender,
          theftId: 'prosthesis-loan',
          loaded: true,
          used: false,
          sustainedKeys: [],
          auraSupply: {
            ...captureDolphinAura(createFight('hisoka', 'chrollo').player),
            amount: 80,
          },
        },
      },
    },
    [lender]: {
      ...state[lender],
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: side, member: 0 }],
      },
    },
  }
}
function command(state: FightState, side: FightSide, command: ArsenalCommand) {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
function frames(state: FightState, count = 45): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function closeBook(state: FightState, side: FightSide): FightState {
  return performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: CHROLLO_TURN,
    auraCharged: false,
  })
}
function spec(book: ChrolloPage = 'hisoka:neutralSpecial', loan = 'hisoka:neutralSpecial') {
  return { book, loan }
}

describe('copied and borrowed prostheses keep the injured body and their own Hatsu conditions', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`keeps the recipient’s own movement profile during a borrowed elastic step for ${side}`, () => {
      const base = ready(side, spec())
      const recipient = {
        ...base,
        [side]: { ...base[side], id: 'theta' as const, chrolloBook: undefined },
      }
      const formed = frames(command(recipient, side, { action: 'gum-prosthesis', loan: true }))
      const donor = formed[side].dolphinLoan!.held.auraSupply!.amount
      const stepped = command(formed, side, { action: 'gum-spring-step', loan: true })
      expect(stepped[side].motion?.dash).toMatchObject(styleMobility(formed[side]).forwardDash)
      expect(stepped[side].id).toBe('theta')
      expect(stepped[side].dolphinLoan!.held.auraSupply!.amount).toBe(donor)
    })
    it(`restores a real free hand for interception when the other hand holds the book for ${side}`, () => {
      const state = ready(side, spec())
      expect(command(state, side, { action: 'gum-catch' })).toBe(state)
      const formed = frames(command(state, side, { action: 'gum-prosthesis' }))
      const prepared = command(formed, side, { action: 'gum-catch' })
      expect(prepared[side].gumCatch?.hand).toBe('left')
    })
    it(`spends finite donor aura with no personal reserve and maintains the actual loan for ${side}`, () => {
      const initial = ready(side, spec())
      const state = { ...initial, [side]: { ...initial[side], aura: 0, auraExhausted: true } }
      const formed = command(state, side, { action: 'gum-prosthesis', loan: true })
      expect(formed[side].gumProstheses).toMatchObject({
        source: 'dolphin',
        theftId: 'prosthesis-loan',
      })
      expect(formed[side].aura).toBe(0)
      expect(formed[side].dolphinLoan!.held.auraSupply!.amount).toBe(64)
      expect(formed[side].dolphinLoan!.held.used).toBe(true)
      expect(dolphinIsBusy(formed, side, formed[side].dolphinLoan!.held)).toBe(true)
      expect(bodyPartFunctional(frames(formed)[side], 'left-hand')).toBe(true)
      expect(formed[side].health).toBe(37)
    })
    it(`cannot pay an insufficient donor reserve from a wealthy recipient for ${side}`, () => {
      const state = ready(side, spec())
      const loan = state[side].dolphinLoan!
      const insufficient = {
        ...state,
        [side]: {
          ...state[side],
          dolphinLoan: {
            ...loan,
            held: { ...loan.held, auraSupply: { ...loan.held.auraSupply!, amount: 8 } },
          },
        },
      }
      expect(command(insufficient, side, { action: 'gum-prosthesis', loan: true })).toBe(
        insufficient,
      )
    })
    it(`does not transform a Texture Surprise loan into rubber for ${side}`, () => {
      const state = ready(side, spec('hisoka:downSpecial', 'hisoka:downSpecial'))
      expect(command(state, side, { action: 'gum-prosthesis' })).toBe(state)
      expect(command(state, side, { action: 'gum-prosthesis', loan: true })).toBe(state)
      expect(command(state, side, { action: 'texture-target', target: 'gum-prostheses' })).toBe(
        state,
      )
    })
    it(`removes a book prosthesis when its page is left without healing the injury for ${side}`, () => {
      const formed = frames(command(ready(side, spec()), side, { action: 'gum-prosthesis' }))
      const closed = closeBook(formed, side)
      expect(closed[side].gumProstheses).toBeUndefined()
      expect(bodyPartFunctional(closed[side], 'right-lower-leg')).toBe(false)
      expect(closed[side].bodyDamage).toEqual(formed[side].bodyDamage)
      expect(closed[side].health).toBe(37)
    })
    it(`keeps a loan’s rubber when an unrelated book page is left for ${side}`, () => {
      const formed = frames(
        command(ready(side, spec('hisoka:downSpecial')), side, {
          action: 'gum-prosthesis',
          loan: true,
        }),
      )
      const closed = closeBook(formed, side)
      expect(closed[side].gumProstheses?.source).toBe('dolphin')
      expect(bodyPartFunctional(frames(closed)[side], 'right-lower-leg')).toBe(true)
    })
    it(`cannot form a second fresh application from the same loan after removal for ${side}`, () => {
      const formed = frames(
        command(ready(side, spec()), side, { action: 'gum-prosthesis', loan: true }),
      )
      expect(command(formed, side, { action: 'gum-prosthesis-release' })).toBe(formed)
      const removed = command(formed, side, { action: 'gum-prosthesis-release', loan: true })
      expect(removed[side].gumProstheses).toBeUndefined()
      expect(command(removed, side, { action: 'gum-prosthesis', loan: true })).toBe(removed)
      expect(bodyPartFunctional(removed[side], 'left-hand')).toBe(false)
    })
    it(`covers the book’s actual rubber with a separate Texture Surprise loan for ${side}`, () => {
      let state = frames(
        command(ready(side, spec('hisoka:neutralSpecial', 'hisoka:downSpecial')), side, {
          action: 'gum-prosthesis',
        }),
      )
      const id = state[side].gumProstheses!.id
      state = command(state, side, {
        action: 'texture-target',
        target: 'gum-prostheses',
        loan: true,
      })
      expect(state[side].textureTarget).toBe('gum-prostheses')
      state = frames(command(state, side, { action: 'dolphin-use' }))
      expect(state[side].textureSurprise).toMatchObject({
        surface: 'gum-prostheses',
        supportId: id,
        source: 'dolphin',
        theftId: 'prosthesis-loan',
      })
      expect(state[side].gumProstheses?.source).toBe('book')
      expect(state[side].health).toBe(37)
      const uncovered = frames(command(state, side, { action: 'texture-remove', loan: true }))
      expect(uncovered[side].textureSurprise).toBeUndefined()
      expect(uncovered[side].gumProstheses?.id).toBe(id)
      expect(bodyPartFunctional(uncovered[side], 'left-hand')).toBe(true)
    })
    it(`requires the real rubber surface for a book disguise and loses it when that rubber ends for ${side}`, () => {
      let state = frames(
        command(ready(side, spec('hisoka:downSpecial')), side, {
          action: 'gum-prosthesis',
          loan: true,
        }),
      )
      const id = state[side].gumProstheses!.id
      state = command(state, side, { action: 'texture-target', target: 'gum-prostheses' })
      state = frames(command(state, side, { action: 'copied-move', target: 'hisoka:downSpecial' }))
      expect(state[side].textureSurprise).toMatchObject({
        surface: 'gum-prostheses',
        source: 'book',
        supportId: id,
      })
      const ended = frames(dismissDolphinGum(state, side), 1)
      expect(ended[side].gumProstheses).toBeUndefined()
      expect(ended[side].textureSurprise).toBeUndefined()
      expect(ended[side].bodyDamage).toEqual(state[side].bodyDamage)
    })
    it(`hides the donor’s acquisition details from the enemy for ${side}`, () => {
      const formed = command(ready(side, spec()), side, { action: 'gum-prosthesis', loan: true })
      const other = side === 'player' ? 'opponent' : 'player'
      const view = privatePvpState(formed, other)
      expect(view.opponent.gumProstheses?.source).toBeUndefined()
      expect(view.opponent.gumProstheses?.theftId).toBeUndefined()
      expect(view.opponent.gumProsthesisGeneration).toBeUndefined()
      expect(privatePvpState(formed, side).player.gumProstheses?.theftId).toBe('prosthesis-loan')
    })
  }
})
