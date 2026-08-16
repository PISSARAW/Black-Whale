import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'

const ship = buildShip()

const roomPrefix = (number: number) => `tier-1-royal-residential-sector-room-${number}`
const structuresForPrince = (number: number) => {
  const locationId = roomPrefix(number)
  const spaceIds = new Set(
    ship.blueprint.spaces
      .filter((space) => space.locationId === locationId)
      .map((space) => space.id),
  )
  return ship.structures.filter((structure) => spaceIds.has(structure.spaceId))
}

const expectedDetails: Readonly<Record<number, readonly string[]>> = {
  1001: ['living-telephone', 'living-reception-painting'],
  1002: ['living-wall-chair-1', 'living-wall-chair-2', 'living-wall-chair-3', 'living-guard-desk'],
  1003: ['dining-chair-head', 'dining-credenza', 'dining-framed-document'],
  1004: ['living-mantel-clock', 'living-framed-decoration'],
  1005: ['living-desk', 'living-whiteboard-1', 'living-whiteboard-2', 'living-noticeboard'],
  1006: ['living-birthday-table', 'living-gift-display-1', 'living-gift-display-2'],
  1007: ['living-deep-sofa', 'living-side-table', 'living-shelving', 'living-television'],
  1008: ['bedroom-bed-01', 'bedroom-party-table'],
  1009: [
    'living-circle-chair-1',
    'living-circle-chair-2',
    'living-circle-chair-3',
    'living-circle-chair-4',
    'living-circle-chair-5',
    'living-circle-chair-6',
  ],
  1010: ['kitchen-cabinet-15', 'living-painting-17', 'living-painting-18'],
  1011: ['bedroom-clock-and-photos'],
  1012: ['bedroom-vent-15', 'bedroom-telephone'],
  1013: ['living-vent-15', 'living-child-table', 'living-toy-chest', 'living-framed-painting'],
  1014: ['living-telephone-15', 'living-painting-21', 'dining-table-25', 'kitchen-cabinet-24'],
}

describe('manga details in every prince apartment', () => {
  it.each(Object.entries(expectedDetails))(
    'keeps the identifying scenery of Room %s',
    (room, ids) => {
      const number = Number(room)
      const prefix = `${roomPrefix(number)}-`
      const actual = structuresForPrince(number).map((structure) =>
        structure.id.slice(prefix.length),
      )
    expect(actual).toEqual(expect.arrayContaining([...ids]))
    },
  )

  it('gives every princely wall picture an intentional material colour', () => {
    const paintings = Array.from({ length: 14 }, (_, index) => 1001 + index).flatMap((room) =>
      structuresForPrince(room).filter((structure) => structure.kind === 'painting'),
    )

    expect(paintings.length).toBeGreaterThan(0)
    for (const painting of paintings) {
      expect(painting.colour, painting.id).toBeTypeOf('number')
    }
  })

  it('renders Tubeppa’s writing surfaces as white enamel and cork', () => {
    const byId = new Map(structuresForPrince(1005).map((structure) => [structure.id, structure]))
    expect(byId.get(`${roomPrefix(1005)}-living-whiteboard-1`)?.colour).toBe(0xf2f2ea)
    expect(byId.get(`${roomPrefix(1005)}-living-whiteboard-2`)?.colour).toBe(0xf2f2ea)
    expect(byId.get(`${roomPrefix(1005)}-living-noticeboard`)?.colour).toBe(0xa87543)
  })
})
