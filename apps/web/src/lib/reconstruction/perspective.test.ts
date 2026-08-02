import { describe, expect, it } from 'vitest'
import { visibleInPerspective } from './perspective'

describe('reconstruction perspective projection', () => {
  const presences = [{ entityId: 'body-a' }, { entityId: 'body-b' }]

  it('keeps the canonical view intact', () => {
    expect(visibleInPerspective(presences, null)).toEqual(presences)
  })

  it('only reveals bodies visible to the observer', () => {
    expect(
      visibleInPerspective(presences, {
        visibleBodyIds: ['body-b'],
        knownFactCount: 0,
        beliefCount: 0,
      }),
    ).toEqual([{ entityId: 'body-b' }])
  })
})
