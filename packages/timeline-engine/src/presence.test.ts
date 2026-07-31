import { describe, expect, it } from 'vitest'
import { latestPresencePerEntity } from './presence.js'

const at = (chapter: number, sequence: number, ordinal?: number) => ({
  chapter: { number: chapter },
  sequence,
  ...(ordinal === undefined ? {} : { ordinal }),
})

const presence = (entityId: string, locationId: string, fromEvent: ReturnType<typeof at>) => ({
  entityId,
  locationId,
  fromEvent,
})

describe('latestPresencePerEntity', () => {
  it('leaves one presence per entity untouched', () => {
    const rows = [
      presence('body-1', 'banquet-hall', at(359, 4)),
      presence('body-2', 'cell', at(360, 1)),
    ]

    expect(latestPresencePerEntity(rows)).toEqual(rows)
  })

  it('keeps the presence that opened last in reading order', () => {
    const older = presence('body-1', 'area-37564', at(366, 1))
    const newer = presence('body-1', 'banquet-hall', at(406, 1))

    expect(latestPresencePerEntity([older, newer])).toEqual([newer])
    expect(latestPresencePerEntity([newer, older])).toEqual([newer])
  })

  /**
   * The cutaway: drawn in ch. 380, happening late in the voyage. Reading order
   * would keep it; world order is what the map has to answer with, so the row
   * from the later chapter — earlier on the clock — is the one that goes.
   */
  it('orders by the in-world clock when both events carry an ordinal', () => {
    const cutaway = presence('body-1', 'tier-5-cabins', at(380, 0, 154))
    const laterChapter = presence('body-1', 'vip-casino', at(405, 1, 121))

    expect(latestPresencePerEntity([cutaway, laterChapter])).toEqual([cutaway])
  })

  it('keeps the first row read when two presences open at the same event', () => {
    const first = presence('body-1', 'warehouse', at(378, 2))
    const second = presence('body-1', 'hangar', at(378, 2))

    expect(latestPresencePerEntity([first, second])).toEqual([first])
  })

  it('preserves the order of the rows it keeps', () => {
    const rows = [
      presence('body-1', 'area-37564', at(366, 1)),
      presence('body-2', 'cell', at(360, 1)),
      presence('body-1', 'banquet-hall', at(406, 1)),
    ]

    expect(latestPresencePerEntity(rows)).toEqual([rows[1], rows[2]])
  })

  it('returns nothing for no rows', () => {
    expect(latestPresencePerEntity([])).toEqual([])
  })
})
