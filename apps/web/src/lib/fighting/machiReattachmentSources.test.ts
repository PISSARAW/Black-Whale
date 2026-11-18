import { describe, expect, it } from 'vitest'
import {
  stitchingSetup,
  stitchingBorrowerSetup,
  stitchingBookSetup,
  stitchingDolphinSetup,
  stitchingFrames,
  severedPart,
} from './machiReattachmentTestSetup'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { dolphinIsBusy } from './kurapikaDolphin'
import { equippedDolphin } from './dolphinBorrowing'
import { advanceMachiReattachment } from './machiReattachment'
import { privatePvpState } from './pvp/view'
import type { FightSide } from './types'

describe('a retained Nen Stitches application keeps the material and source conditions', () => {
  it.each<FightSide>(['player', 'opponent'])('uses one finite Dolphin operation for %s', (side) => {
    const state = stitchingDolphinSetup(side)
    const target = side === 'player' ? 'opponent' : 'player'
    const command = { action: 'machi-reattach' as const, target: severedPart(state).id }
    expect(
      arsenalOptions(state, side).some(
        (option) => option.command.action === 'machi-reattach' && option.ready,
      ),
    ).toBe(true)
    const started = performArsenalCommand(state, side, command)
    expect(started[side].machiReattachment?.origin).toMatchObject({
      source: 'dolphin',
      theftId: 'machi-suture-loan',
    })
    expect(started[side].aura).toBe(0)
    expect(equippedDolphin(started[side])).toMatchObject({
      used: true,
      auraSupply: { amount: 10, committed: 20 },
    })
    expect(dolphinIsBusy(started, side, equippedDolphin(started[side])!)).toBe(true)
    const finished = stitchingFrames(started, side, 92)
    expect(finished[target].bodyDamage?.parts).toEqual(['right-forearm'])
    expect(finished[target].health).toBe(state[target].health)
    expect(dolphinIsBusy(finished, side, equippedDolphin(started[side])!)).toBe(false)
    const second = {
      action: 'machi-reattach' as const,
      target: severedPart(finished, 'right-forearm').id,
    }
    expect(performArsenalCommand(finished, side, second)).toBe(finished)
    expect(privatePvpState(started, target).opponent.machiReattachment).toBeDefined()
    expect(privatePvpState(started, target).opponent.machiReattachment?.origin).toBeUndefined()
  })
  it.each<FightSide>(['player', 'opponent'])(
    'keeps an external borrower bound to its lender for %s',
    (side) => {
      const state = stitchingBorrowerSetup(side)
      const target = side === 'player' ? 'opponent' : 'player'
      const command = {
        action: 'machi-reattach' as const,
        target: severedPart(state).id,
        loan: true,
      }
      const started = performArsenalCommand(state, side, command)
      expect(started[side].machiReattachment).toBeDefined()
      expect(started[side].aura).toBe(0)
      expect(equippedDolphin(started[side])?.used).toBe(true)
      expect(stitchingFrames(started, side, 92)[target].bodyDamage?.parts).toEqual([
        'right-forearm',
      ])
      const lost = {
        ...started,
        [target]: {
          ...started[target],
          kurapika: { ...started[target].kurapika!, emperorTime: false },
        },
      }
      const stopped = advanceMachiReattachment(lost)
      expect(stopped[side].machiReattachment).toBeUndefined()
      expect(severedPart(stopped).present).toBe(true)
    },
  )
  it('does not substitute personal aura for insufficient stolen aura', () => {
    const base = stitchingDolphinSetup('player', 19)
    const state = { ...base, player: { ...base.player, aura: 100, auraExhausted: false } }
    expect(
      performArsenalCommand(state, 'player', {
        action: 'machi-reattach',
        target: severedPart(state).id,
      }),
    ).toBe(state)
  })
  it('uses a closed bookmarked page with two free hands and stops when the page is lost', () => {
    const state = stitchingBookSetup()
    const command = { action: 'machi-reattach' as const, target: severedPart(state).id }
    const open = {
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: true } },
    }
    expect(performArsenalCommand(open, 'player', command)).toBe(open)
    const started = performArsenalCommand(state, 'player', command)
    expect(stitchingFrames(started, 'player', 92).opponent.bodyDamage?.parts).toEqual([
      'right-forearm',
    ])
    const closed = {
      ...started,
      player: {
        ...started.player,
        chrolloBook: { ...started.player.chrolloBook!, bookmark: null },
      },
    }
    const stopped = advanceMachiReattachment(closed)
    expect(stopped.player.machiReattachment).toBeUndefined()
    expect(severedPart(stopped).present).toBe(true)
  })
  it('rejects another body’s limb even when its visible appearance matches', () => {
    const state = stitchingSetup()
    const wrong = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) => ({
          ...entry,
          detachedForearm: { ...entry.detachedForearm!, bodyKey: 'opponent:1' },
        })),
      },
    }
    expect(
      performArsenalCommand(wrong, 'player', {
        action: 'machi-reattach',
        target: severedPart(wrong).id,
      }),
    ).toBe(wrong)
  })
})
