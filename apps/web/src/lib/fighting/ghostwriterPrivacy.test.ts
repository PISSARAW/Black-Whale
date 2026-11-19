import { describe, expect, it } from 'vitest'
import {
  ghostwriterSetup,
  fortuneFrames,
  fortuneSheet,
  FORTUNE_SHEET_ID,
} from './ghostwriterTestSetup'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { privatePvpState } from './pvp/view'
import { ghostwriterAi } from './ghostwriterAi'
import type { FightSide } from './types'

describe('an unwritten fortune is not leaked as combat information or automatic memory', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'predicts the writing start without disclosing the month for %s',
    (side) => {
      const state = ghostwriterSetup(side)
      const local = privatePvpState(state, side)
      expect(local.fortuneMonths).toBeUndefined()
      expect(
        arsenalOptions(local, 'player').find((option) =>
          option.labelEn.includes('Write the participant'),
        )?.ready,
      ).toBe(true)
      const command = { action: 'history-ghostwriter' as const, target: FORTUNE_SHEET_ID }
      const actual = performArsenalCommand(state, side, command)
      const predicted = performArsenalCommand(local, 'player', command)
      expect(predicted.player.ghostwriterWriting).toMatchObject({
        frames: 90,
        sheetId: FORTUNE_SHEET_ID,
      })
      expect(predicted.player.ghostwriterWriting?.verses).toBeUndefined()
      const view = privatePvpState(actual, side)
      expect(view.player.ghostwriterWriting?.verses).toBeUndefined()
      const written = fortuneFrames(actual, 92)
      const after = privatePvpState(written, side)
      expect(fortuneSheet(after).document?.text).toContain('Au seuil du quai')
      expect(after.player.documentReading).toBeUndefined()
    },
  )
  it('lets an AI operate the actual ready manuscript', () => {
    const state = ghostwriterSetup('opponent')
    expect(ghostwriterAi(state).opponent.ghostwriterWriting).toBeDefined()
    const far = { ...state, opponent: { ...state.opponent, x: 90 } }
    expect(ghostwriterAi(far)).toBe(far)
    const noContext = { ...state, fortuneMonths: [] }
    expect(ghostwriterAi(noContext)).toBe(noContext)
  })
  it('does not write a still-defined itinerary for a person already dead', () => {
    const state = ghostwriterSetup()
    const dead = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.fortunePerson ? { ...entry, health: 0 } : entry,
        ),
      },
    }
    expect(
      performArsenalCommand(dead, 'player', {
        action: 'history-ghostwriter',
        target: FORTUNE_SHEET_ID,
      }),
    ).toBe(dead)
  })
})
