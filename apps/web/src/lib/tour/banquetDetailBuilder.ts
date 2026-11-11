import type * as Three from 'three'
import { DETAIL_TAGS_KEY, type DetailTagRange, type TourDetailTag } from './detailTag'

export type Point3 = readonly [number, number, number]
interface Placement {
  at: Point3
  colour: number
  rotation?: Point3
  glow?: boolean
  glass?: boolean
  /** Evidence for this exact run of triangles, when it is not a blueprint solid. */
  tag?: TourDetailTag
}
interface SurfaceBatch {
  positions: number[]
  normals: number[]
  colours: number[]
  tags: DetailTagRange[]
}
const batch = (): SurfaceBatch => ({ positions: [], normals: [], colours: [], tags: [] })

function selectBatch(options: {
  placement: Placement
  panes: SurfaceBatch
  lights: SurfaceBatch
  surfaces: SurfaceBatch
}): SurfaceBatch {
  const { placement, panes, lights, surfaces } = options
  return placement.glass ? panes : placement.glow ? lights : surfaces
}

function writeVertices(options: {
  geometry: Three.BufferGeometry
  into: SurfaceBatch
  base: Three.Color
  glow: boolean
}): void {
  const { geometry, into, base, glow } = options
  const vertices = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  for (let index = 0; index < vertices.count; index++) {
    const nx = normals.getX(index),
      ny = normals.getY(index),
      nz = normals.getZ(index)
    // Local modelling shade supplements the tour's existing lights; no new
    // ambient light leaks from the banquet into the rest of the ship.
    const shade = glow ? 1 : 0.72 + Math.max(0, ny * 0.8 - nx * 0.3 + nz * 0.3) * 0.28
    into.positions.push(vertices.getX(index), vertices.getY(index), vertices.getZ(index))
    into.normals.push(nx, ny, nz)
    into.colours.push(base.r * shade, base.g * shade, base.b * shade)
  }
}

function appendTag(options: {
  into: SurfaceBatch
  tag: TourDetailTag | undefined
  firstFace: number
}): void {
  const { into, tag, firstFace } = options
  if (!tag) return
  const count = into.positions.length / 9 - firstFace
  const previous = into.tags.at(-1)
  if (previous?.tag.id === tag.id && previous.start + previous.count === firstFace) {
    previous.count += count
    return
  }
  into.tags.push({ start: firstFace, count, tag })
}

/** At most three buffers per room: opaque surfaces, lights and transparent panes. */
export class BanquetDetailBuilder {
  private readonly surfaces = batch()
  private readonly lights = batch()
  private readonly panes = batch()

  /** Added to every placement; lets a room be modelled around its own centre. */
  origin: Point3 = [0, 0, 0]

  constructor(private readonly THREE: typeof Three) {}

  add(input: Three.BufferGeometry, placement: Placement): void {
    const { THREE } = this
    const geometry = input.index ? input.toNonIndexed() : input
    if (geometry !== input) input.dispose()
    const rotation = placement.rotation ?? [0, 0, 0]
    geometry.rotateX(rotation[0]).rotateY(rotation[1]).rotateZ(rotation[2])
    const [ox, oy, oz] = this.origin
    geometry.translate(placement.at[0] + ox, placement.at[1] + oy, placement.at[2] + oz)
    const base = new THREE.Color(placement.colour)
    const into = selectBatch({
      placement,
      panes: this.panes,
      lights: this.lights,
      surfaces: this.surfaces,
    })
    const firstFace = into.positions.length / 9
    writeVertices({ geometry, into, base, glow: placement.glow === true })
    appendTag({ into, tag: placement.tag, firstFace })
    geometry.dispose()
  }

  box(size: Point3, placement: Placement): void {
    this.add(new this.THREE.BoxGeometry(...size), placement)
  }

  cylinder(
    size: { radius: number; height: number; bottom?: number; sides?: number; open?: boolean },
    placement: Placement,
  ): void {
    this.add(
      new this.THREE.CylinderGeometry(
        size.radius,
        size.bottom ?? size.radius,
        size.height,
        size.sides ?? 16,
        1,
        size.open ?? false,
      ),
      placement,
    )
  }

  sphere(size: Point3, placement: Placement): void {
    this.add(new this.THREE.SphereGeometry(1, 8, 4).scale(...size), placement)
  }

  ring(size: { radius: number; tube: number }, placement: Placement): void {
    this.add(new this.THREE.TorusGeometry(size.radius, size.tube, 4, 20), placement)
  }

  profile(points: readonly (readonly [number, number])[], placement: Placement): void {
    this.add(
      new this.THREE.LatheGeometry(
        points.map(([radius, y]) => new this.THREE.Vector2(radius, y)),
        24,
      ),
      placement,
    )
  }

  flutedShaft(
    size: { radius: number; height: number; flutes: number },
    placement: Placement,
  ): void {
    const geometry = new this.THREE.CylinderGeometry(
      size.radius,
      size.radius,
      size.height,
      size.flutes * 4,
      1,
      true,
    )
    const position = geometry.getAttribute('position')
    for (let index = 0; index < position.count; index++) {
      const angle = Math.atan2(position.getZ(index), position.getX(index))
      const radius = size.radius + 0.035 * (1 + Math.cos(angle * size.flutes))
      position.setX(index, Math.cos(angle) * radius)
      position.setZ(index, Math.sin(angle) * radius)
    }
    geometry.computeVertexNormals()
    this.add(geometry, placement)
  }

  curve(points: readonly Point3[], radius: number, placement: Placement): void {
    const path = new this.THREE.CatmullRomCurve3(
      points.map((point) => new this.THREE.Vector3(...point)),
    )
    this.add(
      new this.THREE.TubeGeometry(path, Math.max(12, points.length), radius, 5, false),
      placement,
    )
  }

  finish(name = 'banquet-manga-details'): Three.Group {
    const root = new this.THREE.Group()
    root.name = name
    this.mesh(this.surfaces, new this.THREE.MeshLambertMaterial({ vertexColors: true }), root)
    this.mesh(this.lights, new this.THREE.MeshBasicMaterial({ vertexColors: true }), root)
    this.mesh(
      this.panes,
      new this.THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        side: this.THREE.DoubleSide,
      }),
      root,
    )
    return root
  }

  private mesh(data: SurfaceBatch, material: Three.Material, root: Three.Group): void {
    if (!data.positions.length) {
      material.dispose()
      return
    }
    const geometry = new this.THREE.BufferGeometry()
    geometry.setAttribute('position', new this.THREE.Float32BufferAttribute(data.positions, 3))
    geometry.setAttribute('normal', new this.THREE.Float32BufferAttribute(data.normals, 3))
    geometry.setAttribute('color', new this.THREE.Float32BufferAttribute(data.colours, 3))
    geometry.computeBoundingSphere()
    const mesh = new this.THREE.Mesh(geometry, material)
    if (data.tags.length) mesh.userData[DETAIL_TAGS_KEY] = data.tags
    root.add(mesh)
  }
}

export function disposeBanquetDetails(root: Three.Object3D): void {
  root.traverse((object) => {
    const mesh = object as Three.Mesh
    if (!mesh.isMesh) return
    mesh.geometry.dispose()
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const material of materials) material.dispose()
  })
  root.removeFromParent()
}
