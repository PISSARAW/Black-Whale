import { describe, expect, it } from 'vitest'
import { measureRun } from './metrics'
import { record, type TelemetryEvent } from './telemetry'

describe('hunt run metrics', () => {
  it('measures decisions instead of frames', () => {
    let log: TelemetryEvent[] = []
    log = record(log, 2, { actor: 'player', kind: 'wentZetsu' })
    log = record(log, 7, { actor: 'player', kind: 'usedHatsu', where: 'hall' })
    log = record(log, 10, { actor: 'player', kind: 'wentTen' })
    log = record(log, 11, { actor: 'player', kind: 'enteredRoom', where: 'hall' })
    log = record(log, 12, { actor: 'player', kind: 'enteredRoom', where: 'kitchen' })
    log = record(log, 13, { actor: 'player', kind: 'enteredRoom', where: 'hall' })
    log = record(log, 14, { actor: 'player', kind: 'laidEntrave', cost: 25 })
    log = record(log, 15, { actor: 'player', kind: 'tookEntraveBack', cost: -25 })

    expect(measureRun(log, 20, 'reached')).toMatchObject({
      schemaVersion: 1,
      duration: 20,
      outcome: 'reached',
      hatsuUses: 1,
      roomsVisited: 2,
      entravesLaid: 1,
      auraRecovered: 25,
      timeInZetsu: 8,
    })
  })

  it('counts Zetsu through the end of an unfinished interval', () => {
    const log = record([], 4, { actor: 'player', kind: 'wentZetsu' })
    expect(measureRun(log, 10, 'timeUp').timeInZetsu).toBe(6)
  })
})
