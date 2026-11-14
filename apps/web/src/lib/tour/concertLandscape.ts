import type * as Three from 'three'
import { concertLandscapeHeight, type ConcertLandscapeSpec } from './concertLandscapeWalk'
import { buildConcertMeadow } from './concertMeadow'
import { buildConcertPetals } from './concertPetals'

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
  )
  for (let ridge = 0; ridge < 4; ridge++) root.add(mountains(THREE, spec, ridge))
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
    { angle: -2.45, radius: 112, width: 34, height: 49, lean: -7 },
    { angle: -1.72, radius: 146, width: 51, height: 64, lean: 10 },
    { angle: -0.92, radius: 126, width: 42, height: 54, lean: -5 },
    { angle: 0.18, radius: 155, width: 60, height: 69, lean: 8 },
    { angle: 1.02, radius: 118, width: 36, height: 46, lean: -9 },
  ]
  for (const [index, layout] of layouts.entries()) {
    const x = spec.origin[0] + Math.cos(layout.angle) * layout.radius
    const z = spec.origin[1] + Math.sin(layout.angle) * layout.radius
    const tangentX = -Math.sin(layout.angle)
    const tangentZ = Math.cos(layout.angle)
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
      new THREE.Float32BufferAttribute([...left, ...peak, ...shoulder, ...shoulder, ...peak, ...right], 3),
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
  const material = new THREE.MeshBasicMaterial({
    color: 0xfffdf0,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const banks = [
    { at: [-58, 43, -105], scale: [52, 13], roll: -0.12 },
    { at: [54, 56, -126], scale: [66, 17], roll: 0.16 },
    { at: [-92, 68, -158], scale: [74, 20], roll: 0.08 },
    { at: [98, 35, -92], scale: [42, 11], roll: -0.2 },
  ] as const
  for (const [bank, layout] of banks.entries()) {
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
    cloud.rotation.z = layout.roll
    cloud.lookAt(spec.origin[0], spec.floor + 24, spec.origin[1])
    root.add(cloud)
  }
  return root
}

function sunDisc(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Mesh {
  const geometry = new THREE.CircleGeometry(8, 48)
  const material = new THREE.MeshBasicMaterial({
    color: 0xfff4c7,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  })
  const disc = new THREE.Mesh(geometry, material)
  disc.name = 'concert-veiled-sun'
  disc.position.set(spec.origin[0] - 58, spec.floor + 72, spec.origin[1] - 172)
  disc.lookAt(spec.origin[0], spec.floor + 25, spec.origin[1])
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
  const horizon = new THREE.Color(0xf5f4dc)
  const zenith = new THREE.Color(0x8ec9e1)
  for (let index = 0; index < positions.count; index++) {
    const up = Math.max(0, positions.getY(index) / 300)
    const colour = horizon.clone().lerp(zenith, Math.sqrt(up))
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

function mountains(THREE: typeof Three, spec: ConcertLandscapeSpec, ridge: number): Three.Mesh {
  const positions: number[] = []
  const colours: number[] = []
  const rock = new THREE.Color([0xa4b5a5, 0xb0c1bb, 0xb8ced0, 0xc4d8d7][ridge])
  const snow = new THREE.Color(0xf6f3df)
  const radius = 88 + ridge * 34
  const sectors = 96
  for (let sector = 0; sector < sectors; sector++) {
    const a = (sector / sectors) * Math.PI * 2
    const b = ((sector + 1) / sectors) * Math.PI * 2
    const crest = (angle: number): number =>
      8 +
      Math.abs(Math.cos(angle)) * (21 + ridge * 5) +
      Math.sin(angle * 7 + ridge * 2) * 5 +
      Math.sin(angle * 19 + ridge) * 3
    const point = (angle: number, height: number, inset = 0): [number, number, number] => [
      spec.origin[0] + Math.cos(angle) * (radius + inset),
      spec.floor + height,
      spec.origin[1] + Math.sin(angle) * (radius + inset),
    ]
    const left = point(a, crest(a))
    const right = point(b, crest(b))
    const valley = point((a + b) / 2, -5, -22)
    const lowLeft = point(a, -5, -28)
    const lowRight = point(b, -5, -28)
    const snowLeft = point(a, crest(a) - 3 - Math.sin(a * 13) * 1.5, -5)
    const snowRight = point(b, crest(b) - 3 - Math.cos(b * 11) * 1.5, -5)
    const shade = 0.88 + Math.sin(a * 19 + ridge) * 0.1
    const faces = [
      { points: [lowLeft, snowLeft, valley], colour: rock.clone().multiplyScalar(shade) },
      { points: [snowLeft, snowRight, valley], colour: rock.clone() },
      { points: [snowRight, lowRight, valley], colour: rock.clone().multiplyScalar(0.88) },
      { points: [snowLeft, left, right], colour: snow.clone().multiplyScalar(shade) },
      { points: [snowLeft, right, snowRight], colour: snow },
    ]
    for (const face of faces) {
      for (const vertex of face.points) {
        positions.push(...vertex)
        colours.push(face.colour.r, face.colour.g, face.colour.b)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  )
  mesh.name = `concert-alpine-ridge-${ridge}`
  return mesh
}
