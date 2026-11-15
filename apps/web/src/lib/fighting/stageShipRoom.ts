import type * as Three from 'three'
import { floorOf, theShip, type Ship, type TierPlan } from '../tour/blueprint'
import { buildTierMesh, type TierMesh } from '../tour/mesh'
import type { Space } from '../tour/types'
import type { FightScenery, SceneryKit } from './stageKit'
import { findFightLane, type FightLane } from './stageLane'
import {
  buildRoomDetails,
  detailedSurfacePlan,
  disposeRoomDetails,
  roomBarriers,
} from './stageRoomDetails'

/**
 * Anything standing nearer the camera than this is cut away above the floor.
 *
 * A duel is watched from inside the room, and the room was furnished to be
 * walked through, not filmed: without the cut the nearest table is what the
 * camera sees. It is the open fourth wall of a stage set.
 */
const CUT_DEPTH = 1
const CUT_HEIGHT = 0.02
/** The bake is weighed for the visit's tone mapping; unmapped, it has to come down. */
const EXPOSURE = 0.62
/** The glass carries the sky at its full value, which unmapped is plain white. */
const GLASS_EXPOSURE = 0.6
/**
 * What the modelled furniture is lit by. The room's own surfaces carry their
 * light in the bake; the dressing is Lambert and would be black without these.
 */
const FILL_LIGHT = 2
const KEY_LIGHT = 1.3

/** The room alone, as a plan the visit's mesh builder accepts. */
export function roomPlan(ship: Ship, space: Space): TierPlan {
  const plan = ship.plans.get(space.tierId)
  if (!plan) throw new Error(`Fight stage tier ${space.tierId} has no plan`)
  return {
    ...plan,
    spaces: [space],
    doorways: plan.doorways.filter((door) => door.a === space.id || door.b === space.id),
    walls: plan.walls.filter((wall) => wall.spaceId === space.id),
    columns: new Map([[space.id, plan.columns.get(space.id) ?? []]]),
    structures: plan.structures.filter((structure) => structure.spaceId === space.id),
    blind: [],
  }
}

/**
 * Turns the room so the lane lies on the scene's `x` axis at `z = 0`, floor at
 * `y = 0`, backdrop towards `-z`.
 */
export function placeOnLane(root: Three.Object3D, lane: FightLane, floorY: number): void {
  const angle = Math.atan2(lane.direction[1], lane.direction[0])
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)]
  const [x, z] = lane.centre
  root.rotation.y = angle
  root.position.set(-(x * cos + z * sin), -floorY, -(-x * sin + z * cos))
}

function attribute(THREE: typeof Three, values: Float32Array): Three.BufferAttribute {
  return new THREE.BufferAttribute(values, 3)
}

interface RoomParts {
  THREE: typeof Three
  mesh: TierMesh
  planes: Three.Plane[]
}

function roomSurfaces(parts: RoomParts): { root: Three.Group; dispose: () => void } {
  const { THREE, mesh, planes } = parts
  const clipping = { clippingPlanes: planes, clipIntersection: true }
  const surface = new THREE.MeshBasicMaterial({ vertexColors: true, ...clipping })
  surface.color.setScalar(EXPOSURE)
  const lit = new THREE.MeshBasicMaterial({ vertexColors: true, ...clipping })
  const glass = new THREE.MeshBasicMaterial({ vertexColors: true, ...clipping })
  glass.color.setScalar(GLASS_EXPOSURE)
  const line = new THREE.LineBasicMaterial({
    color: 0xb89b5e,
    opacity: 0.28,
    transparent: true,
    ...clipping,
  })
  // The plating and the audited joints, in the visit's own two inks.
  const seam = new THREE.LineBasicMaterial({
    color: 0x6f6256,
    opacity: 0.22,
    transparent: true,
    ...clipping,
  })
  const joint = new THREE.LineBasicMaterial({
    color: 0xb8a58d,
    opacity: 0.5,
    transparent: true,
    ...clipping,
  })

  const walls = new THREE.BufferGeometry()
  walls.setAttribute('position', attribute(THREE, mesh.positions))
  walls.setAttribute('color', attribute(THREE, mesh.colors))
  const fittings = new THREE.BufferGeometry()
  fittings.setAttribute('position', attribute(THREE, mesh.fittings))
  fittings.setAttribute('color', attribute(THREE, mesh.fittingColors))
  const panes = new THREE.BufferGeometry()
  panes.setAttribute('position', attribute(THREE, mesh.panes))
  panes.setAttribute('color', attribute(THREE, mesh.paneColors))
  const edges = new THREE.BufferGeometry()
  edges.setAttribute('position', attribute(THREE, mesh.edges))
  const seams = new THREE.BufferGeometry()
  seams.setAttribute('position', attribute(THREE, mesh.seams))
  const joints = new THREE.BufferGeometry()
  joints.setAttribute('position', attribute(THREE, mesh.patterns))

  const root = new THREE.Group()
  root.add(
    new THREE.Mesh(walls, surface),
    new THREE.Mesh(fittings, lit),
    new THREE.Mesh(panes, glass),
    new THREE.LineSegments(edges, line),
    new THREE.LineSegments(seams, seam),
    new THREE.LineSegments(joints, joint),
  )
  const owned = [
    walls,
    fittings,
    panes,
    edges,
    seams,
    joints,
    surface,
    lit,
    glass,
    line,
    seam,
    joint,
  ]
  return { root, dispose: () => owned.forEach((item) => item.dispose()) }
}

/** A room of the visit, raised from the blueprint and turned to face the camera. */
export function buildShipRoomScenery(kit: SceneryKit, spaceId: string): FightScenery {
  const { THREE } = kit
  const ship = theShip()
  const space = ship.spaces.get(spaceId)
  if (!space) throw new Error(`Fight stage ${spaceId} is not in the blueprint`)
  const plan = roomPlan(ship, space)
  const planes = [
    new THREE.Plane(new THREE.Vector3(0, 0, -1), CUT_DEPTH),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_HEIGHT),
  ]
  const room = roomSurfaces({ THREE, mesh: buildTierMesh(detailedSurfacePlan(plan)), planes })
  const deck = ship.plans.get(space.tierId) ?? plan
  const details = buildRoomDetails({ THREE, plan: deck, spaceId, planes })
  room.root.add(details)
  const lane = findFightLane(space, plan.structures, {
    columns: plan.columns.get(space.id),
    barriers: roomBarriers(spaceId),
  })
  placeOnLane(room.root, lane, floorOf(space, plan.tier))

  // The lights stay outside the turned room, so the key always falls from the
  // audience's side whichever way the lane happens to run.
  const root = new THREE.Group()
  const key = new THREE.DirectionalLight(0xfff1d8, KEY_LIGHT)
  key.position.set(-4, 9, 8)
  root.add(room.root, new THREE.AmbientLight(0xffffff, FILL_LIGHT), key)
  return {
    root,
    fog: { colour: 0x05090d, near: 18, far: 70 },
    cameraFar: 90,
    clipped: true,
    dispose: () => {
      disposeRoomDetails(details)
      room.dispose()
    },
  }
}
