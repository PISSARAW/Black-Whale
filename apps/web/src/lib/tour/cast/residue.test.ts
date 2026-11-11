import { describe, expect, it } from 'vitest'
import { theShip } from '../blueprint'
import { residueApparitions } from './residue'

const ship = theShip()
const [space] = [...ship.spaces.values()]
const [other] = [...ship.spaces.values()].filter(
  (candidate) => candidate.tierId === space.tierId && candidate.id !== space.id,
)

describe('aura left where a technique forced a seam', () => {
  it('leaves one trace, hidden from all but Gyo, for a cut wall', () => {
    const traces = residueApparitions({
      ship,
      vestiges: { [space.id]: [{ type: 'wall_cut', metadata: { target: other.id } }] },
      tierId: space.tierId,
    })
    expect(traces).toHaveLength(1)
    expect(traces[0]).toMatchObject({ kind: 'residue', spaceId: space.id, hidden: true })
  })

  it('says nothing about damage aura does not leave', () => {
    const traces = residueApparitions({
      ship,
      vestiges: { [space.id]: [{ type: 'flooded' }] },
      tierId: space.tierId,
    })
    expect(traces).toEqual([])
  })

  it('builds nothing for a deck the visitor is not on', () => {
    const traces = residueApparitions({
      ship,
      vestiges: { [space.id]: [{ type: 'door_broken' }] },
      tierId: 'not-this-deck',
    })
    expect(traces).toEqual([])
  })
})
