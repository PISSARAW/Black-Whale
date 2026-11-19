import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { copyHistoricalObject, stampHistoricalPuppet } from './chrolloHistoricalObjects'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'
import type { ChrolloPage } from './chrolloBook'

function ready(page: ChrolloPage = 'gallery-fake', opponent: FighterId = 'hisoka'): FightState {
  const base = beginFight(
    createFight('chrollo', opponent, {
      mode: 'versus-local',
      environment: {
        preparation: { mode: 'scenario', resources: ['devices'], cohorts: [] },
      },
    }),
  )
  return {
    ...base,
    player: {
      ...base.player,
      x: 25,
      aura: 100,
      chrolloBook: { pages: [page], page: 0, open: false, bookmark: page },
    },
    opponent: { ...base.opponent, x: 30 },
  }
}
function advance(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function pick(state: FightState) {
  const next = performArsenalCommand(state, 'player', {
    action: 'device-pickup',
    target: 'player:device:camera',
  })
  expect(next).not.toBe(state)
  return next
}

describe('historical material gestures use actual hands and physical bodies', () => {
  it('can copy a moved original already held in the left hand when the right hand is free', () => {
    const base = ready()
    const open = {
      ...base,
      player: { ...base.player, chrolloBook: { ...base.player.chrolloBook!, open: true } },
    }
    const held = pick(open)
    const state = {
      ...held,
      player: { ...held.player, x: 70, chrolloBook: { ...held.player.chrolloBook!, open: false } },
    }
    const copied = copyHistoricalObject(state, 'player', 'player:device:camera')
    expect(copied.battlefield!.entities.filter((e) => e.copy)).toHaveLength(1)
    expect(copied.player.aura).toBe(state.player.aura - 20)
  })
  it('cannot open Skill Hunter around a device already held in the right hand', () => {
    const state = pick(ready())
    expect(
      performArsenalCommand(state, 'player', { action: 'history-page', target: 'convert-hands' }),
    ).toBe(state)
    const native = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'chrollo:backSpecial',
      auraCharged: false,
    })
    expect(native.player.chrolloBook?.open).toBe(false)
    expect(native.player.attack).toBeNull()
    const dropped = performArsenalCommand(state, 'player', {
      action: 'device-drop',
      target: 'player:device:camera',
    })
    const opened = performArsenalCommand(dropped, 'player', {
      action: 'history-page',
      target: 'convert-hands',
    })
    expect(opened.player.chrolloBook?.open).toBe(true)
  })
  it.each(['gallery-fake', 'fun-fun-cloth'] as const)(
    'requires both actual hands for %s',
    (page) => {
      const state = pick(ready(page))
      expect(
        performArsenalCommand(state, 'player', { action: 'history-use', target: 'opponent' }),
      ).toBe(state)
    },
  )
  it('does not give Convert Hands or Order Stamp an extra left hand beside the open book and a held object', () => {
    const base = ready('convert-hands')
    const state = pick({
      ...base,
      player: { ...base.player, chrolloBook: { ...base.player.chrolloBook!, open: true } },
    })
    expect(performArsenalCommand(state, 'player', { action: 'history-shape-left' })).toBe(state)
    let copied = advance(copyHistoricalObject(ready(), 'player', 'opponent'), 19)
    copied = {
      ...copied,
      player: {
        ...copied.player,
        chrolloBook: {
          pages: ['order-stamp', 'gallery-fake'],
          page: 0,
          open: true,
          bookmark: 'gallery-fake',
        },
      },
    }
    copied = pick(copied)
    const puppet = copied.battlefield!.entities.find((e) => e.copy)!
    expect(stampHistoricalPuppet(copied, 'player', puppet.id)).toBe(copied)
  })
  it('wakes Hanzo’s sleeping body when Gallery Fake actually touches it, without damaging it or copying the remote double', () => {
    const base = ready('gallery-fake', 'hanzo')
    let state = performAttack({ ...base, player: { ...base.player, x: 15 } }, 'opponent', 'special')
    state = advance(state, 24)
    const bodyX = state.opponent.hanzoProjection!.bodyX
    state = {
      ...state,
      player: { ...state.player, x: bodyX - 5 },
      opponent: { ...state.opponent, x: 80 },
    }
    const copied = copyHistoricalObject(state, 'player', 'opponent')
    expect(copied.opponent.hanzoProjection).toBeUndefined()
    expect(copied.opponent.x).toBe(bodyX)
    expect(copied.opponent.health).toBe(state.opponent.health)
    expect(copied.battlefield!.entities.find((e) => e.copy)?.copy?.appearance).toBe('hanzo')
  })
})
