import { describe, expect, it } from 'vitest'
import { initialHuntState, huntReducer } from './state'
import { hatsuFlash, PARALLEL_FUTURE_TINT, presentHatsu } from './hatsuPresentation'

const game = (hatsu: 'bungee-gum' | 'parallel-future' | 'dowsing-chain' = 'bungee-gum') =>
  initialHuntState({
    playerAt: { position: [0, 0], spaceId: 'salon' },
    hunterAt: { position: [5, 0], spaceId: 'cuisine' },
    targetSpaceId: 'chambre',
    hatsu,
  })

describe('Hunt Hatsu presentation through TourScene', () => {
  it('projects live Bungee Gum placements as native gum traps', () => {
    const laid = huntReducer(game(), { type: 'LAY' })
    expect(presentHatsu(laid).world.gumTraps).toEqual([laid.player.spaceId])
  })

  it('raises and aims the native Dowsing Chain after a successful reading', () => {
    const ready = {
      ...game('dowsing-chain'),
      terrain: 'tserriednich' as const,
      traces: [
        {
          kind: 'footstep' as const,
          actor: 'hunter' as const,
          terrain: 'tserriednich' as const,
          spaceId: 'vestibule',
          position: [0, 5] as [number, number],
          createdAt: 0,
          strength: 1,
          falseTrail: false,
        },
      ],
    }
    const read = huntReducer(ready, { type: 'HATSU' })
    expect(presentHatsu(read).world).toMatchObject({
      holding: 'dowsing',
      dowsing: 'vestibule',
    })
  })

  it('tints and rewinds TourScene once when Parallel Future opens', () => {
    const ten = game('parallel-future')
    const zetsu = huntReducer(ten, { type: 'ZETSU' })
    const future = huntReducer(zetsu, { type: 'HATSU' })
    expect(presentHatsu(future).tint).toBe(PARALLEL_FUTURE_TINT)
    expect(hatsuFlash(zetsu, future)?.kind).toBe('rewind')
    expect(hatsuFlash(future, future)).toBeNull()
  })
})
