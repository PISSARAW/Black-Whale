import { describe, expect, it } from 'vitest'
import { observedBy, visibleInPerspective } from './perspective'

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

describe('what an observer is allowed to see', () => {
  const avatars = [{ id: 'avatar-body-a' }, { id: 'avatar-body-b' }]
  const bodyOf = (avatar: { id: string }) => avatar.id.replace(/^avatar-/, '')

  it('shows everything to the objective canon', () => {
    expect(observedBy(avatars, { observer: 'canon', projection: null }, bodyOf)).toEqual(avatars)
  })

  it('shows a character nobody until their projection has arrived', () => {
    expect(observedBy(avatars, { observer: 'kurapika', projection: null }, bodyOf)).toEqual([])
  })

  it('shows a character only the bodies they can see', () => {
    const projection = { visibleBodyIds: ['body-a'], knownFactCount: 0, beliefCount: 0 }
    expect(observedBy(avatars, { observer: 'kurapika', projection }, bodyOf)).toEqual([
      { id: 'avatar-body-a' },
    ])
  })
})
