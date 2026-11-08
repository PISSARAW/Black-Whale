import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('tier-5')

export const HANGAR_VIEWBOX = { width: 900, height: 400 }

/** Maps metric hangar coords (X: -14..14, Z: -3..3.5) to SVG box */
export const hangarPoint = ([x, z]: Vec2) => ({
  x: 50 + ((x + 14.0) / 28.0) * 800,
  y: 50 + ((z + 3.0) / 6.5) * 300,
})

export function hangarSpot(at: Vec2) {
  const pt = hangarPoint(at)
  return {
    x: Number(((pt.x / HANGAR_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((pt.y / HANGAR_VIEWBOX.height) * 100).toFixed(2)),
  }
}

export const hangarStructures = (plan?.structures ?? []).filter(
  (s) => s.spaceId === 'tier-5-hangar-entrance',
)

export const hangarFixtures = hangarStructures.map((structure) => {
  const footprint = structureFootprint(structure)
  const polygon = footprint
    .map((p) => {
      const pt = hangarPoint(p)
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
    })
    .join(' ')
  return {
    ...structure,
    polygon,
    point: hangarPoint(structure.at),
  }
})
export const hangarEntranceFixtures = hangarFixtures

const gate = hangarFixtures.find(({ id }) => id.endsWith('-gate'))
const guardPost = hangarFixtures.find(({ id }) => id.endsWith('-guard-post'))
const stagingWest = hangarFixtures.find(({ id }) => id.endsWith('-staging-west'))
const stagingEast = hangarFixtures.find(({ id }) => id.endsWith('-staging-east'))

export const hangarEntranceSpotAnchors = {
  occupants: {
    guard: guardPost ? hangarSpot(guardPost.at) : hangarSpot([2.5, 2.0]),
    inspector: hangarSpot([0.0, 0.5]),
    cargoHandler: stagingWest ? hangarSpot(stagingWest.at) : hangarSpot([-9.0, 1.2]),
  },
  gate: gate ? hangarSpot(gate.at) : hangarSpot([0.0, -2.85]),
  guardPost: guardPost ? hangarSpot(guardPost.at) : hangarSpot([2.5, 2.0]),
  stagingWest: stagingWest ? hangarSpot(stagingWest.at) : hangarSpot([-9.0, 1.2]),
  stagingEast: stagingEast ? hangarSpot(stagingEast.at) : hangarSpot([10.0, 1.2]),
}
