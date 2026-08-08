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

  it('keeps the volume 37 operational rooms separate', () => {
    expect(
      sharedCanonEvents(chapters, 'rihan', 'yushohi').some(({ chapter }) => chapter === 381),
    ).toBe(false)
    expect(
      sharedCanonEvents(chapters, 'prince-salesale', 'prince-benjamin').some(
        ({ chapter }) => chapter === 382,
      ),
    ).toBe(false)
    expect(sharedCanonEvents(chapters, 'prince-salesale', 'yushohi')).toContainEqual(
      expect.objectContaining({
        chapter: 382,
        locationId: 'tier-1-royal-residential-sector-room-1008',
      }),
    )
  })

  it('identifies the chapter 385 and 387 replay as the same canonical event', () => {
    const shot = sharedCanonEvents(chapters, 'prince-tserriednich', 'theta').filter(
      ({ eventId }) => eventId === 'day8-1935-theta-shot',
    )
    expect(shot.map(({ chapter }) => chapter)).toEqual([385, 387])
    expect(new Set(shot.map(({ storyDate }) => storyDate))).toEqual(
      new Set(['Day 8 · Sunday · shortly after 19:35']),
    )
  })

  it('does not turn portraits, orders or adjoining rooms into meetings', () => {
    expect(
      sharedCanonEvents(chapters, 'prince-camilla', 'sarahell').some(
        ({ chapter }) => chapter === 389,
      ),
    ).toBe(false)
    expect(
      sharedCanonEvents(chapters, 'queen-oito', 'kurapika').some(({ chapter }) => chapter === 388),
    ).toBe(false)
    expect(
      sharedCanonEvents(chapters, 'prince-zhanglei', 'hinrigh-biganduffno').some(
        ({ chapter }) => chapter === 390,
      ),
    ).toBe(false)
  })

  it('returns room and movement evidence for the volume 37 route changes', () => {
    expect(sharedCanonEvents(chapters, 'prince-zhanglei', 'onior-longbao')).toContainEqual(
      expect.objectContaining({
        chapter: 390,
        eventId: 'day10-zhanglei-visits-onior',
        locationId: 'tier-1-vvip-living-quarters',
        movement: 'Room 1003 → royal corridor → guarded VVIP corridor → Xi-Yu patriarch apartment',
      }),
    )
  })

  it('preserves the separate present-day and flashback events in volume 38', () => {
    expect(
      sharedCanonEvents(chapters, 'nobunaga-hazama', 'chrollo-lucilfer').some(
        ({ chapter }) => chapter === 395,
      ),
    ).toBe(false)
    expect(
      sharedCanonEvents(chapters, 'hinrigh-biganduffno', 'morena-prudo').some(
        ({ chapter }) => chapter >= 394 && chapter <= 400,
      ),
    ).toBe(false)
  })
})
