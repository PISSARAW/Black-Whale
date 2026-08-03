import type * as Three from 'three'
import { buildTierMesh, type MeshGroup, type TierMesh } from './mesh'
import { walkedPlan, type TourWorld } from './hatsu'
import { dustOf, type Dust } from './dust'
import type { Ship } from './blueprint'

export interface TierRoomView {
  spaceId: string
  mesh: Three.Mesh
  edges: Three.LineSegments
  seams: Three.LineSegments
  fittings: Three.Mesh
  /**
   * The window glass, in the two rooms that have any and nowhere else.
   *
   * `null` for 312 of the 314 spaces rather than an empty mesh: the glass is a
   * handful of triangles in two rooms, and an object per room to draw none of
   * them would be six hundred draw calls a deck to say nothing.
   */
  panes: Three.Mesh | null
  motes: Three.Points | null
  dust: Dust | null
}
export interface BuiltTierView {
  root: Three.Group
  rooms: TierRoomView[]
}
export interface TierMaterials {
  surface: Three.Material
  edge: Three.Material
  seam: Three.Material
  fitting: Three.Material
  /**
   * The glass, whose colour is the hour of the voyage.
   *
   * Shared across every deck the visit builds rather than made per deck, and
   * that is the point: the walk sets one colour on it when the projected event
   * changes, and a deck built five minutes ago in the cache is already showing
   * the right sky when the visitor takes the stairs back onto it.
   */
  pane: Three.Material
  /**
   * The surface material of a room with a window in it: the deck's own Lambert
   * with the daylight pool hung on it — see `$lib/tour/skyPool`.
   *
   * Two rooms of 314 take it. Everything else takes `surface`, which has no
   * `aSky` attribute to read and no program of its own to compile.
   */
  skylit: Three.Material
  dust: Three.PointsMaterial
}
interface TierBuild {
  ship: Ship
  world: TourWorld
  tierId: string
  reveal: boolean
  /**
   * What share of a room's motes to hang, from the quality palier.
   *
   * A share rather than a switch: the dust is the only thing that makes a
   * six-thousand-square-metre hall read as a volume at all, and the screen that
   * needs it most is the small one. See `$lib/tour/quality`.
   */
  dustScale?: number
}
/** The deck a room is being cut out of, for the parts that are not its buffers. */
interface DeckContext {
  ship: Ship
  tierId: string
  reveal: boolean
  dustScale: number
}

interface GeometrySlice {
  position: Three.BufferAttribute
  start: number
  count: number
  centre: Three.Vector3
  radius: number
}

/**
 * The deck's buffers, uploaded once and pointed at by every room of it.
 *
 * three.js keys its GPU buffers by the `BufferAttribute` object, so making
 * these once and handing the same ones to three hundred geometries is what
 * makes a deck one upload rather than three hundred.
 */
interface TierAttributes {
  position: Three.BufferAttribute
  normal: Three.BufferAttribute
  color: Three.BufferAttribute
  edge: Three.BufferAttribute
  seam: Three.BufferAttribute
  fitting: Three.BufferAttribute
  fittingColor: Three.BufferAttribute
  pane: Three.BufferAttribute
  paneColor: Three.BufferAttribute
  /** `null` on the three decks of five with no opening in them. */
  sky: Three.BufferAttribute | null
}

/** Builds and disposes the shared-buffer visual representation of a deck. */
export class TierView {
  constructor(
    private readonly THREE: typeof Three,
    private readonly materials: TierMaterials,
  ) {}

  build({ ship, world, tierId, reveal, dustScale = 1 }: TierBuild): BuiltTierView {
    const mesh = buildTierMesh(walkedPlan(ship, world, tierId), { reveal })
    const shared = this.attributes(mesh)
    const root = new this.THREE.Group()
    const rooms: TierRoomView[] = []

    for (const group of mesh.groups) {
      const room = this.room(group, shared, { ship, tierId, reveal, dustScale })
      root.add(room.mesh, room.edges, room.seams, room.fittings)
      if (room.panes) root.add(room.panes)
      if (room.motes) root.add(room.motes)
      rooms.push(room)
    }
    return { root, rooms }
  }

  /**
   * One room of the deck: a draw range into the shared buffers, plus whatever
   * of the four other kinds of thing it happens to hold.
   *
   * The deck is still one upload — every room's geometry points at the same
   * `BufferAttribute`s and differs only in its range and in the bounding sphere
   * `buildTierMesh` measured for it — but it is no longer one thing to draw,
   * which is what lets `visibleSpaces` switch a room off.
   */
  private room(group: MeshGroup, shared: TierAttributes, deck: DeckContext): TierRoomView {
    const { ship, tierId, reveal, dustScale } = deck
    const centre = new this.THREE.Vector3(group.centre[0], group.centre[1], group.centre[2])
    const radius = group.radius
    const slice = (position: Three.BufferAttribute, start: number, count: number) => ({
      position,
      start,
      count,
      centre,
      radius,
    })

    const geometry = this.geometry(slice(shared.position, group.start, group.count))
    geometry.setAttribute('normal', shared.normal)
    geometry.setAttribute('color', shared.color)
    // A room has a window exactly when it draws glass, so the same test picks
    // the attribute and the patched material — and picks neither under the
    // reveal, where the bake is off and there is no pool to put back.
    const glazed = group.paneCount > 0 && shared.sky !== null
    if (glazed) geometry.setAttribute('aSky', shared.sky!)

    const space = ship.spaces.get(group.spaceId)
    const plan = ship.plans.get(tierId)
    const dust = space && plan && !reveal ? dustOf(space, plan.tier, dustScale) : null

    return {
      spaceId: group.spaceId,
      mesh: new this.THREE.Mesh(geometry, glazed ? this.materials.skylit : this.materials.surface),
      edges: new this.THREE.LineSegments(
        this.geometry(slice(shared.edge, group.edgeStart, group.edgeCount)),
        this.materials.edge,
      ),
      seams: new this.THREE.LineSegments(
        this.geometry(slice(shared.seam, group.seamStart, group.seamCount)),
        this.materials.seam,
      ),
      fittings: this.lit(
        slice(shared.fitting, group.fittingStart, group.fittingCount),
        shared.fittingColor,
        this.materials.fitting,
      ),
      panes: group.paneCount
        ? this.lit(
            slice(shared.pane, group.paneStart, group.paneCount),
            shared.paneColor,
            this.materials.pane,
          )
        : null,
      motes: this.motes(dust),
      dust,
    }
  }

  /** The deck's buffers, made once and shared by every room of it. */
  private attributes(mesh: TierMesh): TierAttributes {
    const of = (data: Float32Array, size = 3) => new this.THREE.BufferAttribute(data, size)
    return {
      position: of(mesh.positions),
      normal: of(mesh.normals),
      color: of(mesh.colors),
      edge: of(mesh.edges),
      seam: of(mesh.seams),
      fitting: of(mesh.fittings),
      fittingColor: of(mesh.fittingColors),
      pane: of(mesh.panes),
      paneColor: of(mesh.paneColors),
      // Nothing is made, and nothing is uploaded, on a deck with no opening.
      sky: mesh.skies.length ? of(mesh.skies, 1) : null,
    }
  }

  /**
   * One of the two surfaces on the deck that are sources: the ceiling fittings,
   * and the glass. Both carry their value in a colour attribute and neither is
   * allowed to be lit — see the materials in `TourScene`.
   */
  private lit(
    slice: GeometrySlice,
    colour: Three.BufferAttribute,
    material: Three.Material,
  ): Three.Mesh {
    const geometry = this.geometry(slice)
    geometry.setAttribute('color', colour)
    return new this.THREE.Mesh(geometry, material)
  }

  /** The motes of one room, where the room is big enough to hang any. */
  private motes(dust: Dust | null): Three.Points | null {
    if (!dust) return null
    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute('position', new this.THREE.BufferAttribute(dust.positions, 3))
    geometry.boundingSphere = new this.THREE.Sphere(
      new this.THREE.Vector3(dust.centre[0], dust.centre[1], dust.centre[2]),
      dust.radius,
    )
    geometry.attributes.position.needsUpdate = true
    return new this.THREE.Points(geometry, this.materials.dust)
  }

  dispose(built: BuiltTierView): void {
    for (const room of built.rooms) {
      room.mesh.geometry.dispose()
      room.edges.geometry.dispose()
      room.seams.geometry.dispose()
      room.fittings.geometry.dispose()
      room.panes?.geometry.dispose()
      room.motes?.geometry.dispose()
    }
  }

  private geometry({ position, start, count, centre, radius }: GeometrySlice) {
    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute('position', position)
    geometry.setDrawRange(start, count)
    geometry.boundingSphere = new this.THREE.Sphere(centre.clone(), radius)
    return geometry
  }
}
