import { describe, expect, it } from 'vitest'
import { canSee } from './vision'
import type { Witness } from './state'

const witness: Witness = {
  id: 'guard',
  position: [0, 0],
  heading: 0,
  spaceId: 'room',
  sight: 10,
  social: false,
  usesEn: false,
  route: ['room'],
  routeIndex: 0,
  investigating: null,
  challenged: false,
  belief: { identity: 'unknown', certainty: 0, lastSpaceId: null, reported: false },
}

describe('infiltration vision', () => {
  it('sees inside its oriented field', () => {
    expect(canSee(witness, { position: [0, 5], spaceId: 'room' }, [])).toBe(true)
  })
  it('does not see behind itself', () => {
    expect(canSee(witness, { position: [0, -5], spaceId: 'room' }, [])).toBe(false)
  })
  it('does not see through a bulkhead', () => {
    const wall = { spaceId: 'room', start: [-2, 2], end: [2, 2] } as const
    expect(canSee(witness, { position: [0, 5], spaceId: 'room' }, [wall])).toBe(false)
  })
})
