import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { toggleEmperorTime } from './kurapikaActions'
import { gumObjectAnchors } from './gumObjectAnchors'
import { reconcileGumObjectAnchors } from './gumObjectAnchorFrames'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { finishPhysicalFrame } from './physicalFrameClocks'
import { EMPTY_INPUT, type FightState } from './types'

function advance(state: FightState, count = 20): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function attach(state: FightState, target = 'arena:crate:34'): FightState {
  return performArsenalCommand(state, 'player', { action: 'gum-anchor-attach', target })
}
function copied(): FightState {
  const base = beginFight(
    createFight('chrollo', 'theta', {
      mode: 'versus-local',
      environment: { arenaInteractions: true },
    }),
  )
  return {
    ...base,
    player: {
      ...base.player,
      x: 28.5,
      aura: 100,
      chrolloBook: { pages: ['hisoka:neutralSpecial'], page: 0, open: true, bookmark: null },
    },
    opponent: { ...base.opponent, x: 88 },
  }
}
function loaded(): FightState {
  const base = beginFight(
    createFight('kurapika', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { arenaInteractions: true },
    }),
  )
  let state: FightState = {
    ...base,
    player: { ...base.player, x: 28.5, facing: -1, aura: 100 },
    opponent: { ...base.opponent, x: 20, facing: 1, aura: 100 },
  }
  state = advance(syringe(state), 220)
  state = syringe(toggleEmperorTime(state, 'player'))
  expect(state.player.kurapika?.held).toMatchObject({ source: 'hisoka', loaded: true, used: false })
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

describe('object gum keeps the actual Hatsu’s provenance and material lifetime', () => {
  it('requires an active Bungee Gum page and stops when that page is left without a bookmark', () => {
    const state = advance(attach(copied()))
    expect(gumObjectAnchors(state.player)[0].source).toBe('book')
    const closed = performArsenalCommand(state, 'player', {
      action: 'history-page',
      target: 'sun-and-moon',
    })
    const reconciled = reconcileGumObjectAnchors(closed, 'player')
    expect(gumObjectAnchors(reconciled.player)).toHaveLength(0)
    expect(reconciled.battlefield!.entities[0].health).toBe(state.battlefield!.entities[0].health)
    const wrong = copied()
    const texture = {
      ...wrong,
      player: {
        ...wrong.player,
        chrolloBook: {
          pages: ['hisoka:downSpecial' as const],
          page: 0,
          open: true,
          bookmark: null,
        },
      },
    }
    expect(attach(texture)).toBe(texture)
  })
  it('spends only actual stolen aura for one adhesive application, maintains its controls, then returns the donor’s Hatsu', () => {
    const prepared = loaded()
    const amount = prepared.player.kurapika!.held!.auraSupply!.amount
    const used = attach(prepared)
    expect(used.player.aura).toBe(prepared.player.aura)
    expect(used.player.kurapika?.held?.auraSupply?.amount).toBe(amount - 12)
    expect(gumObjectAnchors(used.player)[0]).toMatchObject({
      source: 'dolphin',
      theftId: prepared.player.kurapika!.held!.theftId,
    })
    const maintained = advance(used)
    expect(maintained.player.kurapika?.held?.used).toBe(true)
    expect(maintained.player.kurapika?.held?.returned).not.toBe(true)
    expect(gumObjectAnchors(maintained.player)).toHaveLength(1)
    const moved = { ...maintained, player: { ...maintained.player, x: 60.5 } }
    expect(attach(moved, 'arena:crate:66')).toBe(moved)
    const ordered = performArsenalCommand(maintained, 'player', {
      action: 'gum-anchor-object',
      target: 'arena:crate:34',
    })
    expect(ordered.player.kurapika?.held?.used).toBe(true)
    const stopped = performArsenalCommand(ordered, 'player', {
      action: 'gum-anchor-release',
      target: 'arena:crate:34',
    })
    const returned = advance(stopped, 2)
    expect(returned.player.kurapika?.held).toBeNull()
    expect(returned.opponent.stolenChainAbility).toBeUndefined()
    expect(returned.player.kurapika?.emperorTime).toBe(true)
  })
  it('cannot keep a connection when its conjured physical support expires, including in hitstop', () => {
    const source = copied()
    const gallery = {
      ...source,
      player: {
        ...source.player,
        x: 34,
        chrolloBook: {
          pages: ['gallery-fake' as const],
          page: 0,
          open: false,
          bookmark: 'gallery-fake' as const,
        },
      },
    }
    const generated = copyHistoricalObject(gallery, 'player', 'arena:crate:34')
    const entry = generated.battlefield!.entities.find((item) => item.copy)!
    expect(entry).toBeDefined()
    const settled = advance(generated)
    const ready = {
      ...settled,
      player: {
        ...settled.player,
        x: entry.x - entry.arena!.width - 3,
        chrolloBook: {
          pages: ['gallery-fake' as const, 'hisoka:neutralSpecial' as const],
          page: 1,
          open: true,
          bookmark: 'gallery-fake' as const,
        },
      },
    }
    const state = attach(ready, entry.id)
    expect(gumObjectAnchors(state.player)).toHaveLength(1)
    const expired = finishPhysicalFrame({
      ...state,
      hitstop: 10,
      frame: entry.copy!.createdAt + GALLERY_FAKE_LIFETIME,
    })
    expect(gumObjectAnchors(expired.player)).toHaveLength(0)
  })
})
