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

  it('places declared Hatsu traces and mapped aura objects deterministically', () => {
    const input = {
      ship,
      vestiges: {},
      tierId: space.tierId,
      traces: [{ id: 'door-trace', locationId: space.id }],
      objects: [
        {
          id: 'glass',
          name: 'Glass',
          locationId: space.id,
          visibility: 'awakened' as const,
          kind: 'water-divination',
          approximate: true,
        },
      ],
    }
    const first = residueApparitions(input)
    const second = residueApparitions(input)
    expect(first.map((trace) => trace.at)).toEqual(second.map((trace) => trace.at))
    expect(first).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'aura-source:door-trace', hidden: true }),
        expect.objectContaining({ id: 'aura-source:glass', hidden: false }),
      ]),
    )
    expect(residueApparitions({ ...input, awakened: false })).toEqual([])
  })
})
