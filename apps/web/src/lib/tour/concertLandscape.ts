import type * as Three from 'three'
import { concertLandscapeHeight, type ConcertLandscapeSpec } from './concertLandscapeWalk'
import { buildConcertMeadow } from './concertMeadow'

/** Chapter 383's flowered alpine valley; hues and navigable relief are interpretations. */
export function buildConcertLandscape(
  THREE: typeof Three,
  spec: ConcertLandscapeSpec,
): Three.Group {
  const root = new THREE.Group()
  root.name = 'melody-flowered-landscape'
  root.add(terrain(THREE, spec), sky(THREE, spec), buildConcertMeadow(THREE, spec))
  for (let ridge = 0; ridge < 4; ridge++) root.add(mountains(THREE, spec, ridge))
  const sun = new THREE.DirectionalLight(0xfff8e7, 3.5)
  sun.position.set(-25, spec.floor + 60, 5)
  sun.target.position.set(...([spec.origin[0], spec.floor, spec.origin[1]] as const))
  root.add(sun, sun.target)
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
