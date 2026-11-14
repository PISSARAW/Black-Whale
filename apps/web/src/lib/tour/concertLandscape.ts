import type * as Three from 'three'
import { concertLandscapeHeight, type ConcertLandscapeSpec } from './concertLandscapeWalk'
import { buildConcertMeadow } from './concertMeadow'
import { buildConcertPetals } from './concertPetals'
import { buildConcertButterflies } from './concertButterflies'

/** Chapter 383's flowered alpine valley; hues and navigable relief are interpretations. */
export function buildConcertLandscape(
  THREE: typeof Three,
  spec: ConcertLandscapeSpec,
): Three.Group {
  const root = new THREE.Group()
  root.name = 'melody-flowered-landscape'
  root.add(
    terrain(THREE, spec),
    sky(THREE, spec),
    skyRays(THREE, spec),
    melodyGlow(THREE, spec),
    buildConcertMeadow(THREE, spec),
    buildConcertPetals(THREE, spec),
    buildConcertButterflies(THREE, spec),
  )
  for (let ridge = 0; ridge < 4; ridge++) root.add(mountains(THREE, spec, ridge))
  root.add(panoramaMountains(THREE, spec))
  root.add(landmarkMountains(THREE, spec))
  const sun = new THREE.DirectionalLight(0xfff8e7, 3.5)
  sun.position.set(-25, spec.floor + 60, 5)
  sun.target.position.set(...([spec.origin[0], spec.floor, spec.origin[1]] as const))
  root.add(sun, sun.target)
  return root
}

/** Dominant asymmetric summits keep the panorama composed like an illustration. */
function landmarkMountains(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Group {
  const root = new THREE.Group()
  root.name = 'concert-landmark-summits'
  const layouts = [
    { x: -72, z: 104, width: 43, height: 58, lean: -8 },
    { x: -45, z: 68, width: 36, height: 46, lean: 6 },
    { x: 43, z: 74, width: 39, height: 52, lean: -5 },
    { x: 76, z: 118, width: 54, height: 67, lean: 10 },
    { x: 108, z: 156, width: 65, height: 73, lean: -9 },
  ]
  for (const [index, layout] of layouts.entries()) {
    const x = spec.origin[0] + layout.x
    const z = spec.origin[1] + layout.z
    const baseY = spec.floor - 6
    const profiles = [
      [0.08, 0.34, 0.25, 0.61, 1, 0.48, 0.62, 0.2, 0.08],
      [0.06, 0.29, 0.53, 0.38, 1, 0.57, 0.31, 0.44, 0.07],
      [0.1, 0.46, 0.34, 0.7, 0.55, 1, 0.43, 0.25, 0.08],
      [0.07, 0.38, 0.67, 0.49, 1, 0.58, 0.76, 0.31, 0.06],
      [0.09, 0.31, 0.55, 0.42, 0.72, 1, 0.61, 0.28, 0.07],
    ] as const
    const profile = profiles[index]
    const shape = new THREE.Shape()
    shape.moveTo(x - layout.width / 2, baseY)
    for (const [point, height] of profile.entries()) {
      const progress = point / (profile.length - 1)
      const peakLean = Math.sin(progress * Math.PI) * layout.lean
      shape.lineTo(
        x + (progress - 0.5) * layout.width + peakLean,
        baseY + height * layout.height,
      )
    }
    shape.lineTo(x + layout.width / 2, baseY)
    const geometry = new THREE.ShapeGeometry(shape)
    geometry.translate(0, 0, z)
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: index % 2 ? 0x9aa5a1 : 0xb4bcb5,
        side: THREE.DoubleSide,
      }),
    )
    mesh.name = `concert-landmark-summit-${index}`
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 18),
      new THREE.LineBasicMaterial({ color: 0x252a29, transparent: true, opacity: 0.48 }),
    )
    outline.name = `concert-landmark-ink-${index}`
    root.add(mesh, outline, mountainHatching(THREE, geometry, `concert-landmark-hatching-${index}`))
  }
  return root
}

/** Ink-like streaks converge on the white aperture above Melody. */
function skyRays(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.LineSegments {
  const vertices: number[] = []
  for (const side of [-1, 1]) {
    for (let ray = 0; ray < 12; ray++) {
      const outerX = side * (34 + ray * 5.2)
      const outerY = 58 + ((ray * 17) % 36)
      const innerX = side * (8 + (ray % 4) * 2.1)
      const innerY = 42 + ((ray * 11) % 17)
      vertices.push(
        spec.origin[0] + outerX,
        spec.floor + outerY,
        spec.origin[1] + 116 + (ray % 3),
        spec.origin[0] + innerX,
        spec.floor + innerY,
        spec.origin[1] + 116,
      )
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  const rays = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x3d4748, transparent: true, opacity: 0.22 }),
  )
  rays.name = 'concert-sky-radial-ink'
  return rays
}

/** The luminous point drawn over Melody's torso in the chapter spread. */
function melodyGlow(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Group {
  const root = new THREE.Group()
  root.name = 'concert-melody-heart-glow'
  for (const [radius, opacity] of [[0.2, 0.16], [0.125, 0.38], [0.065, 0.92]] as const) {
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    disc.position.z = radius * -0.012
    root.add(disc)
  }
  root.position.set(
    spec.origin[0],
    spec.floor + spec.stageRise + 0.82,
    spec.origin[1] - 0.28,
  )
  return root
}

function terrain(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Mesh {
  const geometry = new THREE.RingGeometry(0, 220, 128, 50)
  geometry.rotateX(-Math.PI / 2)
  const vertices = geometry.getAttribute('position')
  const colours: number[] = []
  const pale = new THREE.Color(0xa7b878)
  const dark = new THREE.Color(0x708f5c)
  for (let index = 0; index < vertices.count; index++) {
    const localX = vertices.getX(index)
    const localZ = vertices.getZ(index)
    const radius = Math.hypot(localX, localZ)
    const scale = Math.pow(radius / 220, 0.8)
    const x = localX * scale + spec.origin[0]
    const z = localZ * scale + spec.origin[1]
    vertices.setXYZ(index, x, concertLandscapeHeight(spec, [x, z]), z)
    const patch = 0.5 + Math.sin(x * 0.13) * Math.cos(z * 0.17) * 0.3
    const colour = dark.clone().lerp(pale, patch)
    colours.push(colour.r, colour.g, colour.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true }))
  mesh.name = 'concert-walkable-meadow'
  return mesh
}

function sky(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Mesh {
  const geometry = new THREE.SphereGeometry(300, 40, 24)
  const positions = geometry.getAttribute('position')
  const colours: number[] = []
  const opening = new THREE.Color(0xf8f3dd)
  const storm = new THREE.Color(0x26333b)
  const high = new THREE.Color(0x60737b)
  for (let index = 0; index < positions.count; index++) {
    const up = Math.max(0, positions.getY(index) / 300)
    const x = positions.getX(index) / 300
    const z = positions.getZ(index) / 300
    const forward = Math.max(0, z)
    const aperture = Math.exp(-Math.pow(x * 3.4, 2)) * Math.pow(forward, 0.35)
    const colour = storm
      .clone()
      .lerp(high, Math.sqrt(up) * 0.55)
      .lerp(opening, aperture)
    colours.push(colour.r, colour.g, colour.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }),
  )
  mesh.name = 'concert-open-sky'
  mesh.position.set(spec.origin[0], spec.floor, spec.origin[1])
  return mesh
}

function mountains(THREE: typeof Three, spec: ConcertLandscapeSpec, ridge: number): Three.Group {
  const root = new THREE.Group()
  root.name = `concert-alpine-ridge-${ridge}`
  for (const side of [-1, 1]) {
    const positions: number[] = []
    const colours: number[] = []
    const rock = new THREE.Color([0x74817e, 0x899994, 0xa3b0aa, 0xbcc7be][ridge])
    const snow = new THREE.Color(0xf2edda)
    const profile = MANGA_MOUNTAIN_PROFILES[side < 0 ? 'left' : 'right'][ridge]
    const segments = 34
    for (let segment = 0; segment < segments; segment++) {
      const z0 = spec.origin[1] + 12 + segment * 5.4
      const z1 = spec.origin[1] + 12 + (segment + 1) * 5.4
      const xAt = (z: number, offset = 0) =>
        spec.origin[0] + side * (22 + ridge * 17 + Math.max(0, z - spec.origin[1]) * 0.23 + offset)
      const crest = (segmentIndex: number) => {
        const progress = (segmentIndex / segments) * (profile.length - 1)
        const before = Math.floor(progress)
        const after = Math.min(profile.length - 1, before + 1)
        const height = profile[before] + (profile[after] - profile[before]) * (progress - before)
        return spec.floor + height * 0.64
      }
      const inner0: [number, number, number] = [xAt(z0, -7), spec.floor - 5, z0]
      const inner1: [number, number, number] = [xAt(z1, -7), spec.floor - 5, z1]
      const peak0: [number, number, number] = [xAt(z0), crest(segment), z0]
      const peak1: [number, number, number] = [xAt(z1), crest(segment + 1), z1]
      const faces = [
        { points: [inner0, peak0, inner1], colour: rock.clone().multiplyScalar(0.72) },
        { points: [inner1, peak0, peak1], colour: rock },
        {
          points: [peak0, [peak0[0], peak0[1] - 5, peak0[2]] as [number, number, number], peak1],
          colour: snow,
        },
      ]
      for (const face of faces)
        for (const vertex of face.points) {
          positions.push(...vertex)
          colours.push(face.colour.r, face.colour.g, face.colour.b)
        }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    )
    mesh.name = `concert-valley-${side < 0 ? 'left' : 'right'}-${ridge}`
    const ink = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 24),
      new THREE.LineBasicMaterial({ color: 0x252b2a, transparent: true, opacity: 0.28 }),
    )
    ink.name = `concert-valley-ink-${side < 0 ? 'left' : 'right'}-${ridge}`
    const hatching = mountainHatching(
      THREE,
      geometry,
      `concert-valley-hatching-${side < 0 ? 'left' : 'right'}-${ridge}`,
    )
    root.add(mesh, ink, hatching)
  }
  return root
}

/**
 * Authored from the double-page silhouette: the left wall is broad and low,
 * while the right wall climbs through three sharp summits. Values are metres
 * above the meadow and are deliberately different on every depth layer.
 */
export const MANGA_MOUNTAIN_PROFILES = {
  left: [
    [9, 14, 20, 16, 27, 21, 17, 13, 12],
    [18, 29, 38, 31, 45, 34, 29, 23, 20],
    [28, 44, 54, 43, 63, 49, 42, 34, 29],
    [39, 57, 68, 55, 78, 62, 55, 46, 39],
  ],
  right: [
    [10, 18, 14, 26, 20, 31, 23, 18, 14],
    [19, 31, 25, 43, 34, 49, 37, 30, 24],
    [29, 43, 35, 58, 46, 66, 51, 42, 33],
    [40, 56, 46, 72, 59, 82, 65, 53, 43],
  ],
} as const

/** Short descending strokes turn flat polygon faces into manga rock planes. */
function mountainHatching(
  THREE: typeof Three,
  source: Three.BufferGeometry,
  name: string,
): Three.LineSegments {
  const expanded = source.index ? source.toNonIndexed() : source
  const position = expanded.getAttribute('position')
  const strokes: number[] = []
  const interpolate = (from: number[], to: number[], amount: number): number[] =>
    from.map((value, axis) => value + (to[axis] - value) * amount)
  for (let triangle = 0; triangle < position.count; triangle += 3) {
    const vertices = [0, 1, 2].map((offset) => [
      position.getX(triangle + offset),
      position.getY(triangle + offset),
      position.getZ(triangle + offset),
    ])
    vertices.sort((a, b) => b[1] - a[1])
    const high = vertices[0]
    for (const [index, low] of vertices.slice(1).entries()) {
      const start = interpolate(high, low, 0.18 + index * 0.08)
      const end = interpolate(high, low, 0.48 + index * 0.12)
      strokes.push(...start, ...end)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(strokes, 3))
  if (expanded !== source) expanded.dispose()
  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x242827, transparent: true, opacity: 0.34 }),
  )
  lines.name = name
  return lines
}

/**
 * A low-detail alpine shell closes the walk in every direction. The authored
 * valley remains lower in front so the chapter composition keeps its opening.
 */
function panoramaMountains(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Group {
  const root = new THREE.Group()
  root.name = 'concert-panorama-mountains'
  const sectors = 128
  for (let ring = 0; ring < 2; ring++) {
    const positions: number[] = []
    const colours: number[] = []
    const radius = 104 + ring * 58
    const rock = new THREE.Color(ring ? 0xaebbb7 : 0x7f908c)
    const snow = new THREE.Color(0xf3efdf)
    for (let sector = 0; sector < sectors; sector++) {
      const a = (sector / sectors) * Math.PI * 2
      const b = ((sector + 1) / sectors) * Math.PI * 2
      const point = (angle: number, atRadius: number, y: number): [number, number, number] => [
        spec.origin[0] + Math.cos(angle) * atRadius,
        y,
        spec.origin[1] + Math.sin(angle) * atRadius,
      ]
      const height = (angle: number, index: number) => {
        const forwardDistance = Math.atan2(
          Math.sin(angle - Math.PI / 2),
          Math.cos(angle - Math.PI / 2),
        )
        const opening = Math.exp(-Math.pow(forwardDistance / 0.52, 2))
        const jagged =
          Math.abs(Math.sin(index * 0.61 + ring * 1.8)) * (19 + ring * 5) +
          Math.sin(index * 1.93 + ring) * 5
        return spec.floor + 17 + ring * 9 + jagged * (1 - opening * 0.58)
      }
      const baseA = point(a, radius - 23, spec.floor - 6)
      const baseB = point(b, radius - 23, spec.floor - 6)
      const peakA = point(a, radius, height(a, sector))
      const peakB = point(b, radius, height(b, sector + 1))
      const snowA = point(a, radius - 3, peakA[1] - 4)
      const snowB = point(b, radius - 3, peakB[1] - 4)
      const faces = [
        { points: [baseA, peakA, baseB], colour: rock.clone().multiplyScalar(0.76) },
        { points: [baseB, peakA, peakB], colour: rock },
        { points: [snowA, peakA, peakB], colour: snow.clone().multiplyScalar(0.94) },
        { points: [snowA, peakB, snowB], colour: snow },
      ]
      for (const face of faces)
        for (const vertex of face.points) {
          positions.push(...vertex)
          colours.push(face.colour.r, face.colour.g, face.colour.b)
        }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    )
    mesh.name = `concert-panorama-ridge-${ring}`
    const ink = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 26),
      new THREE.LineBasicMaterial({ color: 0x28302f, transparent: true, opacity: 0.22 }),
    )
    ink.name = `concert-panorama-ink-${ring}`
    root.add(mesh, ink)
  }
  return root
}
