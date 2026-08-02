import { describe, expect, it } from 'vitest'
import {
  MAX_STRATEGY_SAVE_BYTES,
  createStrategySave,
  decodeStrategySave,
  encodeStrategySave,
} from './persistence'
import { strategyChecksum } from './replay/checksum'

describe('strategy persistence V2', () => {
  const save = createStrategySave({
    savedAt: '2026-08-02T00:00:00.000Z',
    seed: 'campaign-seed',
    baseEventId: 'event',
    selectedFactionId: 'prince-woble',
    turns: [
      { turn: 1, orders: [], diplomacy: [] },
      { turn: 2, orders: [], diplomacy: [] },
    ],
  })

  it('round-trips a checksummed save', () => {
    expect(decodeStrategySave(encodeStrategySave(save))).toEqual(save)
  })

  it('rejects corruption, unknown versions and oversized payloads', () => {
    expect(decodeStrategySave(encodeStrategySave({ ...save, seed: 'tampered' }))).toBeNull()
    expect(decodeStrategySave('{"version":99}')).toBeNull()
    expect(decodeStrategySave('x'.repeat(MAX_STRATEGY_SAVE_BYTES + 1))).toBeNull()
  })

  it('migrates a compatible V1 save explicitly', () => {
    const migrated = decodeStrategySave(
      JSON.stringify({
        version: 1,
        savedAt: '2026-08-02T00:00:00.000Z',
        baseEventId: 'event',
        selectedFactionId: 'prince-woble',
        turns: [{ orders: [], diplomacy: [] }],
      }),
    )
    expect(migrated).toMatchObject({ version: 2, seed: 'event:prince-woble' })
  })

  it('checksums objects independently from key enumeration order', () => {
    expect(strategyChecksum({ a: 1, b: 2 })).toBe(strategyChecksum({ b: 2, a: 1 }))
  })
})
