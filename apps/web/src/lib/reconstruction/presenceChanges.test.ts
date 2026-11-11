import { describe, expect, it } from 'vitest'
import { diffPresences } from './presenceChanges'
import type { DisplayPresence } from './workspaceTypes'

function presence(entityId: string, locationId: string | null): DisplayPresence {
  return {
    entityId,
    locationId,
    locationLabel: locationId,
    precision: 'EXACT_ROOM',
    certainty: 'CONFIRMED',
    tierId: 'tier-1',
    name: entityId,
  }
}

describe('presence changes between two moments', () => {
  it('names arrivals, moves, the unchanged and departures', () => {
    const changes = diffPresences(
      [presence('stays', 'a'), presence('moves', 'a'), presence('leaves', 'a')],
      [presence('stays', 'a'), presence('moves', 'b'), presence('arrives', 'c')],
    )
    expect(Object.fromEntries(changes.map((change) => [change.entityId, change.change]))).toEqual({
      stays: 'unchanged',
      moves: 'moved',
      arrives: 'arrived',
      leaves: 'departed',
    })
    expect(changes.find((change) => change.entityId === 'moves')?.previousLocationLabel).toBe('a')
  })

  it('counts a change of precision as a move', () => {
    const vaguer = { ...presence('x', 'a'), precision: 'ZONE' as const }
    expect(diffPresences([presence('x', 'a')], [vaguer])[0]?.change).toBe('moved')
  })
})
