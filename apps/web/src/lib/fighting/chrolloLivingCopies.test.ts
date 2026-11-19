import { describe, expect, it } from 'vitest'
import { corpseSetup } from './illumiCorpseTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import { advanceHistoricalCopies } from './chrolloHistoricalObjects'
import { privatePvpState } from './pvp/view'
import type { PreparedEntityKind } from './preparationTypes'
import type { FightSide, FightState } from './types'

function setup(side: FightSide, kind: PreparedEntityKind): FightState {
  const base = corpseSetup(side, 'chrollo')
  return {
    ...base,
    [side]: {
      ...base[side],
      chrolloBook: {
        pages: ['gallery-fake', 'order-stamp'],
        page: 0,
        open: false,
        bookmark: 'gallery-fake',
      },
    },
    battlefield: {
      ...base.battlefield!,
      entities: base.battlefield!.entities.map((entry) =>
        entry.id === `${side}:hostage` ? { ...entry, kind } : entry,
      ),
    },
  }
}

describe('Gallery Fake copies living human material without copying captivity or Nen', () => {
  for (const side of ['player', 'opponent'] as const) {
    it.each<PreparedEntityKind>(['hostage', 'person', 'supporter', 'morena'])(
      `animates the inert %s copy for ${side}, never its living original`,
      (kind) => {
        const initial = setup(side, kind)
        const originalId = `${side}:hostage`
        const copied = mapFrames(
          performArsenalCommand(initial, side, { action: 'history-use', target: originalId }),
          19,
        )
        const state = mapFrames(
          performArsenalCommand(copied, side, {
            action: 'history-page',
            target: 'order-stamp',
          }),
          13,
        )
        const original = state.battlefield!.entities.find((entry) => entry.id === originalId)!
        const copy = state.battlefield!.entities.find((entry) => entry.copy)!
        expect(copy).toMatchObject({
          kind: 'puppet',
          material: 'nen',
          arena: { width: 2.2, height: 13 },
          copy: { originalKind: kind, originalId, headAttached: true },
        })
        expect(copy.captiveOf).toBeUndefined()
        expect(copy.feather).toBeUndefined()
        expect(copy.controller).toBeUndefined()
        expect(
          performArsenalCommand(state, side, {
            action: 'history-use',
            target: originalId,
          }),
        ).toBe(state)
        expect(
          arsenalOptions(state, side).find(
            (option) => option.labelEn === 'Order Stamp · Stamp a puppet',
          )?.ready,
        ).toBe(true)
        const command = { action: 'history-use' as const, target: copy.id }
        const marked = performArsenalCommand(state, side, command)
        const puppet = marked.battlefield!.entities.find((entry) => entry.id === copy.id)!
        expect(puppet.copy?.order).toBe('attack')
        expect(marked.battlefield!.entities.find((entry) => entry.id === originalId)).toEqual(
          original,
        )
        expect(
          advanceHistoricalCopies(marked).battlefield!.entities.find(
            (entry) => entry.id === copy.id,
          )!.x,
        ).not.toBe(copy.x)
        if (side === 'opponent') {
          const predicted = performArsenalCommand(privatePvpState(state, side), 'player', command)
          expect(predicted.battlefield).toEqual(privatePvpState(marked, side).battlefield)
        }
      },
    )
  }
})
