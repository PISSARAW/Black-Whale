import { describe, expect, it } from 'vitest'
import cast from '../../../../scripts/clash-voice-cast.json'
import { KAMEO_IDS } from '../kameos/catalogue'
import { FIGHTING_ROSTER } from '../roster'
import { FIGHTER_VOICE_ATLAS, FIGHTER_VOICE_RATE, type FighterVoiceLine } from './fighterVoice'
import { fighterSelectionLine } from './selectionVoice'

describe('Clash roster voice cast', () => {
  const roster = FIGHTING_ROSTER.map(({ id }) => id)

  it('writes a different selection line for every fighter in both languages', () => {
    for (const locale of ['fr', 'en'] as const) {
      const lines = roster.map((fighter) => fighterSelectionLine(fighter, locale))
      expect(lines.every((line) => line && line.length > 10)).toBe(true)
      expect(new Set(lines).size).toBe(roster.length)
    }
  })

  it('casts every playable fighter once, in waves of five with distinct source speakers', () => {
    expect(cast.map((wave) => Object.keys(wave).length)).toEqual(Array(8).fill(5))
    expect(cast.flatMap((wave) => Object.keys(wave))).toEqual(roster)
    for (const locale of [0, 1]) {
      const speakers = cast.flatMap((wave) =>
        Object.values(wave).map((role) => role.speaker[locale]),
      )
      expect(new Set(speakers).size).toBe(roster.length)
    }
  })

  it('ships all efforts, pain reactions and named Kameo calls in both languages', () => {
    expect(Object.keys(FIGHTER_VOICE_ATLAS).sort()).toEqual([...roster].sort())
    const cues: FighterVoiceLine[] = [
      'effort-0',
      'effort-1',
      'effort-2',
      'pain-0',
      'pain-1',
      'pain-2',
      ...KAMEO_IDS.map((id) => `call-${id}` as const),
    ]
    for (const fighter of roster) {
      for (const locale of ['fr', 'en'] as const) {
        const bank = FIGHTER_VOICE_ATLAS[fighter]?.[locale]
        expect(Object.keys(bank ?? {}).sort(), `${fighter} ${locale}`).toEqual([...cues].sort())
        let end = 0
        for (const cue of cues) {
          const [offset, length] = bank![cue]
          expect(offset - end).toBeGreaterThanOrEqual(960)
          expect(length / FIGHTER_VOICE_RATE).toBeGreaterThan(0.1)
          expect(length / FIGHTER_VOICE_RATE).toBeLessThan(1.6)
          end = offset + length
        }
      }
    }
  })
})
