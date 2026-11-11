import type * as Three from 'three'
import type { Ship } from './blueprint'
import { floorOf } from './blueprint'
import { toClockwise } from './geometry'
import type { Link, Polygon, Vec2 } from './types'
import { addRoyalArchitecture, addRoyalQuay, type RoyalDrawing } from './royalLinerArchitecture'
import { gangwayPaths, GANGWAY_WIDTH } from './gangwayNavigation'
import { gangwayHullMaterial } from './gangwayGates'
import { TSERRIEDNICH_EXTERIOR } from './tserriednichRoute'

export const PRINCE_VIEW_SPACE = 'tier-2-port-promenade'

export interface GangwayView {
  root: Three.Group
  spaceIds: ReadonlySet<string>
  isOutside: (spaceId: string | null, panorama: boolean) => boolean
  setLocation: (spaceId: string | null, panorama: boolean) => void
  setExtended: (extended: boolean) => void
  dispose: () => void
}

/** Clip a schematic upper deck to its convex supporting hull. */
export function clipRoyalDeck(outline: Polygon, hull: Polygon): Polygon {
  const winding =
    Math.sign(
      hull.reduce((area, a, index) => {
        const b = hull[(index + 1) % hull.length]
        return area + a[0] * b[1] - b[0] * a[1]
      }, 0),
    ) || 1
  let clipped = outline
  for (let edge = 0; edge < hull.length; edge++) {
    const a = hull[edge]
    const b = hull[(edge + 1) % hull.length]
    const distance = (p: Vec2) =>
      winding * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]))
    const input = clipped
    clipped = []
    for (let index = 0; index < input.length; index++) {
      const from = input[index]
      const to = input[(index + 1) % input.length]
      const d0 = distance(from)
      const d1 = distance(to)
      if (d0 >= 0 !== d1 >= 0) {
        const t = d0 / (d0 - d1)
        clipped.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t])
      }
      if (d1 >= 0) clipped.push(to)
    }
  }
  return toClockwise(clipped)
}

/**
 * Original exterior reconstruction: ch. 418's three accesses, ch. 419 p. 18's
 * liner and basin, ch. 420's exterior. Hull outlines, heights and crossing
 * endpoints come from the blueprint. Taper, facade rhythm, basin depth and
 * framing remain estimates. See data/ship/royal-precinct-audit.md.
 */
export function buildGangwayView(THREE: typeof Three, ship: Ship): GangwayView | null {
  const sourceTier = ship.tiers.find((candidate) => candidate.id === 'tier-2')
  const royalTier = ship.tiers.find((candidate) => candidate.id === 'tier-1')
  if (!sourceTier || !royalTier) return null
  const tier = sourceTier
  const royal = royalTier
  const paths = gangwayPaths(ship)
  const royalHull: Polygon = toClockwise([
    [-145, 0],
    [-121, -40],
    [-87.5, -70],
    [70, -70],
    [88.9, -66.08],
    [103.6, -55.44],
    [114.1, -39.76],
    [120.4, -20.72],
    [122.5, 0],
    [120.4, 20.72],
    [114.1, 39.76],
    [103.6, 55.44],
    [88.9, 66.08],
    [70, 70],
    [-87.5, 70],
    [-121, 40],
  ])
  const routes = ship.links.filter(
    (link) => link.retractable && ship.spaces.get(link.from)?.tierId === tier.id,
  )
  if (!routes.length) return null
  const root = new THREE.Group()
  root.name = 'royal-liner-exterior'
  root.visible = false
  const spaceIds = new Set([...routes.map((route) => route.from), TSERRIEDNICH_EXTERIOR])
  const visibleFrom = new Set([
    ...spaceIds,
    ...routes.flatMap((route) => ship.adjacency.get(route.from) ?? []),
  ])
  const materials = new Set<Three.Material>()
  const geometries = new Set<Three.BufferGeometry>()
  // Local face shading makes this facade legible without adding lights or an
  // environment to every sealed room in the tour.
  const surface = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })
  const ink = new THREE.LineBasicMaterial({ color: 0x34464c, transparent: true, opacity: 0.38 })
  materials.add(surface).add(ink)
  const hullSurface = gangwayHullMaterial(THREE, surface, paths)
  materials.add(hullSurface)
  const lightDirection = new THREE.Vector3(-0.35, 0.8, -0.6).normalize()

  function solid(input: Three.BufferGeometry, colour: number, outline = false) {
    const geometry = input.index ? input.toNonIndexed() : input
    if (geometry !== input) input.dispose()
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
    const normals = geometry.getAttribute('normal')
    const colours = new Float32Array(normals.count * 3)
    const base = new THREE.Color(colour)
    const normal = new THREE.Vector3()
    for (let index = 0; index < normals.count; index++) {
      normal.fromBufferAttribute(normals, index)
      const shade = 0.55 + Math.max(0, normal.dot(lightDirection)) * 0.55
      colours.set([base.r * shade, base.g * shade, base.b * shade], index * 3)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
    geometries.add(geometry)
    const mesh = new THREE.Mesh(geometry, surface)
    root.add(mesh)
    if (outline) {
      const edges = new THREE.EdgesGeometry(geometry, 28)
      geometries.add(edges)
      mesh.add(new THREE.LineSegments(edges, ink))
    }
    return mesh
  }

  function box(size: [number, number, number], at: [number, number, number], colour: number) {
    const mesh = solid(new THREE.BoxGeometry(...size), colour)
    mesh.position.set(...at)
    return mesh
  }

  function plate(polygon: Polygon, y: number, colour: number) {
    const shape = new THREE.Shape(polygon.map(([x, z]) => new THREE.Vector2(x, -z)))
    const mesh = solid(new THREE.ShapeGeometry(shape), colour)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = y
    return mesh
  }

  function beam(a: Three.Vector3, b: Three.Vector3, parent: Three.Object3D = root) {
    const delta = b.clone().sub(a)
    const mesh = box([0.09, 0.09, delta.length()], [0, 0, 0], 0xc2c8c5)
    parent.add(mesh)
    mesh.position.copy(a).add(b).multiplyScalar(0.5)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), delta.normalize())
    return mesh
  }

  function quay(polygon: Polygon, y: number, parent: Three.Object3D = root) {
    parent.add(plate(polygon, y - 0.02, 0x6c7774))
    rail(polygon, y, parent)
    for (const [x, z] of polygon) {
      parent.add(box([0.45, y - waterY + 2, 0.45], [x, (y + waterY - 2) / 2, z], 0x596c70))
    }
  }

  function rail(polygon: Polygon, y: number, parent: Three.Object3D = root) {
    for (let index = 0; index < polygon.length; index++) {
      const a = polygon[index]
      const b = polygon[(index + 1) % polygon.length]
      beam(new THREE.Vector3(a[0], y + 1.05, a[1]), new THREE.Vector3(b[0], y + 1.05, b[1]), parent)
      const count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4))
      for (let post = 0; post < count; post++) {
        const fraction = post / count
        parent.add(
          box(
            [0.09, 1.05, 0.09],
            [a[0] + (b[0] - a[0]) * fraction, y + 0.525, a[1] + (b[1] - a[1]) * fraction],
            0xb8c0bd,
          ),
        )
      }
    }
  }

  // This basin is NOT the ocean's waterline (sea.ts/WATERLINE), far below.
  const waterY = tier.elevation - 9.5
  function addBasin() {
    box([1200, 0.35, 700], [0, waterY - 0.175, 0], 0x173b43).name = 'royal-liner-basin'
    const ripples: number[] = []
    for (let row = 0; row < 24; row++) {
      const z = -112 + row * 9.2
      for (let column = 0; column < 14; column++) {
        const x = -178 + column * 26 + (row % 2) * 8
        ripples.push(x, waterY + 0.03, z, x + 7 + (column % 3) * 2, waterY + 0.03, z + 0.35)
      }
    }
    const rippleGeometry = new THREE.BufferGeometry()
    rippleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ripples, 3))
    geometries.add(rippleGeometry)
    const rippleMaterial = new THREE.LineBasicMaterial({
      color: 0x6d9297,
      transparent: true,
      opacity: 0.24,
    })
    materials.add(rippleMaterial)
    root.add(new THREE.LineSegments(rippleGeometry, rippleMaterial))
  }
  addBasin()

  // The tapered hull meets the actual royal deck instead of drawing a second
  // toy ship below a crossing that floats at an unrelated height.
  function addHull() {
    const rings = [
      { y: waterY - 2, fore: 0.91, aft: 0.72, width: 0.68 },
      { y: waterY + 10, fore: 0.94, aft: 0.76, width: 0.74 },
      { y: royal.elevation - 10, fore: 0.99, aft: 0.94, width: 0.95 },
      { y: royal.elevation - 0.5, fore: 1, aft: 1, width: 1 },
    ]
    const positions: number[] = []
    const indices: number[] = []
    for (const ring of rings)
      for (const [x, z] of royalHull) {
        positions.push(x * (x < 0 ? ring.fore : ring.aft), ring.y, z * ring.width)
      }
    const count = royalHull.length
    for (let row = 0; row < rings.length - 1; row++)
      for (let index = 0; index < count; index++) {
        const a = row * count + index,
          b = row * count + ((index + 1) % count),
          c = a + count,
          d = b + count
        indices.push(a, d, c, a, b, d)
      }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    // The night exteriors read the liner as a dark mass picked out by its
    // openings and deck edge, not as a white cruise-ship hull.  Keeping the
    // hull below the superstructure in value also preserves the long flank in
    // the oblique prince view instead of turning the bow into one white slab.
    const hull = solid(geometry, 0x43545d, true)
    hull.material = hullSurface
    hull.name = 'royal-liner-hull'
    const deck = plate(royalHull, royal.elevation - 0.48, 0x7f8e8e)
    deck.material = hullSurface
    deck.name = 'royal-liner-main-deck'
    rail(royalHull, royal.elevation)
  }
  addHull()

  function addHullWindows() {
    for (const y of [royal.elevation - 4.2, royal.elevation - 7.2, royal.elevation - 10.2]) {
      const fraction = (y - (royal.elevation - 10)) / 9.5
      const sx = 0.94 + 0.06 * fraction
      const sz = 0.95 + 0.05 * fraction
      for (let index = 0; index < royalHull.length; index++) {
        const a = royalHull[index]
        const b = royalHull[(index + 1) % royalHull.length]
        const foreScale = 0.99 + 0.01 * fraction
        const ax = a[0] * (a[0] < 0 ? foreScale : sx),
          bx = b[0] * (b[0] < 0 ? foreScale : sx)
        const dx = bx - ax
        const dz = (b[1] - a[1]) * sz
        const length = Math.hypot(dx, dz)
        const count = Math.floor(length / 4.8)
        for (let pane = 0; pane < count; pane++) {
          const along = (pane + 0.5) / count
          const mesh = box(
            [1.2, 0.58, 0.14],
            [
              ax + dx * along - (dz / length) * 0.08,
              y,
              a[1] * sz + dz * along + (dx / length) * 0.08,
            ],
            0xd8cda8,
          )
          mesh.rotation.y = -Math.atan2(dz, dx)
        }
      }
    }

    // A pale sheer line separates the occupied upper decks from the dark
    // flank in the reference exterior and makes the taper legible at night.
    for (let index = 0; index < royalHull.length; index++) {
      const a = royalHull[index]
      const b = royalHull[(index + 1) % royalHull.length]
      const dx = b[0] - a[0]
      const dz = b[1] - a[1]
      const length = Math.hypot(dx, dz)
      const mesh = box(
        [length, 0.22, 0.18],
        [
          (a[0] + b[0]) / 2 - (dz / length) * 0.1,
          royal.elevation - 1.45,
          (a[1] + b[1]) / 2 + (dx / length) * 0.1,
        ],
        0xc7cbbf,
      )
      mesh.rotation.y = -Math.atan2(dz, dx)
    }
  }
  addHullWindows()

  const drawing: RoyalDrawing = {
    THREE,
    root,
    materials,
    geometries,
    solid,
    box,
    plate,
    rail,
    clip: clipRoyalDeck,
  }
  addRoyalArchitecture(drawing, ship, royalHull)
  addRoyalQuay(drawing, { outline: royalHull, floor: tier.elevation, water: waterY })
  const exteriorDeck = ship.spaces.get(TSERRIEDNICH_EXTERIOR)
  if (exteriorDeck) {
    const walkingSurface = plate(exteriorDeck.footprint, royal.elevation + 0.01, 0x34464c)
    walkingSurface.name = 'tserriednich-exterior-walking-surface'
  }
  const floodlightBeams = root.getObjectByName('royal-quay-light-beams')
  const floodlights = root.getObjectByName('royal-quay-floodlights')

  function addAccessPier(route: Link, y: number) {
    const end: Vec2 = route.from.endsWith('route-b')
      ? [183, route.at[1]]
      : [route.at[0], route.at[1] < 0 ? -110 : 110]
    const along = new THREE.Vector2(end[0] - route.at[0], end[1] - route.at[1]).normalize()
    const side: Vec2 = [-along.y * 3, along.x * 3]
    quay(
      [
        [route.at[0] + side[0], route.at[1] + side[1]],
        [end[0] + side[0], end[1] + side[1]],
        [end[0] - side[0], end[1] - side[1]],
        [route.at[0] - side[0], route.at[1] - side[1]],
      ],
      y,
    )
  }

  function addCrossings() {
    const spans: Three.Group[] = []
    for (const route of routes) {
      const source = ship.spaces.get(route.from)!
      const target = ship.spaces.get(route.to)
      const targetTier = target && ship.tiers.find((candidate) => candidate.id === target.tierId)
      if (!target || !targetTier) continue
      const sourceY = floorOf(source, tier)
      const targetY = floorOf(target, targetTier)
      const to = route.atTo ?? route.at
      const start = new THREE.Vector3(route.at[0], sourceY, route.at[1])
      const finish = new THREE.Vector3(to[0], targetY, to[1])
      const direction = finish.clone().sub(start)
      const length = direction.length()
      const bridge = new THREE.Group()
      bridge.name = `retractable-gangway:${route.from}`
      bridge.position.copy(start)
      bridge.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.normalize())
      root.add(bridge)
      const span = new THREE.Group()
      bridge.add(span)
      spans.push(span)
      span.add(box([GANGWAY_WIDTH, 0.24, length], [0, -0.12, length / 2], 0x899b9f))
      const inverse = bridge.quaternion.clone().invert()
      const run = Math.hypot(to[0] - route.at[0], to[1] - route.at[1])
      const steps = Math.max(1, Math.ceil(Math.abs(targetY - sourceY) / 0.19))
      const heading = Math.atan2(to[0] - route.at[0], to[1] - route.at[1])
      const stepRotation = inverse
        .clone()
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading))
      for (let step = 0; step < steps; step++) {
        const at = new THREE.Vector3(0, -0.07, 0).applyQuaternion(inverse)
        at.z += (length * (step + 0.5)) / steps
        const tread = box([GANGWAY_WIDTH, 0.14, run / steps + 0.03], [at.x, at.y, at.z], 0xd8d1b9)
        tread.quaternion.copy(stepRotation)
        span.add(tread)
      }
      for (const side of [-1, 1]) {
        span.add(
          box([0.1, 0.1, length], [side * (GANGWAY_WIDTH / 2 - 0.1), 1.05, length / 2], 0xd5d9ce),
        )
        for (let z = 0; z <= length; z += 3)
          span.add(box([0.1, 1.05, 0.1], [side * (GANGWAY_WIDTH / 2 - 0.1), 0.525, z], 0xb9c5c3))
      }
      // Blueprint collision boundaries remain; the visual enclosure is a rail.
      quay(source.footprint, sourceY)
      addAccessPier(route, sourceY)
    }

    return spans
  }
  const spans = addCrossings()

  const lookout = new THREE.Group()
  lookout.name = 'prince-view-lookout'
  root.add(lookout)

  // A railing has many posts, but it must not cost a draw call per post.
  // Merge only siblings that share a material and visibility/animation state;
  // bridge spans stay separate so retraction never rebuilds their buffers.
  function batch(parent: Three.Object3D) {
    const meshes = parent.children.filter(
      (child): child is Three.Mesh =>
        child instanceof THREE.Mesh &&
        !(child instanceof THREE.InstancedMesh) &&
        child.material === surface &&
        child.children.length === 0 &&
        !child.name,
    )
    if (meshes.length < 2) return
    const positions: number[] = []
    const colours: number[] = []
    const position = new THREE.Vector3()
    for (const mesh of meshes) {
      mesh.updateMatrix()
      const vertices = mesh.geometry.getAttribute('position')
      const shades = mesh.geometry.getAttribute('color')
      for (let index = 0; index < vertices.count; index++) {
        position.fromBufferAttribute(vertices, index).applyMatrix4(mesh.matrix)
        positions.push(position.x, position.y, position.z)
        colours.push(shades.getX(index), shades.getY(index), shades.getZ(index))
      }
      parent.remove(mesh)
      mesh.geometry.dispose()
      geometries.delete(mesh.geometry)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
    geometries.add(geometry)
    parent.add(new THREE.Mesh(geometry, surface))
  }
  for (const span of spans) batch(span)
  batch(lookout)
  batch(root)

  const isOutside = (spaceId: string | null, panorama: boolean) =>
    spaceId !== null && (spaceIds.has(spaceId) || (panorama && spaceId === PRINCE_VIEW_SPACE))
  return {
    root,
    spaceIds,
    isOutside,
    setLocation(spaceId, panorama) {
      root.visible = isOutside(spaceId, panorama) || (spaceId !== null && visibleFrom.has(spaceId))
      lookout.visible = panorama && spaceId === PRINCE_VIEW_SPACE
      if (floodlightBeams) floodlightBeams.visible = spaceId !== TSERRIEDNICH_EXTERIOR
      if (floodlights) floodlights.visible = spaceId !== TSERRIEDNICH_EXTERIOR
    },
    setExtended(extended) {
      // Scale a child, anchored at the quay: no height or heading jump.
      for (const span of spans) span.scale.z = extended ? 1 : 0.08
    },
    dispose() {
      root.traverse((object) => {
        if (object instanceof THREE.InstancedMesh) object.dispose()
      })
      for (const geometry of geometries) geometry.dispose()
      for (const material of materials) material.dispose()
      root.removeFromParent()
    },
  }
}
