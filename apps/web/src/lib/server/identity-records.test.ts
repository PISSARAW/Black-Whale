import { describe, expect, it } from 'vitest'
import {
  buildBodyRecord,
  buildConsciousnessRecord,
  type BodyRow,
  type ConsciousnessRow,
} from './identity-records.js'

const event = (chapter: number, sequence: number) => ({
  id: `ev-${chapter}-${sequence}`,
  sequence,
  title: `ch${chapter} #${sequence}`,
  chapter: { number: chapter },
})

const bodyRow = (overrides: Partial<BodyRow> = {}): BodyRow => ({
  id: 'body-1',
  label: 'Kurapika Body',
  bodyType: 'ORIGINAL',
  firstVisibleEvent: event(358, 1),
  character: { id: 'char-1', slug: 'kurapika', canonicalName: 'Kurapika' },
  occupancies: [],
  states: [],
  presences: [],
  appearances: [],
  ...overrides,
})

describe('buildBodyRecord', () => {
  it('orders every kind of entry by chapter then sequence', () => {
    const record = buildBodyRecord(
      bodyRow({
        presences: [
          {
            id: 'p-late',
            fromEvent: event(365, 1),
            untilEvent: null,
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
            location: { id: 'loc-1', name: 'Room 1014' },
          },
        ],
        states: [{ id: 's-early', fromEvent: event(358, 2), untilEvent: null, state: 'ALIVE' }],
        appearances: [
          { id: 'a-mid', fromEvent: event(358, 9), untilEvent: null, cause: 'NATURAL' },
        ],
      }),
      null,
    )

    expect(record?.entries.map((entry) => entry.id)).toEqual(['s-early', 'a-mid', 'p-late'])
  })

  it('links an occupancy to the consciousness page and lists distinct occupants once', () => {
    const occupancy = (id: string, chapter: number) => ({
      id,
      fromEvent: event(chapter, 1),
      untilEvent: null,
      occupancyType: 'ORIGINAL',
      certainty: 'CONFIRMED',
      consciousness: { id: 'mind-1', label: 'Kurapika Consciousness' },
    })

    const record = buildBodyRecord(
      bodyRow({ occupancies: [occupancy('o-1', 358), occupancy('o-2', 360)] }),
      null,
    )

    expect(record?.entries[0].link).toEqual({
      id: 'mind-1',
      label: 'Kurapika Consciousness',
      href: '/consciousness/mind-1',
    })
    expect(record?.occupants).toHaveLength(1)
  })

  it('hides a body whose first appearance is past the reader’s cap', () => {
    expect(buildBodyRecord(bodyRow({ firstVisibleEvent: event(400, 1) }), 380)).toBeNull()
  })

  it('drops an entry that opens past the cap', () => {
    const record = buildBodyRecord(
      bodyRow({
        states: [{ id: 's-future', fromEvent: event(400, 1), untilEvent: null, state: 'DEAD' }],
      }),
      380,
    )

    expect(record?.entries).toEqual([])
  })

  it('reports an interval whose end is past the cap as still open', () => {
    const record = buildBodyRecord(
      bodyRow({
        states: [{ id: 's', fromEvent: event(358, 1), untilEvent: event(400, 1), state: 'ALIVE' }],
      }),
      380,
    )

    // Saying the state ended would leak the chapter that ends it.
    expect(record?.entries[0].until).toBeNull()
  })
})

const consciousnessRow = (overrides: Partial<ConsciousnessRow> = {}): ConsciousnessRow => ({
  id: 'mind-1',
  label: 'Kurapika Consciousness',
  consciousnessType: 'ORIGINAL',
  firstVisibleEvent: event(340, 1),
  character: { id: 'char-1', slug: 'kurapika', canonicalName: 'Kurapika' },
  occupancies: [],
  states: [],
  ...overrides,
})

describe('buildConsciousnessRecord', () => {
  it('links each occupancy to the body it occupies', () => {
    const record = buildConsciousnessRecord(
      consciousnessRow({
        occupancies: [
          {
            id: 'o-1',
            fromEvent: event(340, 1),
            untilEvent: null,
            occupancyType: 'TRANSFERRED',
            certainty: 'PROBABLE',
            body: { id: 'body-2', label: 'Woble Body' },
          },
        ],
        states: [{ id: 'st-1', fromEvent: event(341, 1), untilEvent: null, state: 'ACTIVE' }],
      }),
      null,
    )

    expect(record?.entries.map((entry) => entry.kind)).toEqual(['OCCUPANCY', 'CONSCIOUSNESS_STATE'])
    expect(record?.bodies).toEqual([{ id: 'body-2', label: 'Woble Body', href: '/bodies/body-2' }])
  })

  it('keeps the origin character as a catalogue link', () => {
    const record = buildConsciousnessRecord(consciousnessRow(), null)

    expect(record?.originCharacter).toEqual({
      id: 'char-1',
      label: 'Kurapika',
      href: '/characters/kurapika',
    })
  })
})
