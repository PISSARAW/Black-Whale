import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'
import { hasCamillaModel } from '$lib/tour/camillaView'
import {
  camillaGuardStaging,
  camillaDiningStaging,
  musseStaging,
} from '$lib/tour/mangaCamillaViews'

export const CAMILLA_VIEWBOX = { width: 800, height: 800 }
export const CAMILLA_SCALE = 700 / 21
export const camillaPoint = ([x, z]: Vec2) => ({
  x: 50 + (x + 10.5) * CAMILLA_SCALE,
  y: 82 + (z + 10.2) * CAMILLA_SCALE,
})
export const camillaLocalPolygon = (polygon: Polygon) =>
  polygon
    .map((at) => {
      const p = camillaPoint(at)
      return `${p.x - 50},${p.y - 82}`
    })
    .join(' ')
export const camillaFixtures = theShip()
  .structures.filter(hasCamillaModel)
  .map((s) => ({
    ...s,
    polygon: camillaLocalPolygon(structureFootprint(s)),
  }))
function spot(at: Vec2) {
  const p = camillaPoint(at)
  return {
    x: Number(((p.x / CAMILLA_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((p.y / CAMILLA_VIEWBOX.height) * 100).toFixed(2)),
  }
}
function anchors(staging: readonly { characterId: string; at: Vec2 }[]) {
  return { occupants: Object.fromEntries(staging.map((s) => [s.characterId, spot(s.at)])) }
}
export const camillaLivingSpotAnchors = anchors(camillaGuardStaging)
export const camillaDiningSpotAnchors = anchors(camillaDiningStaging)
export const camillaEntranceSpotAnchors = anchors(musseStaging)
export const camillaSpotAnchors = {
  occupants: {
    ...camillaLivingSpotAnchors.occupants,
    ...camillaDiningSpotAnchors.occupants,
    ...camillaEntranceSpotAnchors.occupants,
  },
}
