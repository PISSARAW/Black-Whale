import { describe, expect, it } from 'vitest'
import { readDataFile } from './data-files'
import { sharedCanonEvents, wereCoPresent, type ChapterWithScenes } from './co-presence'

const chapters = await readDataFile<ChapterWithScenes[]>('chapters/chapters.json')

describe('canon co-presence', () => {
  it('finds characters shown in the same atomic scene', () => {
    expect(wereCoPresent(chapters, 'chrollo-lucilfer', 'illumi')).toBe(true)
    expect(wereCoPresent(chapters, 'nobunaga-hazama', 'phinks-magcub')).toBe(true)
  })

  it('does not turn a discussed target into a physical participant', () => {
    const meetingsInVolumes3436 = sharedCanonEvents(chapters, 'hisoka', 'chrollo-lucilfer').filter(
      ({ chapter }) => chapter >= 351 && chapter <= 380,
    )
    expect(meetingsInVolumes3436).toEqual([])
  })

  it('does not merge simultaneous rooms in the chapter 380 cutaway', () => {
    const meetings = sharedCanonEvents(chapters, 'chrollo-lucilfer', 'nobunaga-hazama')
    expect(meetings.some((event) => event.chapter === 380)).toBe(false)
  })

  it('returns the room and time used as evidence', () => {
    expect(sharedCanonEvents(chapters, 'chrollo-lucilfer', 'shizuku-murasaki')).toContainEqual(
      expect.objectContaining({
        chapter: 380,
        storyDate: 'Day 4 · Wednesday · 10:00',
        locationId: 'tier-4-central-passage',
      }),
    )
  })

  it('records verified upper-deck encounters without merging adjacent scenes', () => {
    expect(sharedCanonEvents(chapters, 'prince-kacho', 'prince-fugetsu')).toContainEqual(
      expect.objectContaining({
        chapter: 377,
        locationId: 'tier-1-royal-residential-sector-room-1010',
      }),
    )
    expect(sharedCanonEvents(chapters, 'prince-fugetsu', 'illumi')).toContainEqual(
      expect.objectContaining({
        chapter: 380,
        locationId: 'tier-3-observation-deck',
      }),
    )
  })
})
