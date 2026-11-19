import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { dismissDolphinGum, dolphinIsBusy, withDolphinIdentity } from './kurapikaDolphin'
import { applyAuraContext } from './nen'
import { settleDolphinLoans } from './dolphinLoanFrame'
import { captureDolphinAura } from './dolphinAura'
import { createKurapika } from './kurapika'
import { advanceGumNetwork } from './bungeeMotion'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { gumSourceBusy } from './bungeeScoped'
import { privatePvpState } from './pvp/view'
import { CHROLLO_TURN, chrolloHasActivePage } from './chrolloBook'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(side: FightSide): FightState {
  const lender = side === 'player' ? 'opponent' : 'player'
  const state = beginFight(
    createFight(
      side === 'player' ? 'chrollo' : 'kurapika',
      side === 'opponent' ? 'chrollo' : 'kurapika',
      { mode: 'versus-local', formatId: 'knockout', environment: { stageId: 'heavens-arena' } },
    ),
  )
  return {
    ...state,
    [side]: {
      ...state[side],
      aura: 100,
      chrolloBook: { pages: ['hisoka', 'sun-and-moon'], page: 0, open: true, bookmark: null },
      dolphinLoan: {
        lender: { owner: lender, member: 0 },
        held: {
          source: 'hisoka',
          victim: lender,
          theftId: 'loan:first',
          moveId: 'hisoka:neutralSpecial',
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
      aura: 100,
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: side, member: 0 }],
      },
    },
  }
}
function command(state: FightState, side: FightSide, command: ArsenalCommand): FightState {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
function frames(state: FightState, count = 30): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function both(side: FightSide, targets = { book: 'floor-front', loan: 'floor-back' }): FightState {
  const book = frames(command(ready(side), side, { action: 'gum-anchor', target: targets.book }))
  expect(book.gumNetwork!.links[0].source).toBe('book')
  const loan = command(book, side, { action: 'gum-anchor', target: targets.loan, loan: true })
  expect(loan.gumNetwork!.pending[side]?.source).toBe('dolphin')
  const active = frames(loan)
  expect(active.gumNetwork!.links.map((link) => link.source)).toEqual(['book', 'dolphin'])
  return active
}

describe('Bungee Gum retains its actual Nen acquisition', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`keeps each ceiling connection’s maintenance on its own aura channel for ${side}`, () => {
      for (const source of ['book', 'dolphin'] as const) {
        let state = both(
          side,
          source === 'book'
            ? { book: 'ceiling', loan: 'floor-back' }
            : { book: 'floor-front', loan: 'ceiling' },
        )
        const link = state.gumNetwork!.links.find((entry) => entry.source === source)!
        state = command(state, side, { action: 'gum-select', target: String(link.id) })
        state = frames(
          command(state, side, { action: 'gum-propel', loan: source === 'dolphin' }),
          10,
        )
        const advanced = withDolphinIdentity(state, advanceGumNetwork, 'hisoka')
        const ownSpent = state[side].aura - advanced[side].aura
        const donorSpent =
          state[side].dolphinLoan!.held.auraSupply!.amount -
          advanced[side].dolphinLoan!.held.auraSupply!.amount
        expect(ownSpent).toBeCloseTo(source === 'book' ? 0.05 : 0)
        expect(donorSpent).toBeCloseTo(source === 'dolphin' ? 0.05 : 0)
      }
    })
    it(`does not change book tension or reserves when a borrowed callback also runs for ${side}`, () => {
      let state = both(side)
      state = command(state, side, {
        action: 'gum-select',
        target: String(state.gumNetwork!.links[0].id),
      })
      state = frames(command(state, side, { action: 'gum-propel' }), 8)
      const native = advanceGumNetwork(state)
      const borrowed = withDolphinIdentity(state, advanceGumNetwork, 'hisoka')
      expect(borrowed[side].x).toBeCloseTo(native[side].x)
      expect(borrowed[side].y).toBeCloseTo(native[side].y)
      expect(borrowed[side].aura).toBeCloseTo(native[side].aura)
      expect(borrowed[side].dolphinLoan!.held.auraSupply!.amount).toBeCloseTo(
        native[side].dolphinLoan!.held.auraSupply!.amount,
      )
    })
    it(`keeps On while ending the voluntary Nen connections for ${side}`, () => {
      const state = both(side)
      const sworn = {
        ...state,
        [side]: applyAuraContext(
          {
            ...state[side],
            on: { grudge: 100, sealFrames: 0 },
          },
          { ...EMPTY_INPUT, aura: true, hatsu: true },
        ),
      }
      expect(sworn[side].nen.on).toBe(true)
      const stopped = advanceGumNetwork(sworn)
      expect(stopped.gumNetwork!.links).toHaveLength(0)
      expect(stopped[side].nen.on).toBe(true)
    })
    it(`pays the two preparations from separate reserves and preserves their origins for ${side}`, () => {
      const state = both(side)
      expect(state[side].aura).toBeGreaterThan(87)
      expect(state[side].dolphinLoan!.held.auraSupply!.amount).toBe(68)
      expect(state.gumNetwork!.links[1].theftId).toBe('loan:first')
      expect(state[side].dolphinLoan!.held.used).toBe(true)
    })
    it(`ends only the real loan while keeping the book’s connections for ${side}`, () => {
      const state = both(side)
      const dismissed = dismissDolphinGum(state, side)
      expect(dismissed.gumNetwork!.links.map((link) => link.source)).toEqual(['book'])
      expect(dolphinIsBusy(dismissed, side, dismissed[side].dolphinLoan!.held)).toBe(false)
      const settled = settleDolphinLoans(dismissed)
      expect(settled[side].dolphinLoan!.held.returned).toBe(true)
      expect(settled.gumNetwork!.links[0].source).toBe('book')
    })
    it(`leaves the actual book page without destroying an ongoing loan for ${side}`, () => {
      const state = both(side)
      const closed = performAuraAttack({
        state,
        side,
        kind: 'special',
        moveId: CHROLLO_TURN,
        auraCharged: false,
      })
      expect(chrolloHasActivePage(closed[side], 'hisoka')).toBe(false)
      expect(closed.gumNetwork!.links.map((link) => link.source)).toEqual(['dolphin'])
      const maintained = frames(closed)
      expect(maintained.gumNetwork!.links.map((link) => link.source)).toEqual(['dolphin'])
    })
    it(`does not convert a pending book attachment into borrowed Nen when its page disappears for ${side}`, () => {
      const pending = command(ready(side), side, { action: 'gum-anchor', target: 'floor-front' })
      const lost = reconcileChrolloPages(
        pending,
        {
          ...pending,
          [side]: {
            ...pending[side],
            chrolloBook: {
              ...pending[side].chrolloBook!,
              open: false,
            },
          },
        },
        side,
      )
      expect(lost.gumNetwork!.pending[side]).toBeUndefined()
      expect(advanceGumNetwork(lost).gumNetwork!.links).toHaveLength(0)
    })
    it(`does not let a fresh donor identity maintain an old loan’s connection for ${side}`, () => {
      const state = both(side)
      const changed = {
        ...state,
        [side]: {
          ...state[side],
          dolphinLoan: {
            ...state[side].dolphinLoan!,
            held: { ...state[side].dolphinLoan!.held, theftId: 'loan:second' },
          },
        },
      }
      expect(advanceGumNetwork(changed).gumNetwork!.links.map((link) => link.source)).toEqual([
        'book',
      ])
    })
    it(`keeps private acquisition and donor identities out of the enemy view for ${side}`, () => {
      const state = both(side)
      const other = side === 'player' ? 'opponent' : 'player'
      const enemy = privatePvpState(state, other)
      expect(enemy.gumNetwork!.links).toHaveLength(2)
      expect(enemy.gumNetwork!.links.every((link) => !link.source && !link.theftId)).toBe(true)
      const own = privatePvpState(state, side)
      expect(own.gumNetwork!.links.map((link) => link.source)).toEqual(['book', 'dolphin'])
    })
    it(`rejects using donor aura to move or detach a book connection for ${side}`, () => {
      let state = both(side)
      state = command(state, side, {
        action: 'gum-select',
        target: String(state.gumNetwork!.links[0].id),
      })
      for (const action of ['gum-propel', 'gum-detach'] as const)
        expect(command(state, side, { action, loan: true })).toBe(state)
      expect(gumSourceBusy(state, side, { source: 'dolphin', theftId: 'loan:first' })).toBe(true)
    })
  }
})
