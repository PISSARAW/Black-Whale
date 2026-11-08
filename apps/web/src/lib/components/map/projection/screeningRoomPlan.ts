import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('tier-2')

export const SCREENING_VIEWBOX = { width: 1000, height: 560 }

/** Maps metric screening room coords (X: -87.5..0, Z: 7..52.5) to SVG coordinates */
export const screeningPoint = ([x, z]: Vec2) => ({
  x: (x + 87.5) * 10 + 60,
  y: (z - 7) * 10 + 75,
})

export function screeningSpot(at: Vec2) {
  const pt = screeningPoint(at)
  return {
    x: Number(((pt.x / SCREENING_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((pt.y / SCREENING_VIEWBOX.height) * 100).toFixed(2)),
  }
}

export const screeningStructures = (plan?.structures ?? []).filter(
  (s) => s.spaceId === 'tier-2-screening-room',
)

export const screeningFixtures = screeningStructures.map((structure) => {
  const footprint = structureFootprint(structure)
  const polygon = footprint
    .map((p) => {
      const pt = screeningPoint(p)
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
    })
    .join(' ')
  return {
    ...structure,
    polygon,
    point: screeningPoint(structure.at),
  }
})

const stage = screeningFixtures.find(({ id }) => id.endsWith('-stage'))
const screen = screeningFixtures.find(({ id }) => id.endsWith('-screen'))
const curtain = screeningFixtures.find(({ id }) => id.endsWith('-curtain'))
const prosceniumPort = screeningFixtures.find(({ id }) => id.endsWith('-proscenium-port'))
const prosceniumStarboard = screeningFixtures.find(({ id }) => id.endsWith('-proscenium-starboard'))

export const screeningRoomSpotAnchors = {
  occupants: {
    briefingOfficer: screeningSpot([-79.2, 16.5]),
    stallsCenter: screeningSpot([-43.75, 29.75]),
    vipPort: screeningSpot([-62.0, 8.6]),
    vipStarboard: screeningSpot([-62.0, 51.4]),
  },
  stage: stage ? screeningSpot(stage.at) : screeningSpot([-81.6, 29.75]),
  screen: screen ? screeningSpot(screen.at) : screeningSpot([-84.6, 24.0]),
  curtain: curtain ? screeningSpot(curtain.at) : screeningSpot([-77.6, 29.75]),
  lectern: screeningSpot([-79.2, 16.5]),
  projectionBooth: screeningSpot([-0.4, 29.75]),
  prosceniumPort: prosceniumPort ? screeningSpot(prosceniumPort.at) : screeningSpot([-76.0, 12.0]),
  prosceniumStarboard: prosceniumStarboard
    ? screeningSpot(prosceniumStarboard.at)
    : screeningSpot([-76.0, 47.5]),
  centralAisle: screeningSpot([-43.75, 29.75]),
}
