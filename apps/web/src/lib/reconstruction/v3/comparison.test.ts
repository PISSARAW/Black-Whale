import { describe, expect, it } from 'vitest'
import { compareWorldBranches, type ComparableWorldState } from './comparison'

const canon: ComparableWorldState = {
  presences: { body: { locationId: 'room-a', precision: 'EXACT_ROOM', certainty: 'CONFIRMED' } },
  bodyStates: { body: 'ALIVE' },
  consciousnessByBody: { body: 'mind' },
  abilitiesByOwner: { character: ['chain-jail', 'dowsing-chain'] },
}

describe('canon and branch comparison', () => {
  it('reports changes on every world axis', () => {
    const branch: ComparableWorldState = {
      presences: {
        body: { locationId: 'room-b', precision: 'EXACT_ROOM', certainty: 'CONFIRMED' },
      },
      bodyStates: { body: 'INJURED' },
      consciousnessByBody: { body: null },
      abilitiesByOwner: { character: ['dowsing-chain'], other: ['borrowed'] },
    }
    expect(compareWorldBranches(canon, branch).map((difference) => difference.axis)).toEqual([
      'body-state',
      'consciousness',
      'location',
      'ability',
      'ability',
    ])
  })

  it('ignores object key order and ability order', () => {
    const equivalent: ComparableWorldState = {
      ...canon,
      presences: {
        body: { certainty: 'CONFIRMED', precision: 'EXACT_ROOM', locationId: 'room-a' },
      },
      abilitiesByOwner: { character: ['dowsing-chain', 'chain-jail'] },
    }
    expect(compareWorldBranches(canon, equivalent)).toEqual([])
  })

  it('distinguishes additions and removals', () => {
    const branch = { ...canon, bodyStates: { other: 'ALIVE' } }
    expect(
      compareWorldBranches(canon, branch).filter((item) => item.axis === 'body-state'),
    ).toMatchObject([
      { subjectId: 'body', status: 'removed' },
      { subjectId: 'other', status: 'added' },
    ])
  })
})
