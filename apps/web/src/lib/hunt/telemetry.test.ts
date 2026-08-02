import { describe, it, expect } from 'vitest'
import {
  beliefsIn,
  countOf,
  JOURNAL_LIMIT,
  movementsIn,
  record,
  spentBy,
  type TelemetryEvent,
} from './telemetry'

function journal(): TelemetryEvent[] {
  let log: TelemetryEvent[] = []
  log = record(log, 10, { actor: 'player', kind: 'sweptEn', cost: 15, where: 'salon' })
  log = record(log, 20, { actor: 'player', kind: 'laidEntrave', cost: 25, where: 'cuisine' })
  log = record(log, 25, { actor: 'hunter', kind: 'inspected', cost: 5, where: 'cuisine' })
  log = record(log, 30, { actor: 'hunter', kind: 'believed', where: 'salon' })
  log = record(log, 60, { actor: 'hunter', kind: 'lostTheTrail' })
  return log
}

describe('the journal', () => {
  it('extracts each actor room trajectory without frame noise', () => {
    let log = record([], 1, { actor: 'player', kind: 'enteredRoom', where: 'kitchen' })
    log = record(log, 2, { actor: 'player', kind: 'wentZetsu', where: 'kitchen' })
    log = record(log, 3, { actor: 'hunter', kind: 'enteredRoom', where: 'hall' })

    expect(movementsIn(log, 'player').map((event) => event.where)).toEqual(['kitchen'])
    expect(movementsIn(log, 'hunter').map((event) => event.where)).toEqual(['hall'])
  })
  it('keeps what was spent, by whom, when and where', () => {
    const log = journal()
    expect(log[0]).toEqual({ at: 10, actor: 'player', kind: 'sweptEn', cost: 15, where: 'salon' })
  })

  it('defaults the cost to nothing for events that are not purchases', () => {
    expect(journal()[4]).toEqual({ at: 60, actor: 'hunter', kind: 'lostTheTrail', cost: 0, where: null })
  })

  it('never mutates the log it was handed', () => {
    const log = journal()
    const before = log.length
    record(log, 70, { actor: 'player', kind: 'wentZetsu' })
    expect(log).toHaveLength(before)
  })

  it('adds up what each side spent, separately', () => {
    expect(spentBy(journal(), 'player')).toBe(40)
    expect(spentBy(journal(), 'hunter')).toBe(5)
  })

  it('counts a kind across both sides', () => {
    expect(countOf(journal(), 'sweptEn')).toBe(1)
    expect(countOf(journal(), 'duelOpened')).toBe(0)
  })

  it('pulls out the spine of the debrief: what was believed, and when it was lost', () => {
    expect(beliefsIn(journal()).map((event) => event.at)).toEqual([30, 60])
  })

  it('stores no prose, so both languages read the same record', () => {
    for (const event of journal()) {
      expect(Object.keys(event).sort()).toEqual(['actor', 'at', 'cost', 'kind', 'where'])
    }
  })
})

describe('the ceiling on it', () => {
  it('holds a whole game and then stops rather than dropping the opening', () => {
    let log: TelemetryEvent[] = []
    for (let count = 0; count < JOURNAL_LIMIT + 10; count += 1) {
      log = record(log, count, { actor: 'player', kind: 'sweptEn', cost: 1 })
    }
    expect(log).toHaveLength(JOURNAL_LIMIT)
    // The first minute — the preparation the step-4 question is about — survives.
    expect(log[0].at).toBe(0)
  })
})
