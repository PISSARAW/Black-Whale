import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { createKurapika, dolphinActor } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { CHROLLO_TURN, type ChrolloPage } from './chrolloBook'
import { interruptUnavailableNen } from './nenActionRules'
import { privatePvpState } from './pvp/view'
import { applyAuraContext } from './nen'
import { createReplayRecorder } from './fightReplayRecorder'
import { executeReplayPacket } from './fightReplayCommands'
import { panelReplayCommand } from './fightReplayPanels'
import { decodeFightReplay } from './fightReplayCodec'
import { createReplayPlayer } from './fightReplayPlayer'
import { fightReplayHash } from './fightReplayHash'
import type { ReplayPacket } from './fightReplayTypes'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

function ready(side: FightSide, spec: { book: ChrolloPage; loan: string }): FightState {
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
      x: side === 'player' ? 44 : 49,
      aura: 100,
      chrolloBook: { pages: [spec.book, 'sun-and-moon'], page: 0, open: true, bookmark: null },
      dolphinLoan: {
        lender: { owner: lender, member: 0 },
        held: {
          source: 'hisoka',
          moveId: spec.loan,
          victim: lender,
          theftId: 'mixed-loan',
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
      x: side === 'player' ? 49 : 44,
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
function gumLoan(side: FightSide, book: ChrolloPage = 'hisoka:neutralSpecial'): FightState {
  const state = ready(side, { book, loan: 'hisoka:neutralSpecial' })
  return frames(command(state, side, { action: 'gum-anchor', target: 'floor-back', loan: true }))
}

describe('Hisoka gestures use the acquisition captured at their real start', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`keeps On and removes a borrowed disguise when its carrier swears the contract for ${side}`, () => {
      const initial = ready(side, { book: 'hisoka:neutralSpecial', loan: 'hisoka:downSpecial' })
      const masked = frames(command(initial, side, { action: 'dolphin-use' }))
      const sworn = {
        ...masked,
        [side]: applyAuraContext(
          {
            ...masked[side],
            on: { grudge: 100, sealFrames: 0 },
          },
          { ...EMPTY_INPUT, aura: true, hatsu: true },
        ),
      }
      expect(sworn[side].nen.on).toBe(true)
      const stopped = frames(sworn, 1)
      expect(stopped[side].textureSurprise).toBeUndefined()
      expect(stopped[side].nen.on).toBe(true)
    })
    it(`attaches from the book while a borrowed connection remains active for ${side}`, () => {
      const state = gumLoan(side)
      const donor = state[side].dolphinLoan!.held.auraSupply!.amount
      const cast = command(state, side, { action: 'copied-move', target: 'hisoka:neutralSpecial' })
      expect(cast[side].attack?.nenOrigin?.source).toBe('book')
      expect(dolphinActor(cast[side])).toBe(cast[side])
      const hit = frames(cast)
      expect(hit.gumNetwork!.links.map((link) => link.source)).toEqual(['dolphin', 'book'])
      expect(hit.gumNetwork!.links[1].target.kind).toBe('fighter')
      expect(hit[side].dolphinLoan!.held.auraSupply!.amount).toBe(donor)
      expect(hit[side].id).toBe('chrollo')
    })
    it(`executes the book’s recall gesture inside an ongoing borrowed callback for ${side}`, () => {
      let state = frames(
        command(gumLoan(side), side, { action: 'copied-move', target: 'hisoka:neutralSpecial' }),
      )
      const target = side === 'player' ? 'opponent' : 'player'
      state = { ...state, [target]: { ...state[target], x: side === 'player' ? 80 : 20 } }
      const before = state[target].x
      const cast = command(state, side, { action: 'copied-move', target: 'hisoka:forwardSpecial' })
      expect(cast[side].attack?.moveId).toBe('hisoka:forwardSpecial')
      expect(cast[side].attack?.nenOrigin?.source).toBe('book')
      const moved = frames(cast, 25)
      expect(Math.abs(moved[target].x - moved[side].x)).toBeLessThan(
        Math.abs(before - state[side].x),
      )
      expect(moved.gumNetwork!.links.some((link) => link.source === 'dolphin')).toBe(true)
    })
    it(`maintains a cloth disguise from the book independently of a Bungee Gum loan for ${side}`, () => {
      const state = gumLoan(side, 'hisoka:downSpecial')
      const cast = command(state, side, { action: 'copied-move', target: 'hisoka:downSpecial' })
      const masked = frames(cast)
      expect(masked[side].textureSurprise).toMatchObject({ surface: 'cloth', source: 'book' })
      expect(frames(masked, 100)[side].textureSurprise?.source).toBe('book')
      const closed = performAuraAttack({
        state: masked,
        side,
        kind: 'special',
        moveId: CHROLLO_TURN,
        auraCharged: false,
      })
      expect(closed[side].textureSurprise).toBeUndefined()
      expect(closed.gumNetwork!.links[0].source).toBe('dolphin')
    })
    it(`keeps a borrowed cloth disguise while a different book ability is used and its page is left for ${side}`, () => {
      const initial = ready(side, { book: 'hisoka:neutralSpecial', loan: 'hisoka:downSpecial' })
      const masked = frames(command(initial, side, { action: 'dolphin-use' }))
      expect(masked[side].textureSurprise).toMatchObject({
        source: 'dolphin',
        theftId: 'mixed-loan',
        surface: 'cloth',
      })
      const hit = frames(
        command(masked, side, { action: 'copied-move', target: 'hisoka:neutralSpecial' }),
      )
      expect(hit[side].textureSurprise?.source).toBe('dolphin')
      expect(hit.gumNetwork!.links[0].source).toBe('book')
      const closed = performAuraAttack({
        state: hit,
        side,
        kind: 'special',
        moveId: CHROLLO_TURN,
        auraCharged: false,
      })
      expect(closed[side].textureSurprise?.source).toBe('dolphin')
      expect(frames(closed)[side].textureSurprise?.source).toBe('dolphin')
    })
    it(`does not let borrowed Nen protect an interrupted book gesture for ${side}`, () => {
      const cast = command(gumLoan(side), side, {
        action: 'copied-move',
        target: 'hisoka:neutralSpecial',
      })
      const exhausted = {
        ...cast[side],
        aura: 0,
        auraExhausted: true,
        nen: { ...cast[side].nen, mode: 'zetsu' as const },
      }
      expect(dolphinActor(exhausted)).toBe(exhausted)
      expect(interruptUnavailableNen(exhausted).attack).toBeNull()
      const privateView = privatePvpState(cast, side === 'player' ? 'opponent' : 'player')
      expect(privateView.opponent.attack?.nenOrigin).toBeUndefined()
      expect(privatePvpState(cast, side).player.attack?.nenOrigin?.source).toBe('book')
    })
  }
  it('replays P2’s copied gesture alongside its existing loan with the same final state', () => {
    let state = gumLoan('opponent')
    const recorder = createReplayRecorder(state)!
    const cast = command(state, 'opponent', {
      action: 'copied-move',
      target: 'hisoka:neutralSpecial',
    })
    for (let frame = 0; frame < 50; frame++) {
      const packet: ReplayPacket = [1 / 60, 0, 0, frame ? [] : [panelReplayCommand(state, cast)]]
      const next = executeReplayPacket(state, packet)
      recorder.append(state, packet, next)
      state = next
    }
    expect(state.gumNetwork!.links.map((link) => link.source)).toEqual(['dolphin', 'book'])
    const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
    for (let frame = 0; frame < 100 && !replay.done; frame++) replay.advance(0.05, 2)
    expect(replay.error).toBe('')
    expect(replay.done).toBe(true)
    expect(fightReplayHash(replay.state)).toBe(fightReplayHash(state))
  })
})
