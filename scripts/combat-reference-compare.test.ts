import { describe, expect, it } from 'vitest'
import { compareCombatReference } from './combat-reference-compare'

const reference = {
  version: 1,
  ruleset: 'combat',
  protocol: 'pvp',
  replayVersion: 1,
  seed: 123,
  premises: { infiniteHealth: false },
  catalog: [{ id: 'route', cost: 24 }],
  sourceFingerprint: 'source-a',
  rows: [{ id: 'route', digest: 'result-a' }],
}
describe('combat reference comparison', () => {
  it('accepts identical behavior and reports a separate source change', () => {
    expect(compareCombatReference(reference, structuredClone(reference)).pass).toBe(true)
    expect(
      compareCombatReference(reference, { ...reference, sourceFingerprint: 'source-b' }),
    ).toMatchObject({ pass: true, sourceChanged: true })
  })
  it('rejects changed results, additions and removals', () => {
    for (const rows of [
      [],
      [{ id: 'route', digest: 'result-b' }],
      [...reference.rows, { id: 'new', digest: 'x' }],
    ])
      expect(compareCombatReference(reference, { ...reference, rows }).pass).toBe(false)
  })
  it('rejects modified versions, seed, premises, catalog and duplicate identifiers', () => {
    for (const patch of [
      { version: 2 },
      { ruleset: 'other' },
      { protocol: 'other' },
      { replayVersion: 2 },
      { seed: 124 },
      { premises: { infiniteHealth: true } },
      { catalog: [] },
      { rows: [...reference.rows, ...reference.rows] },
    ])
      expect(compareCombatReference(reference, { ...reference, ...patch }).pass).toBe(false)
  })
})
