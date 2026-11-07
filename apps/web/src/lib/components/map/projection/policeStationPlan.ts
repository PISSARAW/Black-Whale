import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Vec2 } from '$lib/tour/types'

const ship = theShip()
const plan = ship.plans.get('interior-police-station')

export const POLICE_VIEWBOX = { width: 1000, height: 700 }

/** Maps metric atrium coords (X: -11..11, Z: -10..5) to SVG box in central-police-station.svelte */
export const policeAtriumPoint = ([x, z]: Vec2) => ({
  x: 50 + ((x + 11) / 22) * 550,
  y: 80 + ((z + 10) / 15) * 450 + 50,
})

/** Maps safety section coords (X: -11..0, Z: -16..-10) to SVG box */
export const policeSafetyPoint = ([x, z]: Vec2) => ({
  x: 650 + ((x + 11) / 11) * 300,
  y: 80 + ((z + 16) / 6) * 300,
})

export function policeSpot(at: Vec2, isSafety = false) {
  const point = isSafety ? policeSafetyPoint(at) : policeAtriumPoint(at)
  return {
    x: Number(((point.x / POLICE_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((point.y / POLICE_VIEWBOX.height) * 100).toFixed(2)),
  }
}

export const policeFixtures = (plan?.structures ?? []).map((structure) => {
  const isSafety = structure.spaceId.includes('safety')
  const toPoint = isSafety ? policeSafetyPoint : policeAtriumPoint
  const footprint = structureFootprint(structure)
  const polygon = footprint
    .map((p) => {
      const pt = toPoint(p)
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
    })
    .join(' ')
  return {
    ...structure,
    polygon,
    point: toPoint(structure.at),
  }
})

const fountain = policeFixtures.find(({ id }) => id.endsWith('-fountain'))
const frontDesk = policeFixtures.find(({ id }) => id.endsWith('-front-desk'))
const safetyDesk = policeFixtures.find(({ id }) => id.endsWith('-safety-desk'))

export const policeSpotAnchors = {
  occupants: {
    'mizaistom-nana': fountain ? policeSpot([1.2, -3.8]) : { x: 32.5, y: 38.0 },
  },
  fountain: fountain ? policeSpot(fountain.at) : { x: 32.5, y: 38.0 },
  frontDesk: frontDesk ? policeSpot(frontDesk.at) : { x: 51.0, y: 22.0 },
  safetyDesk: safetyDesk ? policeSpot(safetyDesk.at, true) : { x: 80.0, y: 25.0 },
}
