import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { CHROLLO_TURN, type ChrolloPage } from './chrolloBook'
import { advanceGumArsenal } from './hisokaArsenal'
import { exposedBlinkyWounds } from './blinky'
import { dismissDolphinGum, dolphinIsBusy } from './kurapikaDolphin'
import { privatePvpState } from './pvp/view'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(side: FightSide, page: ChrolloPage = 'hisoka:neutralSpecial'): FightState {
  const lender = side === 'player' ? 'opponent' : 'player'
  const state = beginFight(
    createFight(
      side === 'player' ? 'chrollo' : 'kurapika',
      side === 'opponent' ? 'chrollo' : 'kurapika',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...state,
    [side]: {
      ...state[side],
      x: side === 'player' ? 44 : 56,
      aura: 100,
      openWounds: 3,
      chrolloBook: { pages: [page, 'sun-and-moon'], page: 0, open: true, bookmark: null },
      dolphinLoan: {
        lender: { owner: lender, member: 0 },
        held: {
          source: 'hisoka',
          moveId: 'hisoka:neutralSpecial',
          victim: lender,
          theftId: 'support-loan',
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
      x: side === 'player' ? 56 : 44,
      aura: 100,
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
function loanAnchor(side: FightSide, page?: ChrolloPage): FightState {
  return frames(
    command(ready(side, page), side, { action: 'gum-anchor', target: 'floor-back', loan: true }),
  )
}

function fireBullet(state: FightState, side: FightSide): FightState {
  let emitted = performAttack(beginFight(createFight('theta', 'hisoka')), 'player', 'ranged')
  for (let frame = 0; frame < 30 && !emitted.projectiles.length; frame++)
    emitted = frames(emitted, 1)
  const shot = emitted.projectiles[0]!
  expect(shot.matter).toBe('object')
  return {
    ...state,
    projectiles: [
      {
        ...shot,
        id: state.nextProjectileId,
        owner: side,
        x: state[side].x,
        velocityX: Math.abs(shot.velocityX) * state[side].facing,
      },
    ],
    nextProjectileId: state.nextProjectileId + 1,
  }
}

describe('Bungee Gum support keeps its acquisition and its physical object', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`does not borrow a donor’s Nen for a book wound seal for ${side}`, () => {
      const state = loanAnchor(side)
      const donor = state[side].dolphinLoan!.held.auraSupply!.amount
      const sealed = command(state, side, { action: 'gum-seal' })
      expect(sealed[side].gumWoundOrigin?.source).toBe('book')
      expect(sealed[side].aura).toBe(state[side].aura - 10)
      expect(sealed[side].dolphinLoan!.held.auraSupply!.amount).toBe(donor)
      const closed = closeBook(frames(sealed), side)
      expect(exposedBlinkyWounds(closed[side])).toBe(3)
      expect(advanceGumArsenal(closed)[side].gumWoundSeals).toBeUndefined()
      expect(closed.gumNetwork!.links[0].source).toBe('dolphin')
    })
    it(`uses donor aura for borrowed seals despite an empty personal reserve for ${side}`, () => {
      const state = ready(side)
      const empty = { ...state, [side]: { ...state[side], aura: 0, auraExhausted: true } }
      const sealed = command(empty, side, { action: 'gum-seal', loan: true })
      expect(sealed[side].gumWoundOrigin).toEqual({ source: 'dolphin', theftId: 'support-loan' })
      expect(sealed[side].aura).toBe(0)
      expect(sealed[side].dolphinLoan!.held.auraSupply!.amount).toBe(70)
      expect(exposedBlinkyWounds(sealed[side])).toBe(0)
      expect(exposedBlinkyWounds(advanceGumArsenal(sealed)[side])).toBe(0)
    })
    it(`keeps borrowed seals when the book page is left for ${side}`, () => {
      const sealed = command(ready(side), side, { action: 'gum-seal', loan: true })
      const closed = closeBook(frames(sealed), side)
      expect(closed[side].gumWoundOrigin?.source).toBe('dolphin')
      expect(exposedBlinkyWounds(closed[side])).toBe(0)
      expect(exposedBlinkyWounds(frames(closed)[side])).toBe(0)
    })
    it(`cannot maintain an old seal with a different theft for ${side}`, () => {
      const state = command(ready(side), side, { action: 'gum-seal', loan: true })
      const changed = {
        ...state,
        [side]: {
          ...state[side],
          dolphinLoan: {
            ...state[side].dolphinLoan!,
            held: { ...state[side].dolphinLoan!.held, theftId: 'different' },
          },
        },
      }
      expect(exposedBlinkyWounds(changed[side])).toBe(3)
      expect(advanceGumArsenal(changed)[side].gumWoundSeals).toBeUndefined()
    })
    it(`stops borrowed support when its actual lender can no longer maintain Dolphin for ${side}`, () => {
      const other = side === 'player' ? 'opponent' : 'player'
      const sealed = command(ready(side), side, { action: 'gum-seal', loan: true })
      const stopped = advanceGumArsenal({ ...sealed, [other]: { ...sealed[other], health: 0 } })
      expect(stopped[side].gumWoundSeals).toBeUndefined()
      expect(exposedBlinkyWounds(stopped[side])).toBe(3)
      expect(stopped[side].health).toBe(sealed[side].health)
    })
    it(`ends the loan without removing the book’s seals or cloth for ${side}`, () => {
      const base = loanAnchor(side)
      const bookmarked = {
        ...base,
        [side]: {
          ...base[side],
          chrolloBook: {
            ...base[side].chrolloBook!,
            pages: ['hisoka:neutralSpecial', 'hisoka:downSpecial'] as ChrolloPage[],
            bookmark: 'hisoka:downSpecial' as const,
          },
        },
      }
      const sealed = frames(command(bookmarked, side, { action: 'gum-seal' }))
      const state = frames(
        command(sealed, side, {
          action: 'copied-move',
          target: 'hisoka:downSpecial',
        }),
      )
      expect(state[side].textureSurprise?.source).toBe('book')
      const ended = command(state, side, { action: 'dolphin-use' })
      expect(ended[side].gumWoundSeals).toBe(3)
      expect(ended[side].textureSurprise?.source).toBe('book')
      expect(dolphinIsBusy(ended, side, state[side].dolphinLoan!.held)).toBe(false)
      expect(ended[side].dolphinLoan).toBeUndefined()
      const lender = side === 'player' ? 'opponent' : 'player'
      expect(ended[lender].kurapika?.dolphinLoans).toBeUndefined()
    })
    it(`cannot use donor aura to return an object caught with the book for ${side}`, () => {
      const other = side === 'player' ? 'opponent' : 'player'
      const prepared = command(loanAnchor(side), side, { action: 'gum-catch' })
      const caught = frames(fireBullet(prepared, other), 50)
      expect(caught[side].gumCatch?.source).toBe('book')
      expect(caught[side].gumCatch?.projectile?.matter).toBe('object')
      expect(command(caught, side, { action: 'gum-return', loan: true })).toBe(caught)
      const closed = advanceGumArsenal(closeBook(caught, side))
      expect(closed[side].gumCatch?.projectile).toBe(caught[side].gumCatch?.projectile)
      expect(closed[side].gumCatch?.released).toBe(true)
      expect(closed.gumNetwork!.links[0].source).toBe('dolphin')
    })
    it(`does not grant native Bungee Gum from an ambient loan for ${side}`, () => {
      const state = loanAnchor(side, 'hisoka:downSpecial')
      expect(command(state, side, { action: 'gum-seal' })).toBe(state)
      expect(command(state, side, { action: 'gum-catch' })).toBe(state)
    })
    it(`preserves the real intercepted object when borrowed rubber is ended for ${side}`, () => {
      const other = side === 'player' ? 'opponent' : 'player'
      let state = command(ready(side), side, { action: 'gum-catch', loan: true })
      state = frames(fireBullet(state, other), 50)
      expect(state[side].gumCatch?.projectile?.matter).toBe('object')
      expect(state[side].gumCatch?.source).toBe('dolphin')
      const shot = state[side].gumCatch!.projectile
      const ended = dismissDolphinGum(state, side)
      expect(ended[side].gumCatch?.projectile).toBe(shot)
      expect(ended[side].gumCatch?.released).toBe(true)
      expect(ended.projectiles).toHaveLength(0)
      expect(dolphinIsBusy(ended, side, ended[side].dolphinLoan!.held)).toBe(false)
    })
    it(`hides acquisition and donor identity in enemy views for ${side}`, () => {
      const sealed = command(ready(side), side, { action: 'gum-seal', loan: true })
      const caught = command(ready(side), side, { action: 'gum-catch', loan: true })
      const other = side === 'player' ? 'opponent' : 'player'
      expect(privatePvpState(sealed, other).opponent.gumWoundOrigin).toEqual({})
      expect(privatePvpState(caught, other).opponent.gumCatch?.theftId).toBeUndefined()
      expect(privatePvpState(sealed, side).player.gumWoundOrigin?.theftId).toBe('support-loan')
    })
  }
})
