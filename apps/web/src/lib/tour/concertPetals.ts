import type * as Three from 'three'
import type { ConcertLandscapeSpec } from './concertLandscapeWalk'

const random = (seed: number): number => {
  const value = Math.sin(seed * 91.17 + 17.31) * 143758.5453
  return value - Math.floor(value)
}

/** Pointed, asymmetric and slightly curved instead of a circular particle. */
function petalGeometry(THREE: typeof Three): Three.BufferGeometry {
  const points = [
    [0, -0.18, 0],
    [-0.085, -0.055, 0.012],
    [-0.072, 0.09, 0.025],
    [0.018, 0.19, 0],
    [0.094, 0.055, -0.014],
    [0.068, -0.075, -0.008],
  ] as const
  const centre = [0.003, 0.005, 0.006] as const
  const positions: number[] = []
  const shade: number[] = []
  for (let index = 0; index < points.length; index++) {
    const next = (index + 1) % points.length
    positions.push(...centre, ...points[index], ...points[next])
    shade.push(0.82, 1, 0.94)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aShade', new THREE.Float32BufferAttribute(shade, 1))
  geometry.computeVertexNormals()
  return geometry
}

/** Wind-borne petals from Melody's imagined field, kept in one GPU draw call. */
export function buildConcertPetals(
  THREE: typeof Three,
  spec: ConcertLandscapeSpec,
): Three.InstancedMesh {
  const count = 900
  const drift = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const geometry = petalGeometry(THREE)
  geometry.setAttribute('aDrift', new THREE.InstancedBufferAttribute(drift, 3))
  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: `
      uniform float uTime;
      attribute float aShade;
      attribute vec3 aDrift;
      attribute float aSeed;
      varying float vShade;
      varying float vTint;
      void main() {
        vec3 turned = position;
        float spin = uTime * (1.8 + aDrift.z) + aSeed * 23.0;
        float tumble = uTime * (1.1 + aDrift.x) + aSeed * 17.0;
        mat2 roll = mat2(cos(spin), -sin(spin), sin(spin), cos(spin));
        mat2 tilt = mat2(cos(tumble), -sin(tumble), sin(tumble), cos(tumble));
        turned.xy = roll * turned.xy;
        turned.yz = tilt * turned.yz;
        vec4 world = instanceMatrix * vec4(turned, 1.0);
        world.x += sin(uTime * aDrift.x + aSeed * 31.0) * 2.1;
        world.y += sin(uTime * aDrift.z + aSeed * 19.0) * 0.65;
        world.z += cos(uTime * aDrift.x * 0.74 + aSeed * 29.0) * 1.7;
        vShade = aShade * (0.78 + 0.22 * abs(cos(tumble)));
        vTint = aSeed;
        gl_Position = projectionMatrix * modelViewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vShade;
      varying float vTint;
      void main() {
        vec3 blush = mix(vec3(1.0, 0.79, 0.84), vec3(1.0, 0.95, 0.91), vTint);
        gl_FragColor = vec4(blush * vShade, 0.88 * uOpacity);
      }
    `,
  })
  material.name = 'concert-airborne-petal-material'
  const petals = new THREE.InstancedMesh(geometry, material, count)
  petals.name = 'concert-airborne-petals'
  petals.frustumCulled = false
  const transform = new THREE.Object3D()
  for (let index = 0; index < count; index++) {
    const radius = 4 + Math.sqrt(random(index + 10)) * 72
    const angle = random(index + 2000) * Math.PI * 2
    transform.position.set(
      spec.origin[0] + Math.cos(angle) * radius,
      spec.floor + 0.8 + random(index + 4000) * 18,
      spec.origin[1] + Math.sin(angle) * radius,
    )
    transform.rotation.set(
      random(index + 5000) * Math.PI,
      random(index + 7000) * Math.PI * 2,
      random(index + 9000) * Math.PI,
    )
    const length = 0.16 + random(index + 11000) * 0.34
    transform.scale.set(length * (0.72 + random(index + 12000) * 0.42), length, length)
    transform.updateMatrix()
    petals.setMatrixAt(index, transform.matrix)
    drift[index * 3] = 0.35 + random(index + 6000) * 0.9
    drift[index * 3 + 1] = random(index + 8000) * Math.PI * 2
    drift[index * 3 + 2] = 0.55 + random(index + 10000) * 1.1
    seeds[index] = random(index + 13000)
  }
  petals.instanceMatrix.needsUpdate = true
  ;(geometry.getAttribute('aDrift') as Three.InstancedBufferAttribute).needsUpdate = true
  ;(geometry.getAttribute('aSeed') as Three.InstancedBufferAttribute).needsUpdate = true
  petals.onBeforeRender = () => {
    material.uniforms.uTime.value = performance.now() / 1000
    material.uniforms.uOpacity.value = material.opacity
  }
  return petals
}
