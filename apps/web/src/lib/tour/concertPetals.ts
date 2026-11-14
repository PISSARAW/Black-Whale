import type * as Three from 'three'
import type { ConcertLandscapeSpec } from './concertLandscapeWalk'

const random = (seed: number): number => {
  const value = Math.sin(seed * 91.17 + 17.31) * 143758.5453
  return value - Math.floor(value)
}

/** Wind-borne petals from Melody's imagined field, kept in one GPU draw call. */
export function buildConcertPetals(
  THREE: typeof Three,
  spec: ConcertLandscapeSpec,
): Three.Points {
  const count = 1100
  const positions = new Float32Array(count * 3)
  const drift = new Float32Array(count * 3)
  for (let index = 0; index < count; index++) {
    const radius = 4 + Math.sqrt(random(index + 10)) * 72
    const angle = random(index + 2000) * Math.PI * 2
    positions[index * 3] = spec.origin[0] + Math.cos(angle) * radius
    positions[index * 3 + 1] = spec.floor + 0.8 + random(index + 4000) * 18
    positions[index * 3 + 2] = spec.origin[1] + Math.sin(angle) * radius
    drift[index * 3] = 0.35 + random(index + 6000) * 0.9
    drift[index * 3 + 1] = random(index + 8000) * Math.PI * 2
    drift[index * 3 + 2] = 0.55 + random(index + 10000) * 1.1
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aDrift', new THREE.BufferAttribute(drift, 3))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: `
      uniform float uTime;
      attribute vec3 aDrift;
      varying float vTurn;
      void main() {
        vec3 moved = position;
        moved.x += sin(uTime * aDrift.x + aDrift.y) * 2.4;
        moved.y += sin(uTime * aDrift.z + aDrift.y) * 0.65;
        moved.z += cos(uTime * aDrift.x * 0.7 + aDrift.y) * 1.8;
        vTurn = 0.5 + 0.5 * sin(uTime * 4.0 + aDrift.y);
        vec4 eye = modelViewMatrix * vec4(moved, 1.0);
        gl_PointSize = mix(2.0, 6.0, vTurn) * (180.0 / max(1.0, -eye.z));
        gl_Position = projectionMatrix * eye;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vTurn;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        p.x *= mix(1.8, 0.8, vTurn);
        if (dot(p, p) > 0.22) discard;
        gl_FragColor = vec4(
          mix(vec3(1.0, 0.88, 0.91), vec3(1.0), vTurn),
          0.82 * uOpacity
        );
      }
    `,
  })
  material.name = 'concert-airborne-petal-material'
  const petals = new THREE.Points(geometry, material)
  petals.name = 'concert-airborne-petals'
  petals.frustumCulled = false
  petals.onBeforeRender = () => {
    material.uniforms.uTime.value = performance.now() / 1000
    material.uniforms.uOpacity.value = material.opacity
  }
  return petals
}
