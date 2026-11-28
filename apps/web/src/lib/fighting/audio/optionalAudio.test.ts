import { describe, expect, it } from 'vitest'
import { CLASH_TRACKS, readTrackChoice } from './jukebox'
import { clashTrackUrl, stageMusicUrl } from './clashMusic'
import { commentaryLine } from './commentary'
import type { FightImpact } from '../types'
import { BEYOND_CURSE_CARRIERS } from '../victory/beyondCurseSelection'
import { VICTORY_FIGHTERS, VICTORY_DURATION, type VictoryFighter } from '../victory/catalogue'
import type { VictoryFrame } from '../victory/playback'
import { PHINKS_VICTORY_DURATION } from '../victory/phinksTiming'
import { victoryNarrationCue } from './victoryNarration'
import scenes from './victoryDescriptions.json'
import atlas from './descriptionAtlas.json'

describe('optional audio features', () => {
  it('restricts music selections to the shipped catalogue and supports auto and off', () => {
    expect(Object.keys(CLASH_TRACKS)).toHaveLength(6)
    expect(readTrackChoice('../../custom')).toBe('auto')
    expect(clashTrackUrl('auto', 'menu')).toBe('/audio/clash/menu.mp3')
    expect(stageMusicUrl('vip-casino')).toBe('/audio/clash/vip-casino.mp3')
    expect(stageMusicUrl('screening-room', 'banquet-hall')).toBe('/audio/clash/banquet-hall.mp3')
    expect(stageMusicUrl('banquet-hall', 'off')).toBeUndefined()
  })

  it('only comments on confirmed results, ranking a parry above an assist', () => {
    const impact = { punish: true, damage: 9, blocked: false } as FightImpact
    const assist = { kind: 'assist-entry' as const, x: 40 }
    expect(commentaryLine([{ kind: 'impact', x: 50, impact }])).toBe('comment-punish')
    expect(
      commentaryLine([{ kind: 'impact', x: 50, impact: { ...impact, blocked: true } }]),
    ).toBeUndefined()
    expect(
      commentaryLine([assist, { kind: 'impact', x: 50, impact: { ...impact, parried: true } }]),
    ).toBe('comment-parry')
  })

  it('covers the victory roster and each variant in both languages with timed, nonoverlapping cues', () => {
    const variants = [
      'chrollo-sun-moon',
      'kurapika-judgment',
      'kurapika-troupe',
      'rihan-physical',
      ...BEYOND_CURSE_CARRIERS.map((carrier) => `beyond-curse-${carrier}`),
    ]
    expect(Object.keys(scenes).sort()).toEqual([...VICTORY_FIGHTERS, ...variants].sort())
    for (const [name, shots] of Object.entries(scenes)) {
      for (const locale of ['fr', 'en'] as const) expectTrack(name, shots, locale)
    }
  })
})

function expectTrack(
  name: string,
  shots: readonly (readonly (number | string)[])[],
  locale: 'fr' | 'en',
) {
  let previousEnd = 0
  const duration =
    name === 'phinks' ? PHINKS_VICTORY_DURATION : name === 'chrollo-sun-moon' ? 3 : VICTORY_DURATION
  const spans: Record<string, number[]> = atlas.locales[locale]
  for (const [index, [frameNumber]] of shots.entries()) {
    const label = `description-${name}-${index}`
    const start = Number(frameNumber) / 60
    const frame: VictoryFrame = {
      token: name,
      active: true,
      elapsed: start,
      duration,
      pendingThrow: 0,
      fighter: name as VictoryFighter,
      winner: 'player',
      loser: 'opponent',
    }
    if (name === 'phinks')
      frame.phinksStrike = { turns: 2, ko: false, ken: false, ten: false, ren: false }
    if (!VICTORY_FIGHTERS.includes(frame.fighter)) frame.variant = name as VictoryFrame['variant']
    expect(victoryNarrationCue(frame, locale)?.label).toBe(label)
    expect(start, label).toBeGreaterThanOrEqual(previousEnd)
    previousEnd = start + spans[label][1] / atlas.sampleRate
    expect(previousEnd, label).toBeLessThanOrEqual(duration)
  }
}
