import type { Group } from 'three'
import type { RoyalDrawing } from './royalLinerArchitecture'
import type { Vec2 } from './types'

const COAT = 0x5e6458
const ARMOUR = 0x2b3736
const TIRE = 0x171e22
const METAL = 0x687572

/** Anonymous troops and vehicles on the quay surrounding the liner in ch. 420. */
export function addRoyalDeckPatrol(draw: RoyalDrawing, floor: number) {
  const patrol = new draw.THREE.Group()
  patrol.name = 'chapter-420-deck-patrol'
  patrol.position.y = floor
  for (const side of [-1, 1]) {
    for (const [index, x] of [
      -145, -113, -88, -71, -59, -50, -39, -28, -13, 8, 38, 75, 115, 146,
    ].entries()) {
      patrol.add(soldier(draw, [x, side * (103 + (index % 4) * 4)]))
    }
    patrol.add(vehicle(draw, [-59, side * 113]), vehicle(draw, [74, side * 116]))
  }
  for (const z of [-64, -32, 0, 32, 64]) {
    patrol.add(soldier(draw, [176, z]), soldier(draw, [-199, z]))
  }
  patrol.add(vehicle(draw, [181, 16]), vehicle(draw, [-204, -10]))
  addWorkLights(draw, patrol)
  patrol.visible = false
  draw.root.add(patrol)
  return patrol
}

function addWorkLights(draw: RoyalDrawing, patrol: Group) {
  const { THREE } = draw
  const geometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float falloff = 1.0 - smoothstep(0.0, 0.5, length(vUv - 0.5));
        gl_FragColor = vec4(0.77, 0.78, 0.66, 0.42 * falloff);
      }`,
  })
  const positions = [
    [-62, 112],
    [-39, 110],
    [73, 117],
    [-60, -112],
    [74, -117],
  ] as const
  const pools = new THREE.InstancedMesh(geometry, material, positions.length)
  positions.forEach(([x, z], index) => {
    pools.setMatrixAt(index, new THREE.Matrix4().makeScale(31, 1, 20).setPosition(x, 0.025, z))
  })
  pools.computeBoundingSphere()
  draw.geometries.add(geometry)
  draw.materials.add(material)
  patrol.add(pools)
}

function soldier(draw: RoyalDrawing, [x, z]: Vec2) {
  const body = new draw.THREE.Group()
  body.position.set(x, 0, z)
  body.rotation.y = x * 0.47
  const head = draw.solid(
    new draw.THREE.SphereGeometry(0.13, 8, 6).scale(0.92, 1.1, 0.95),
    0x9c8c73,
  )
  const helmet = draw.solid(
    new draw.THREE.SphereGeometry(0.15, 9, 5, 0, Math.PI * 2, 0, Math.PI * 0.57),
    COAT,
  )
  head.position.y = 1.59
  helmet.position.y = 1.64
  body.add(head, helmet, draw.box([0.37, 0.55, 0.21], [0, 1.23, 0], COAT))
  body.add(draw.box([0.3, 0.32, 0.08], [0, 1.24, 0.12], ARMOUR))
  for (const side of [-1, 1]) {
    body.add(draw.box([0.14, 0.92, 0.16], [side * 0.1, 0.48, 0], ARMOUR))
    body.add(draw.box([0.12, 0.55, 0.13], [side * 0.23, 1.21, 0.02], COAT))
    body.add(draw.box([0.16, 0.18, 0.25], [side * 0.1, 0.09, 0.04], TIRE))
  }
  return body
}

function vehicle(draw: RoyalDrawing, [x, z]: Vec2) {
  const truck = new draw.THREE.Group()
  truck.position.set(x, 0, z)
  truck.rotation.y = Math.PI / 2
  truck.add(draw.box([1.65, 0.36, 3.22], [0, 0.64, 0], ARMOUR))
  truck.add(draw.box([1.56, 0.42, 1.14], [0, 0.98, 1.03], METAL))
  truck.add(draw.box([1.46, 0.37, 0.33], [0, 1, -0.54], COAT))
  truck.add(draw.box([1.61, 0.12, 0.12], [0, 1.49, 0.4], METAL))
  for (const side of [-1, 1]) {
    truck.add(draw.box([0.08, 0.6, 0.08], [side * 0.74, 1.22, 0.4], METAL))
    truck.add(draw.box([0.23, 0.13, 0.06], [side * 0.53, 0.99, 1.63], 0xffe7ae))
    for (const axle of [-1.05, 1.05]) {
      const wheel = draw.solid(new draw.THREE.CylinderGeometry(0.38, 0.38, 0.28, 12), TIRE)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(side * 0.82, 0.38, axle)
      truck.add(wheel)
    }
  }
  return truck
}
