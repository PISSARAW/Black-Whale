import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { floorOf, theShip } from '../tour/blueprint'
import { buildRoomDetails, disposeRoomDetails } from './stageRoomDetails'
import { roomFightLane } from './stageRoomLane'
import { placeOnLane, roomPlan } from './stageShipRoom'
import { FIGHT_STAGES } from './stages'
import { FIGHT_BODY_HALF_WIDTH, roomCutDepth } from './stageRoomCut'

const ship = theShip()
const rooms = FIGHT_STAGES.filter((stage) => stage.spaceId)

/** Exact triangle/prism test, including details absent from blueprint collision boxes. */
function intersectingFaces(root: THREE.Group, frontCut: number): number[][] {
  const halfWidth = FIGHT_BODY_HALF_WIDTH
  if (frontCut <= -halfWidth) return []
  const volume = new THREE.Box3(
    new THREE.Vector3(-6.4, 0.15, -halfWidth),
    new THREE.Vector3(6.4, 2.7, Math.min(frontCut, halfWidth)),
  )
  const triangle = new THREE.Triangle()
  const hits: number[][] = []
  root.updateMatrixWorld(true)
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry
    const positions = geometry.getAttribute('position')
    for (let index = 0; index < positions.count; index += 3) {
      triangle.a.fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld)
      triangle.b.fromBufferAttribute(positions, index + 1).applyMatrix4(object.matrixWorld)
      triangle.c.fromBufferAttribute(positions, index + 2).applyMatrix4(object.matrixWorld)
      if (volume.intersectsTriangle(triangle) && hits.length < 3) hits.push(triangle.a.toArray())
    }
    if (geometry !== object.geometry) geometry.dispose()
  })
  return hits
}

describe('actual tour furniture clears the full Clash lane', () => {
  it.each(rooms)('$id has no modelled solid inside the body strip', (stage) => {
    const spaceId = stage.spaceId!
    const space = ship.spaces.get(spaceId)!
    const plan = roomPlan(ship, space)
    const details = buildRoomDetails({
      THREE,
      plan: ship.plans.get(space.tierId)!,
      spaceId,
      planes: [],
    })
    const lane = roomFightLane({ THREE, space, plan, details })
    placeOnLane(details, lane, floorOf(space, plan.tier))
    try {
      expect(
        intersectingFaces(details, roomCutDepth(spaceId)),
        `Actual furniture in ${stage.id}`,
      ).toEqual([])
    } finally {
      disposeRoomDetails(details)
    }
  })
})
