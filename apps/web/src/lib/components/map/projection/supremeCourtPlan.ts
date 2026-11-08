import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('tier-1-b')

export const COURT_VIEWBOX = { width: 900, height: 650 }

/** Maps metric supreme court coords (X: 80.5..122.5, Z: 24.5..52.5) to SVG box */
export const courtPoint = ([x, z]: Vec2) => ({
  x: 75 + ((x - 80.5) / 42.0) * 750,
  y: 75 + ((z - 24.5) / 28.0) * 500,
})

export function courtSpot(at: Vec2) {
  const pt = courtPoint(at)
  return {
    x: Number(((pt.x / COURT_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((pt.y / COURT_VIEWBOX.height) * 100).toFixed(2)),
  }
}

export const courtStructures = (plan?.structures ?? []).filter(
  (s) => s.spaceId === 'tier-1-supreme-court',
)

export const courtFixtures = courtStructures.map((structure) => {
  const footprint = structureFootprint(structure)
  const polygon = footprint
    .map((p) => {
      const pt = courtPoint(p)
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
    })
    .join(' ')
  return {
    ...structure,
    polygon,
    point: courtPoint(structure.at),
  }
})

const bench = courtFixtures.find(({ id }) => id.endsWith('-bench'))
const podium = courtFixtures.find(({ id }) => id.endsWith('-podium'))
const prosecution = courtFixtures.find(({ id }) => id.endsWith('-prosecution'))
const defence = courtFixtures.find(({ id }) => id.endsWith('-defence'))
const seal = courtFixtures.find(({ id }) => id.endsWith('-seal'))

export const supremeCourtSpotAnchors = {
  occupants: {
    cleapatro: courtSpot([118.8, 38.5]),
    camilla: courtSpot([108.0, 38.5]),
    prosecutor: courtSpot([102.0, 33.0]),
    defenceCounsel: courtSpot([102.0, 44.0]),
  },
  magistrateBench: bench ? courtSpot(bench.at) : courtSpot([118.0, 38.5]),
  podium: podium ? courtSpot(podium.at) : courtSpot([108.0, 38.5]),
  prosecutionTable: prosecution ? courtSpot(prosecution.at) : courtSpot([102.0, 33.0]),
  defenceTable: defence ? courtSpot(defence.at) : courtSpot([102.0, 44.0]),
  seal: seal ? courtSpot(seal.at) : courtSpot([122.35, 38.5]),
}
