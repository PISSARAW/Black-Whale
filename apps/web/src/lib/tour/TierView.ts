import type * as Three from 'three'
import { buildTierMesh } from './mesh'
import { walkedPlan, type TourWorld } from './hatsu'
import { dustOf, type Dust } from './dust'
import type { Ship } from './blueprint'

export interface TierRoomView {
  spaceId: string
  mesh: Three.Mesh
  edges: Three.LineSegments
  seams: Three.LineSegments
  fittings: Three.Mesh
  motes: Three.Points | null
  dust: Dust | null
}
export interface BuiltTierView { root: Three.Group; rooms: TierRoomView[] }
export interface TierMaterials {
  surface: Three.Material
  edge: Three.Material
  seam: Three.Material
  fitting: Three.Material
  dust: Three.PointsMaterial
}
interface TierBuild { ship: Ship; world: TourWorld; tierId: string; reveal: boolean }
interface GeometrySlice {
  position: Three.BufferAttribute
  start: number
  count: number
  centre: Three.Vector3
  radius: number
}

/** Builds and disposes the shared-buffer visual representation of a deck. */
export class TierView {
  constructor(private readonly THREE: typeof Three, private readonly materials: TierMaterials) {}

  build({ ship, world, tierId, reveal }: TierBuild): BuiltTierView {
    const mesh = buildTierMesh(walkedPlan(ship, world, tierId), { reveal })
    const position = new this.THREE.BufferAttribute(mesh.positions, 3)
    const normal = new this.THREE.BufferAttribute(mesh.normals, 3)
    const color = new this.THREE.BufferAttribute(mesh.colors, 3)
    const edgePosition = new this.THREE.BufferAttribute(mesh.edges, 3)
    const seamPosition = new this.THREE.BufferAttribute(mesh.seams, 3)
    const fittingPosition = new this.THREE.BufferAttribute(mesh.fittings, 3)
    const fittingColor = new this.THREE.BufferAttribute(mesh.fittingColors, 3)
    const root = new this.THREE.Group()
    const rooms: TierRoomView[] = []
    for (const group of mesh.groups) {
      const centre = new this.THREE.Vector3(group.centre[0], group.centre[1], group.centre[2])
      const geometry = this.geometry({ position, start: group.start, count: group.count, centre, radius: group.radius })
      geometry.setAttribute('normal', normal)
      geometry.setAttribute('color', color)
      const edgeGeometry = this.geometry({ position: edgePosition, start: group.edgeStart, count: group.edgeCount, centre, radius: group.radius })
      const seamGeometry = this.geometry({ position: seamPosition, start: group.seamStart, count: group.seamCount, centre, radius: group.radius })
      const fittingGeometry = this.geometry({ position: fittingPosition, start: group.fittingStart, count: group.fittingCount, centre, radius: group.radius })
      fittingGeometry.setAttribute('color', fittingColor)
      const space = ship.spaces.get(group.spaceId)
      const deck = ship.plans.get(tierId)
      const dust = space && deck && !reveal ? dustOf(space, deck.tier) : null
      let motes: Three.Points | null = null
      if (dust) {
        const moteGeometry = new this.THREE.BufferGeometry()
        moteGeometry.setAttribute('position', new this.THREE.BufferAttribute(dust.positions, 3))
        moteGeometry.boundingSphere = new this.THREE.Sphere(
          new this.THREE.Vector3(dust.centre[0], dust.centre[1], dust.centre[2]), dust.radius,
        )
        motes = new this.THREE.Points(moteGeometry, this.materials.dust)
        moteGeometry.attributes.position.needsUpdate = true
      }
      const room: TierRoomView = {
        spaceId: group.spaceId,
        mesh: new this.THREE.Mesh(geometry, this.materials.surface),
        edges: new this.THREE.LineSegments(edgeGeometry, this.materials.edge),
        seams: new this.THREE.LineSegments(seamGeometry, this.materials.seam),
        fittings: new this.THREE.Mesh(fittingGeometry, this.materials.fitting),
        motes,
        dust,
      }
      root.add(room.mesh, room.edges, room.seams, room.fittings)
      if (motes) root.add(motes)
      rooms.push(room)
    }
    return { root, rooms }
  }

  dispose(built: BuiltTierView): void {
    for (const room of built.rooms) {
      room.mesh.geometry.dispose(); room.edges.geometry.dispose(); room.seams.geometry.dispose()
      room.fittings.geometry.dispose(); room.motes?.geometry.dispose()
    }
  }

  private geometry({ position, start, count, centre, radius }: GeometrySlice) {
    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute('position', position); geometry.setDrawRange(start, count)
    geometry.boundingSphere = new this.THREE.Sphere(centre.clone(), radius)
    return geometry
  }
}
