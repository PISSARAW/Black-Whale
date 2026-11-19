import { describe, expect, it } from 'vitest'
import {
  ghostwriterSetup,
  fortuneFrames,
  fortuneSheet,
  FORTUNE_SHEET_ID,
} from './ghostwriterTestSetup'
import { performArsenalCommand } from './retrospectiveArsenal'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { replaceDocument } from './paperDocumentActions'
import { privatePvpState } from './pvp/view'
import { advanceGhostwriter } from './ghostwriterAction'
import { nextRound } from './engine'
import { type FightState } from './types'

const command = { action: 'history-ghostwriter' as const, target: FORTUNE_SHEET_ID }
describe('the month, genuine personal data, portrait and writing support remain real conditions', () => {
  it('rejects false personal data even when the apparent and physical ink repeat it', () => {
    const state = ghostwriterSetup()
    const original = fortuneSheet(state)
    const wrong = { ...original.document!.fortuneSignature!, dateOfBirth: '2001-01-01' }
    const forged = replaceDocument(state, {
      ...original,
      document: {
        ...original.document!,
        fortuneSignature: wrong,
        text: `${wrong.name}\n${wrong.dateOfBirth}\n${wrong.bloodType}`,
      },
    })
    expect(performArsenalCommand(forged, 'player', command)).toBe(forged)
  })
  it('does not read an identity sheet through a physical crate', () => {
    const state = ghostwriterSetup()
    const covered: FightState = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: [
          ...state.battlefield!.entities,
          {
            id: 'cover',
            kind: 'crate',
            owner: 'neutral',
            x: 48,
            y: 0,
            present: true,
            material: 'real',
            health: 40,
            arena: { width: 2, height: 12 },
          },
        ],
      },
    }
    expect(performArsenalCommand(covered, 'player', command)).toBe(covered)
    const read = performArsenalCommand(covered, 'player', {
      action: 'document-read',
      target: FORTUNE_SHEET_ID,
    })
    expect(read).toBe(covered)
  })
  it('preserves a copied physical portrait without treating a copied autograph as a new original', () => {
    const base = ghostwriterSetup()
    const prepared: FightState = {
      ...base,
      player: {
        ...base.player,
        x: 48,
        chrolloBook: {
          pages: ['gallery-fake', 'lovely-ghostwriter'],
          page: 0,
          open: false,
          bookmark: 'gallery-fake',
        },
      },
    }
    let copied = copyHistoricalObject(prepared, 'player', 'scenario:fortune-portrait')
    const portrait = copied.battlefield!.entities.find((entry) => entry.copy)!
    expect(portrait.document?.fortunePortrait).toEqual(
      fortuneSheet(prepared).document?.fortuneSignature?.subject,
    )
    copied = fortuneFrames(copied, 19)
    copied = performArsenalCommand(copied, 'player', {
      action: 'document-drop',
      target: portrait.id,
    })
    const ready: FightState = {
      ...copied,
      player: {
        ...copied.player,
        arenaRecovery: 0,
        chrolloBook: { ...copied.player.chrolloBook!, open: true, bookmark: 'lovely-ghostwriter' },
      },
      battlefield: {
        ...copied.battlefield!,
        entities: copied.battlefield!.entities.map((entry) =>
          entry.fortunePerson || entry.id === 'scenario:fortune-portrait'
            ? { ...entry, present: false }
            : entry,
        ),
      },
    }
    expect(performArsenalCommand(ready, 'player', command).player.ghostwriterWriting).toBeDefined()
    const autograph = copyHistoricalObject(prepared, 'player', FORTUNE_SHEET_ID)
    expect(
      autograph.battlefield!.entities.find((entry) => entry.copy)?.document?.fortuneSignature,
    ).toBeUndefined()
  })
  it('ends the written weeks at the declared death week without killing anyone in the duel', () => {
    const base = ghostwriterSetup()
    const state = {
      ...base,
      fortuneMonths: base.fortuneMonths!.map((month) => ({
        ...month,
        deathWeek: 2,
        weeks: month.weeks.map((week) =>
          week.week === 2
            ? {
                ...week,
                quatrain:
                  'Une porte attend dans le noir.\nUn pli promet une dernière heure.\nNe suis pas ce nom dans le soir.\nUn autre chemin garde le cœur.',
              }
            : week,
        ),
      })),
    }
    const written = fortuneFrames(performArsenalCommand(state, 'player', command), 92)
    expect(fortuneSheet(written).document?.fortuneWritten?.weeks).toBe(2)
    expect(fortuneSheet(written).document?.text).not.toContain('Le messager revient')
    expect(written.battlefield!.entities.find((entry) => entry.fortunePerson)?.health).toBe(40)
  })
  it('keeps the known remote writing animation without inventing the enemy’s hidden future', () => {
    const state = performArsenalCommand(ghostwriterSetup('opponent'), 'opponent', command)
    const local = privatePvpState(state, 'player')
    expect(local.opponent.ghostwriterWriting?.verses).toBeUndefined()
    const next = advanceGhostwriter(local)
    expect(next.opponent.ghostwriterWriting?.frames).toBe(89)
    expect(next.opponent.ghostwriterWriting?.verses).toBeUndefined()
  })
  it('carries the same manuscript and participant through a new round', () => {
    const written = fortuneFrames(performArsenalCommand(ghostwriterSetup(), 'player', command), 92)
    const next = nextRound({ ...written, phase: 'finished', matchWinner: null })
    expect(fortuneSheet(next).document?.text).toBe(fortuneSheet(written).document?.text)
    expect(next.battlefield!.entities.find((entry) => entry.fortunePerson)).toBeDefined()
    expect(next.fortuneMonths).toEqual(written.fortuneMonths)
  })
})
