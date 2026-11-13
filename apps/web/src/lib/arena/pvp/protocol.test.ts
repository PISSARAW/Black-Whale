import { describe, expect, it } from 'vitest'
import { parseNetworkAction } from './protocol'

describe('Arena PvP public command protocol', () => {
  it('accepts bounded combat commands', () => {
    expect(
      parseNetworkAction({ type: 'RYU', side: 'player', attackShare: 0.8, guard: 'head' }),
    ).toEqual({ type: 'RYU', side: 'player', attackShare: 0.8, guard: 'head' })
    expect(parseNetworkAction({ type: 'MOVE', side: 'opponent', vector: [-1, 0] })).toEqual({
      type: 'MOVE',
      side: 'opponent',
      vector: [-1, 0],
    })
  })

  it('rejects server ticks, teleports and unbounded values', () => {
    expect(parseNetworkAction({ type: 'TICK', dt: 60 })).toBeNull()
    expect(
      parseNetworkAction({ type: 'SYNC_POSITION', side: 'player', position: [0, 0] }),
    ).toBeNull()
    expect(parseNetworkAction({ type: 'RYU', side: 'player', attackShare: 4 })).toBeNull()
    expect(parseNetworkAction({ type: 'MOVE', side: 'player', vector: [50, 0] })).toBeNull()
  })
})
