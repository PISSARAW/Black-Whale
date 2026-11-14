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
    cloudBanks(THREE, spec),
    sunDisc(THREE, spec),
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
    const tangentX = 1
    const tangentZ = 0
    const half = layout.width / 2
    const baseY = spec.floor - 6
    const peak = [
      x + tangentX * layout.lean,
      baseY + layout.height,
      z + tangentZ * layout.lean,
    ] as const
    const left = [x - tangentX * half, baseY, z - tangentZ * half] as const
    const right = [x + tangentX * half, baseY, z + tangentZ * half] as const
    const shoulder = [
      x + tangentX * (layout.lean * 0.25),
      baseY + layout.height * 0.58,
      z + tangentZ * (layout.lean * 0.25),
    ] as const
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [...left, ...peak, ...shoulder, ...shoulder, ...peak, ...right],
        3,
      ),
    )
    const shade = new THREE.Color(index % 2 ? 0x8fa8a5 : 0xa9bdb6)
    const snow = new THREE.Color(0xf9f4df)
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(
        [shade, snow, shade, shade, snow, shade].flatMap(({ r, g, b }) => [r, g, b]),
        3,
      ),
    )
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    )
    mesh.name = `concert-landmark-summit-${index}`
    root.add(mesh)
  }
  return root
}

/** Layered, hand-composed clouds reproduce the chapter's deep, luminous sky. */
function cloudBanks(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Group {
  const root = new THREE.Group()
  root.name = 'concert-swirling-clouds'
  const banks = [
    { at: [-84, 54, 102], scale: [78, 22], roll: -0.16, colour: 0x263138, opacity: 0.92 },
    { at: [88, 61, 118], scale: [86, 26], roll: 0.18, colour: 0x1d272e, opacity: 0.94 },
    { at: [-39, 78, 158], scale: [58, 16], roll: 0.1, colour: 0x626f72, opacity: 0.72 },
    { at: [34, 72, 176], scale: [54, 14], roll: -0.12, colour: 0x7e8988, opacity: 0.64 },
    { at: [-76, 50, -126], scale: [72, 20], roll: 0.14, colour: 0x354249, opacity: 0.86 },
    { at: [82, 57, -142], scale: [80, 23], roll: -0.17, colour: 0x2a363d, opacity: 0.9 },
    { at: [0, 78, -192], scale: [68, 17], roll: 0.06, colour: 0x657278, opacity: 0.68 },
  ] as const
  for (const [bank, layout] of banks.entries()) {
    const material = new THREE.MeshBasicMaterial({
      color: layout.colour,
      transparent: true,
      opacity: layout.opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const cloud = new THREE.Group()
    cloud.name = `concert-cloud-bank-${bank}`
    for (let lobe = 0; lobe < 7; lobe++) {
      const geometry = new THREE.CircleGeometry(1, 20)
      const mesh = new THREE.Mesh(geometry, material)
      const offset = lobe - 3
      mesh.position.set(offset * 0.68, Math.sin(lobe * 1.7) * 0.18, lobe * -0.012)
      mesh.scale.set(1.15 + (lobe % 3) * 0.22, 0.62 + ((lobe + 1) % 3) * 0.16, 1)
      cloud.add(mesh)
    }
    cloud.position.set(
      spec.origin[0] + layout.at[0],
      spec.floor + layout.at[1],
      spec.origin[1] + layout.at[2],
    )
    cloud.scale.set(layout.scale[0] / 7, layout.scale[1] / 2, 1)
    cloud.lookAt(spec.origin[0], spec.floor + 30, spec.origin[1] - 12)
    cloud.rotateZ(layout.roll)
    root.add(cloud)
  }
  return root
}

function sunDisc(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Mesh {
  const geometry = new THREE.CircleGeometry(14, 48)
  const material = new THREE.MeshBasicMaterial({
    color: 0xfff4c7,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  })
  const disc = new THREE.Mesh(geometry, material)
  disc.name = 'concert-veiled-sun'
  disc.position.set(spec.origin[0], spec.floor + 86, spec.origin[1] + 185)
  disc.lookAt(spec.origin[0], spec.floor + 25, spec.origin[1] - 12)
  return disc
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
    const segments = 34
    for (let segment = 0; segment < segments; segment++) {
      const z0 = spec.origin[1] - 4 + segment * 5.4
      const z1 = spec.origin[1] - 4 + (segment + 1) * 5.4
      const xAt = (z: number, offset = 0) =>
        spec.origin[0] + side * (17 + ridge * 17 + Math.max(0, z - spec.origin[1]) * 0.23 + offset)
      const crest = (segmentIndex: number) =>
        spec.floor +
        12 +
        ridge * 8 +
        Math.abs(Math.sin(segmentIndex * 0.73 + ridge * 1.7)) * (15 + ridge * 4) +
        Math.sin(segmentIndex * 2.1 + ridge) * 4
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
    root.add(mesh, ink)
  }
  return root
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
