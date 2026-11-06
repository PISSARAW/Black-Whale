import { describe, expect, it } from 'vitest'
import { mapGroups } from './mapGroups'

describe('deck groups', () => {
  it('counts subdecks together and excludes departed presences', () => {
    expect(
      mapGroups([
        { tierId: 'tier-1-b', change: 'arrived' },
        { tierId: 'tier-2', change: 'moved' },
        { tierId: 'tier-1', change: 'unchanged' },
        { tierId: 'tier-3', change: 'departed' },
      ]),
    ).toEqual([
      { id: 'tier-1', number: 1, count: 2 },
      { id: 'tier-2', number: 2, count: 1 },
    ])
  })
  it('returns no groups when a map filter leaves no current presence', () => {
    expect(mapGroups([])).toEqual([])
    expect(mapGroups([{ tierId: 'tier-5', change: 'departed' }])).toEqual([])
  })
})
