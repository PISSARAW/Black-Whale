import type * as Three from 'three'
import { floorOf, theShip, type Ship, type TierPlan } from '../tour/blueprint'
import { fogDensityOf } from '../tour/atmosphere'
import { buildTierMesh, type TierMesh } from '../tour/mesh'
import { applySheen } from '../tour/sheen'
import { applySurfaceDetail } from '../tour/surfaceDetail'
import type { Space } from '../tour/types'
import { floorSheen, roomDust, type StageEffect } from './stageAtmosphere'
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
/**
 * Low enough that what is left of a cut solid is thinner than a pixel: at two
 * centimetres every chair in front of the lane left its outline on the floor.
 */
const CUT_HEIGHT = 0.004
/** How much of the mirrored room the floor gives back. */
const FLOOR_SHEEN = 0.16
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
  const surface = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.FrontSide,
    ...clipping,
  })
  // Lambert receives the fill light below; divide it back out so enabling the
  // visit's material hooks does not brighten the baked room twofold.
  surface.color.setScalar(EXPOSURE / FILL_LIGHT)
  // The walk's two procedural surface layers: a world-scale steel grain and
  // the grazing sheen carried by the mesh. They add no invented image texture
  // or UVs, and keep the room's audited vertex colours underneath.
  applySurfaceDetail(surface)
  applySheen(surface)
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
  walls.setAttribute('normal', attribute(THREE, mesh.normals))
  walls.setAttribute('color', attribute(THREE, mesh.colors))
  walls.setAttribute('aSheen', new THREE.BufferAttribute(mesh.sheens, 1))
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
export async function buildShipRoomScenery(
  kit: SceneryKit,
  spaceId: string,
): Promise<FightScenery> {
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

  // The air and the floor: motes inside the turned room, sheen along the lane.
  const dust = roomDust({ THREE, space, tier: plan.tier })
  if (dust) room.root.add(dust.object)
  const sheen = await floorSheen(THREE, FLOOR_SHEEN)
  root.add(sheen.object)
  const effects: StageEffect[] = dust ? [dust, sheen] : [sheen]
  return {
    root,
    // The same density function as the visit, rather than a generic depth ramp.
    fog: { kind: 'exp2', colour: 0x0b0e12, density: fogDensityOf(space) },
    cameraFar: 90,
    clipped: true,
    bloom: true,
    update: (seconds) => effects.forEach((effect) => effect.update(seconds)),
    dispose: () => {
      effects.forEach((effect) => effect.dispose())
      disposeRoomDetails(details)
      room.dispose()
    },
  }
}
