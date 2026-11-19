import { describe, expect, it } from 'vitest'
import {
  ghostwriterSetup,
  fortuneFrames,
  fortuneSheet,
  FORTUNE_SHEET_ID,
} from './ghostwriterTestSetup'
import { performArsenalCommand } from './retrospectiveArsenal'
import { expireHistoricalMatter } from './historicalMatterClock'
import { privatePvpState } from './pvp/view'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import type { FightState } from './types'

function copiedInk(): FightState {
  const state = ghostwriterSetup()
  const id = 'scenario:copied-writing-kit'
  return {
    ...state,
    player: {
      ...state.player,
      writingKit: { ...state.player.writingKit!, sourceId: id, copyId: id },
      chrolloBook: {
        pages: ['gallery-fake', 'lovely-ghostwriter'],
        page: 0,
        open: true,
        bookmark: 'lovely-ghostwriter',
      },
    },
    battlefield: {
      ...state.battlefield!,
      entities: [
        ...state.battlefield!.entities,
        {
          id,
          kind: 'crate',
          owner: 'player',
          material: 'nen',
          health: 40,
          present: false,
          x: 46,
          y: 0,
          copy: {
            owner: 'player',
            originalId: 'player:writing-kit',
            createdAt: state.frame,
            headAttached: true,
          },
        },
      ],
    },
  }
}
function writtenInk(): FightState {
  return fortuneFrames(
    performArsenalCommand(copiedInk(), 'player', {
      action: 'history-ghostwriter',
      target: FORTUNE_SHEET_ID,
    }),
    92,
  )
}
describe('a copied ink supply never becomes permanent ink through automatic writing', () => {
  it('removes the copied ink at 24 hours during hitstop while keeping the original handwritten identity', () => {
    const initial = copiedInk()
    const written = writtenInk()
    expect(fortuneSheet(written).document?.fortuneWritten?.weeks).toBe(4)
    expect(fortuneSheet(written).document?.fortuneInk?.copyId).toBe('scenario:copied-writing-kit')
    const expired = expireHistoricalMatter({ ...written, frame: GALLERY_FAKE_LIFETIME, hitstop: 5 })
    expect(fortuneSheet(expired).present).toBe(true)
    expect(fortuneSheet(expired).document?.text).toBe(fortuneSheet(initial).document?.text)
    expect(fortuneSheet(expired).document?.fortuneWritten).toBeUndefined()
    expect(fortuneSheet(expired).document?.fortuneSignature).toEqual(
      fortuneSheet(initial).document?.fortuneSignature,
    )
  })
  it('does not erase detached ink when only the original copied ink pot is broken', () => {
    const written = writtenInk()
    const broken = {
      ...written,
      battlefield: {
        ...written.battlefield!,
        entities: written.battlefield!.entities.map((entry) =>
          entry.id === 'scenario:copied-writing-kit' ? { ...entry, health: 0 } : entry,
        ),
      },
    }
    const remaining = expireHistoricalMatter(broken)
    expect(fortuneSheet(remaining).document?.text).toBe(fortuneSheet(written).document?.text)
    expect(fortuneSheet(remaining).document?.fortuneWritten?.weeks).toBe(4)
  })
  it('also removes copied ink when Gallery Fake ends, without leaking hidden old handwriting', () => {
    const written = writtenInk()
    expect(
      privatePvpState(written, 'opponent').battlefield!.entities.find(
        (entry) => entry.id === FORTUNE_SHEET_ID,
      )?.document?.fortuneInk?.originalText,
    ).toBeUndefined()
    const closed = {
      ...written,
      player: { ...written.player, chrolloBook: { ...written.player.chrolloBook!, open: false } },
    }
    const expired = expireHistoricalMatter(closed)
    expect(fortuneSheet(expired).document?.fortuneWritten).toBeUndefined()
    expect(fortuneSheet(expired).document?.text).toBe(fortuneSheet(copiedInk()).document?.text)
  })
})
