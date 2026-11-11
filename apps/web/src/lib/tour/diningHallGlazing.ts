import type * as Three from 'three'
import { floorOf, type TierPlan } from './blueprint'
import { hasDiningHallModel } from './diningHallSurfacePlan'

/** The service screen lets the food and serving staff remain visible through it. */
export function buildDiningHallGlazing(THREE: typeof Three, plan: TierPlan): Three.Mesh | null {
  const counter = plan.structures.find(
    (solid) =>
      solid.id === 'tier-5-central-dining-hall-service-counter' && hasDiningHallModel(solid),
  )
  const room = plan.spaces.find(({ id }) => id === counter?.spaceId)
  if (!counter || !room) return null
  const geometry = new THREE.PlaneGeometry(counter.size[1] - 1, 0.35)
  geometry.rotateY(Math.PI / 2)
  geometry.translate(
    counter.at[0] + counter.size[0] / 4,
    floorOf(room, plan.tier) + counter.base + counter.height + 0.25,
    counter.at[1],
  )
  const glass = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: 0xb8d3db,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  glass.name = 'dining-hall-service-glass'
  return glass
}
