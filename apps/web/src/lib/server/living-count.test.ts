import { describe, expect, it } from 'vitest'
import { countLiving, type LivingCountCharacter } from './living-count'

const alive: LivingCountCharacter = {
  firstAppearanceChapterId: 'ch-340',
  shipLocation: { status: 'actif' },
}
const diesIn360: LivingCountCharacter = {
  firstAppearanceChapterId: 'ch-358',
  shipLocation: { status: 'decede' },
  mangaAppearances: [
    { chapter: 358, status: 'debut' },
    { chapter: 360, status: 'death' },
  ],
}

describe('countLiving', () => {
  it('splits the catalogue into alive, dead and unknown with no cap', () => {
    const unknown = { firstAppearanceChapterId: 'ch-350', shipLocation: { status: 'inconnu' } }
    expect(countLiving([alive, diesIn360, unknown])).toEqual({
      alive: 1,
      dead: 1,
      unknown: 1,
      total: 3,
    })
  })

  it('keeps a character alive until the reader reaches their death', () => {
    expect(countLiving([diesIn360], 359)).toMatchObject({ alive: 1, dead: 0 })
    expect(countLiving([diesIn360], 360)).toMatchObject({ alive: 0, dead: 1 })
  })

  it('leaves out characters the reader has not met yet', () => {
    expect(countLiving([alive, diesIn360], 350)).toEqual({
      alive: 1,
      dead: 0,
      unknown: 0,
      total: 1,
    })
  })

  it('ignores a death the character comes back from', () => {
    const hisoka: LivingCountCharacter = {
      firstAppearanceChapterId: 'ch-340',
      mangaAppearances: [
        { chapter: 356, status: 'death' },
        { chapter: 357, status: 'appears' },
      ],
    }
    expect(countLiving([hisoka])).toMatchObject({ alive: 1, dead: 0 })
  })

  it('dates a death by the first corpse when no death is drawn', () => {
    const woody: LivingCountCharacter = {
      firstAppearanceChapterId: 'ch-358',
      shipLocation: { status: 'mort' },
      mangaAppearances: [
        { chapter: 358, status: 'debut' },
        { chapter: 359, status: 'corpse' },
      ],
    }
    expect(countLiving([woody], 358)).toMatchObject({ dead: 0 })
    expect(countLiving([woody], 359)).toMatchObject({ dead: 1 })
  })

  it('reveals an undated death only to a reader with no cap', () => {
    const undated = { firstAppearanceChapterId: 'ch-363', shipLocation: { status: 'mort' } }
    expect(countLiving([undated], 420)).toMatchObject({ alive: 1, dead: 0 })
    expect(countLiving([undated])).toMatchObject({ alive: 0, dead: 1 })
  })
})
