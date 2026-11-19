import { describe, expect, it } from 'vitest'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import {
  fortuneFrames,
  fortuneSheet,
  ghostwriterSetup,
  FORTUNE_SHEET_ID,
} from './ghostwriterTestSetup'
import { physicalBodyKey } from './fightBodyIdentity'
import { advanceGhostwriter } from './ghostwriterAction'
import type { FightSide, FightState } from './types'

const command = { action: 'history-ghostwriter' as const, target: FORTUNE_SHEET_ID }
describe('Lovely Ghostwriter writes a defined scenario month on the actual handwritten identity sheet', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'writes four quatrains for %s without reading the fortune into memory',
    (side) => {
      const state = ghostwriterSetup(side)
      expect(state[side].writingKit).toBeDefined()
      expect(
        arsenalOptions(state, side).find((option) =>
          option.labelEn.includes('Write the participant'),
        )?.ready,
      ).toBe(true)
      const working = performArsenalCommand(state, side, command)
      expect(working[side].ghostwriterWriting?.frames).toBe(90)
      expect(working[side].aura).toBe(88)
      expect(fortuneSheet(fortuneFrames(working, 45)).document?.text.length).toBeGreaterThan(
        fortuneSheet(state).document!.text.length,
      )
      const written = fortuneFrames(working, 92)
      expect(written[side].ghostwriterWriting).toBeUndefined()
      expect(fortuneSheet(written).document?.fortuneWritten).toMatchObject({
        weeks: 4,
        writerBodyKey: physicalBodyKey(state, side),
      })
      expect(fortuneSheet(written).document!.text).toContain('Au seuil du quai')
      expect(fortuneSheet(written).document!.text).toContain('Le mois s’achève')
      expect(written[side].documentReading).toBeUndefined()
      expect(written.player.health).toBe(state.player.health)
      expect(written.opponent.health).toBe(state.opponent.health)
      expect(written.score).toEqual(state.score)
      expect(performArsenalCommand(written, side, command)).toBe(written)
    },
  )
  it('rejects missing monthly context, writing materials, sight and the caster’s own future', () => {
    const state = ghostwriterSetup()
    const self = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === FORTUNE_SHEET_ID
            ? {
                ...entry,
                document: {
                  ...entry.document!,
                  fortuneSignature: {
                    ...entry.document!.fortuneSignature!,
                    subject: {
                      kind: 'fighter' as const,
                      bodyKey: physicalBodyKey(state, 'player'),
                    },
                  },
                },
              }
            : entry,
        ),
      },
    }
    const cases: FightState[] = [
      { ...state, fortuneMonths: [] },
      { ...state, player: { ...state.player, writingKit: undefined } },
      {
        ...state,
        player: { ...state.player, writingKit: { ...state.player.writingKit!, ink: false } },
      },
      {
        ...state,
        player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 1 } },
      },
      self,
    ]
    for (const blocked of cases)
      expect(performArsenalCommand(blocked, 'player', command)).toBe(blocked)
  })
  it('requires the same genuine handwriting, not a new paper containing copied identity text', () => {
    const state = ghostwriterSetup()
    const forged = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === FORTUNE_SHEET_ID
            ? {
                ...entry,
                document: {
                  ...entry.document!,
                  fortuneSignature: {
                    ...entry.document!.fortuneSignature!,
                    sheetId: 'another-sheet',
                  },
                },
              }
            : entry,
        ),
      },
    }
    expect(performArsenalCommand(forged, 'player', command)).toBe(forged)
    const copy = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === FORTUNE_SHEET_ID ? { ...entry, material: 'nen' as const } : entry,
        ),
      },
    }
    expect(performArsenalCommand(copy, 'player', command)).toBe(copy)
  })
  it('uses the visible physical portrait when the participant is absent, and refuses when both are absent', () => {
    const state = ghostwriterSetup()
    const absent = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.fortunePerson ? { ...entry, present: false } : entry,
        ),
      },
    }
    expect(performArsenalCommand(absent, 'player', command).player.ghostwriterWriting).toBeDefined()
    const noPhoto = {
      ...absent,
      battlefield: {
        ...absent.battlefield!,
        entities: absent.battlefield!.entities.filter((entry) => !entry.document?.fortunePortrait),
      },
    }
    expect(performArsenalCommand(noPhoto, 'player', command)).toBe(noPhoto)
  })
  it('interrupts automatic writing when the book channel is lost, retaining actual unfinished ink', () => {
    const state = fortuneFrames(performArsenalCommand(ghostwriterSetup(), 'player', command), 20)
    const lost = {
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, bookmark: null } },
    }
    const stopped = advanceGhostwriter(lost)
    expect(stopped.player.ghostwriterWriting).toBeUndefined()
    expect(fortuneSheet(stopped).document?.fortuneWritten).toBeUndefined()
    expect(fortuneSheet(stopped).document?.text).toBe(fortuneSheet(state).document?.text)
  })
})
