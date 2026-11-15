import type * as Three from 'three'
import { concertLandscapeHeight, type ConcertLandscapeSpec } from './concertLandscapeWalk'

const sample = (seed: number): number => {
  const value = Math.sin(seed * 73.91 + 211.17) * 17453.221
  return value - Math.floor(value)
}

interface ButterflyBuffers {
  positions: number[]
  colours: number[]
  wings: number[]
}

type Point = readonly [number, number]

function polygon(
  THREE: typeof Three,
  into: ButterflyBuffers,
  spec: { points: readonly Point[]; colour: number; wing: number; depth: number },
): void {
  const { points, colour, wing, depth } = spec
  const tone = new THREE.Color(colour)
  const centre = points
    .reduce(([x, y], [px, py]) => [x + px, y + py] as const, [0, 0] as const)
    .map((value) => value / points.length) as [number, number]
  for (let index = 0; index < points.length; index++) {
    const next = (index + 1) % points.length
    for (const [x, y] of [centre, points[index], points[next]]) {
      into.positions.push(x, y, depth)
      into.colours.push(tone.r, tone.g, tone.b)
      into.wings.push(wing)
    }
  }
}

function scaled(points: readonly Point[], anchorX: number, amount: number): Point[] {
  return points.map(([x, y]) => [anchorX + (x - anchorX) * amount, y * amount])
}

/** A readable manga-like butterfly: four bordered wings, head, abdomen and antennae. */
function butterflyGeometry(THREE: typeof Three): Three.BufferGeometry {
  const into: ButterflyBuffers = { positions: [], colours: [], wings: [] }
  const upper: Point[] = [
    [0.015, 0.16],
    [0.17, 0.34],
    [0.38, 0.3],
    [0.42, 0.08],
    [0.2, -0.015],
    [0.035, 0.045],
  ]
  const lower: Point[] = [
    [0.025, 0.045],
    [0.2, -0.015],
    [0.31, -0.2],
    [0.16, -0.34],
    [0.035, -0.18],
  ]
  for (const side of [-1, 1]) {
    const mirror = (points: readonly Point[]): Point[] => points.map(([x, y]) => [x * side, y])
    const upperSide = mirror(upper)
    const lowerSide = mirror(lower)
    polygon(THREE, into, { points: upperSide, colour: 0x241c1a, wing: side, depth: 0 })
    polygon(THREE, into, { points: lowerSide, colour: 0x241c1a, wing: side, depth: 0 })
    polygon(THREE, into, {
      points: scaled(upperSide, side * 0.02, 0.8),
      colour: 0xe7a94a,
      wing: side,
      depth: 0.008,
    })
    polygon(THREE, into, {
      points: scaled(lowerSide, side * 0.02, 0.76),
      colour: 0x9b5d3d,
      wing: side,
      depth: 0.008,
    })
    polygon(THREE, into, {
      points: mirror([
        [0.2, 0.16],
        [0.27, 0.2],
        [0.25, 0.11],
      ]),
      colour: 0xf6df92,
      wing: side,
      depth: 0.014,
    })
  }
  polygon(THREE, into, {
    points: [
      [-0.034, 0.18],
      [0.034, 0.18],
      [0.046, -0.18],
      [0, -0.31],
      [-0.046, -0.18],
    ],
    colour: 0x211a18,
    wing: 0,
    depth: 0.025,
  })
  const head: Point[] = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2
    return [Math.cos(angle) * 0.055, 0.215 + Math.sin(angle) * 0.055]
  })
  polygon(THREE, into, { points: head, colour: 0x211a18, wing: 0, depth: 0.026 })
  polygon(THREE, into, {
    points: [
      [-0.025, 0.245],
      [-0.13, 0.42],
      [-0.105, 0.43],
    ],
    colour: 0x211a18,
    wing: 0,
    depth: 0.02,
  })
  polygon(THREE, into, {
    points: [
      [0.025, 0.245],
      [0.13, 0.42],
      [0.105, 0.43],
    ],
    colour: 0x211a18,
    wing: 0,
    depth: 0.02,
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(into.positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(into.colours, 3))
  geometry.setAttribute('aWing', new THREE.Float32BufferAttribute(into.wings, 1))
  geometry.computeBoundingSphere()
  return geometry
}

/** Butterflies from the lower half of the ch. 383 spread, distinct from petals. */
export function buildConcertButterflies(
  THREE: typeof Three,
  spec: ConcertLandscapeSpec,
): Three.InstancedMesh {
  // Fewer, readable silhouettes beat a cloud of tiny ambiguous marks.
  const count = 64
  const origins: Three.Vector3[] = []
  const seeds = new Float32Array(count)
  const transform = new THREE.Object3D()
  const geometry = butterflyGeometry(THREE)
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: `
      uniform float uTime;
      attribute float aSeed;
      attribute float aWing;
      varying vec3 vColour;
      varying float vShade;
      void main() {
        vec3 shaped = position;
        float beat = uTime * (8.0 + aSeed * 4.0) + aSeed * 31.0;
        float fold = 0.18 + 0.78 * (0.5 + 0.5 * sin(beat));
        if (abs(aWing) > 0.5) {
          float originalX = shaped.x;
          shaped.x *= cos(fold);
          shaped.z += abs(originalX) * sin(fold) * 0.92;
        }
        vec4 world = instanceMatrix * vec4(shaped, 1.0);
        vec4 eye = modelViewMatrix * world;
        vColour = mix(color, color.bgr, aSeed * 0.12);
        vShade = 0.82 + 0.18 * cos(fold);
        gl_Position = projectionMatrix * eye;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColour;
      varying float vShade;
      void main() {
        gl_FragColor = vec4(vColour * vShade, uOpacity);
      }
    `,
  })
  material.name = 'concert-butterfly-material'
  const butterflies = new THREE.InstancedMesh(geometry, material, count)
  butterflies.name = 'concert-butterflies'
  butterflies.frustumCulled = false
  for (let index = 0; index < count; index++) {
    const angle = sample(index + 10) * Math.PI * 2
    const radius = 3 + Math.sqrt(sample(index + 900)) * 52
    const x = spec.origin[0] + Math.cos(angle) * radius
    const z = spec.origin[1] + Math.sin(angle) * radius
    origins.push(
      new THREE.Vector3(
        x,
        concertLandscapeHeight(spec, [x, z]) + 0.8 + sample(index + 1700) * 6.5,
        z,
      ),
    )
    seeds[index] = sample(index + 2600)
  }
  ;(geometry.getAttribute('aSeed') as Three.InstancedBufferAttribute).needsUpdate = true
  butterflies.onBeforeRender = (_renderer, _scene, camera) => {
    const time = performance.now() / 1000
    material.uniforms.uTime.value = time
    material.uniforms.uOpacity.value = material.opacity
    for (let index = 0; index < count; index++) {
      const seed = seeds[index]
      const origin = origins[index]
      transform.position.set(
        origin.x + Math.sin(time * (0.52 + seed * 0.16) + seed * 37) * 1.15,
        origin.y + Math.sin(time * (1.3 + seed * 0.5) + seed * 19) * 0.42,
        origin.z + Math.cos(time * (0.47 + seed * 0.14) + seed * 29) * 0.95,
      )
      const yaw = Math.atan2(
        camera.position.x - transform.position.x,
        camera.position.z - transform.position.z,
      )
      transform.rotation.set(
        Math.sin(time * 0.83 + seed * 13) * 0.12,
        yaw,
        Math.sin(time * 1.07 + seed * 23) * 0.2,
      )
      const size = 0.18 + seed * 0.14
      transform.scale.setScalar(size)
      transform.updateMatrix()
      butterflies.setMatrixAt(index, transform.matrix)
    }
    butterflies.instanceMatrix.needsUpdate = true
  }
  return butterflies
}
