import { theShip } from '$lib/tour/blueprint'
import { structureFootprint } from '$lib/tour/geometry'
import type { Polygon, Vec2 } from '$lib/tour/types'

export const ROYAL_ARMY_VIEWBOX = { width: 1000, height: 700 }
export const ROYAL_ARMY_SCALE = 40
const roomId = 'tier-4-royal-army-conference-room-floor'
const plan = theShip().plans.get('interior-royal-army-conference')!
export const royalArmyConferenceRoom = plan.spaces.find(({ id }) => id === roomId)!

export function royalArmyConferencePoint([x, z]: Vec2): { x: number; y: number } {
  return { x: 500 + x * ROYAL_ARMY_SCALE, y: 380 + z * ROYAL_ARMY_SCALE }
}
export function royalArmyConferencePolygon(shape: Polygon): string {
  return shape
    .map((at) => {
      const p = royalArmyConferencePoint(at)
      return `${p.x},${p.y}`
    })
    .join(' ')
}
export const royalArmyConferenceFixtures = plan.structures
  .filter(({ spaceId }) => spaceId === roomId)
  .map((item) => ({
    ...item,
    polygon: royalArmyConferencePolygon(structureFootprint(item)),
    point: royalArmyConferencePoint(item.at),
  }))

function spot(at: Vec2): { x: number; y: number } {
  const p = royalArmyConferencePoint(at)
  return { x: (p.x / ROYAL_ARMY_VIEWBOX.width) * 100, y: (p.y / ROYAL_ARMY_VIEWBOX.height) * 100 }
}
/** Speaker location from chapter 380; anonymous seat counts remain a schematic reconstruction. */
export const royalArmyConferenceSpotAnchors = {
  occupants: { 'mizaistom-nana': spot([0.5, -5.1]) },
  seats: Object.fromEntries(
    royalArmyConferenceFixtures
      .filter(({ kind }) => kind === 'seat')
      .map(({ id, at }) => [id.replace(`${roomId}-`, ''), spot(at)]),
  ),
  fallback: spot([0, 5.8]),
}
