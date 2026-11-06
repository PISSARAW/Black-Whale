import type * as Three from 'three'
import type { Ship } from './blueprint'
import type { Polygon } from './types'

type Vec3 = [number, number, number]
export interface RoyalDrawing {
  THREE: typeof Three
  root: Three.Group
  geometries: Set<Three.BufferGeometry>
  materials: Set<Three.Material>
  solid: (geometry: Three.BufferGeometry, colour: number, outline?: boolean) => Three.Mesh
  box: (size: Vec3, at: Vec3, colour: number) => Three.Mesh
  plate: (outline: Polygon, y: number, colour: number) => Three.Mesh
  rail: (outline: Polygon, y: number, parent?: Three.Object3D) => void
  clip: (outline: Polygon, hull: Polygon) => Polygon
}

/** Original modelling from the ch. 420 exterior panel: stepped terraces,
 * open foredeck, central cylindrical crown and the floodlit surrounding quay.
 * Counts, colours and metric dimensions remain reconstruction estimates.
 * Reference: royal-precinct-audit.md, visual follow-up of 6 November 2026.
 */
export function addRoyalArchitecture(draw: RoyalDrawing, ship: Ship, hull: Polygon) {
  const royal = ship.tiers.find((tier) => tier.id === 'tier-1')!
  const upper = ship.tiers.find((tier) => tier.id === 'tier-1-b')!
  const highest = ship.tiers.find((tier) => tier.id === 'tier-1-c')!
  const windows: Three.Matrix4[] = []
  const windowFrames: Three.Matrix4[] = []
  let outline = hull
  for (let level = 0; level < 5; level++) {
    const front = -78 + level * 24
    const back = 110 - level * 4
    const halfWidth = 55 - level * 7
    outline = draw.clip(
      [
        [front, -halfWidth],
        [front, halfWidth],
        [back, halfWidth],
        [back, -halfWidth],
      ],
      outline,
    )
    const rise = (upper.elevation + upper.ceiling - royal.elevation) / 4
    const bottom = level < 4 ? royal.elevation + level * rise : upper.elevation + upper.ceiling
    const top = level < 4 ? bottom + rise : highest.elevation + highest.ceiling
    const shape = new draw.THREE.Shape(outline.map(([x, z]) => new draw.THREE.Vector2(x, -z)))
    const geometry = new draw.THREE.ExtrudeGeometry(shape, {
      depth: top - bottom,
      bevelEnabled: false,
    })
    geometry.rotateX(-Math.PI / 2).translate(0, bottom, 0)
    draw.solid(geometry, 0xe2e3da).name = `royal-liner-terrace-${level}`
    draw.plate(outline, top + 0.025, 0xaab8b9)
    draw.rail(outline, top + 0.025)
    terraceWindows(draw, { outline, y: bottom + 1.65 }, { windows, frames: windowFrames })
    terraceBand(draw, outline, { y: bottom + 0.35, height: 0.22, colour: 0x526575 })
    terraceBand(draw, outline, { y: top - 0.2, height: 0.18, colour: 0xf4eee0 })
  }
  instances(draw, windowFrames, { colour: 0x132c3a, gain: 1, name: 'royal-window-recesses' })
  instances(draw, windows, { colour: 0xffedc5, gain: 2.6, name: 'royal-lit-windows' })
  addCrown(draw, [58, highest.elevation + highest.ceiling, 0])
  addForedeck(draw, royal.elevation)
}

function terraceBand(
  draw: RoyalDrawing,
  outline: Polygon,
  band: { y: number; height: number; colour: number },
) {
  for (let index = 0; index < outline.length; index++) {
    const a = outline[index],
      b = outline[(index + 1) % outline.length]
    const dx = b[0] - a[0],
      dz = b[1] - a[1]
    const length = Math.hypot(dx, dz)
    const mesh = draw.box(
      [length, band.height, 0.22],
      [(a[0] + b[0]) / 2 - (dz / length) * 0.15, band.y, (a[1] + b[1]) / 2 + (dx / length) * 0.15],
      band.colour,
    )
    mesh.rotation.y = -Math.atan2(dz, dx)
  }
}

function terraceWindows(
  draw: RoyalDrawing,
  row: { outline: Polygon; y: number },
  output: { windows: Three.Matrix4[]; frames: Three.Matrix4[] },
) {
  const { THREE } = draw
  for (let index = 0; index < row.outline.length; index++) {
    const a = row.outline[index],
      b = row.outline[(index + 1) % row.outline.length]
    const dx = b[0] - a[0],
      dz = b[1] - a[1]
    const length = Math.hypot(dx, dz),
      count = Math.floor(length / 3.9)
    const rotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      -Math.atan2(dz, dx),
    )
    for (let pane = 0; pane < count; pane++) {
      const t = (pane + 0.5) / count
      const at = new THREE.Vector3(
        a[0] + dx * t - (dz / length) * 0.08,
        row.y,
        a[1] + dz * t + (dx / length) * 0.08,
      )
      output.frames.push(
        new THREE.Matrix4().compose(at, rotation, new THREE.Vector3(3.1, 1.65, 0.16)),
      )
      at.x -= (dz / length) * 0.1
      at.z += (dx / length) * 0.1
      output.windows.push(
        new THREE.Matrix4().compose(at, rotation, new THREE.Vector3(2.55, 1.05, 0.18)),
      )
    }
  }
}

function instances(
  draw: RoyalDrawing,
  matrices: Three.Matrix4[],
  style: { colour: number; gain: number; name: string },
) {
  const { THREE } = draw
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(style.colour).multiplyScalar(style.gain),
  })
  draw.geometries.add(geometry)
  draw.materials.add(material)
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length)
  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
  mesh.computeBoundingSphere()
  mesh.name = style.name
  draw.root.add(mesh)
}

function addCrown(draw: RoyalDrawing, at: Vec3) {
  const { THREE } = draw
  const [x, y, z] = at
  draw.box([25, 0.7, 23], [x, y + 0.35, z], 0xe2d5ab)
  draw.box([21, 1.3, 19], [x, y + 1.35, z], 0xe6e5dc)
  draw.rail(
    [
      [x - 12, z - 11],
      [x - 12, z + 11],
      [x + 12, z + 11],
      [x + 12, z - 11],
    ],
    y + 0.7,
  )
  draw.solid(new THREE.CylinderGeometry(5.2, 6.5, 11, 32).translate(x, y + 7.5, z), 0xe7e7dc)
  draw.solid(new THREE.CylinderGeometry(5.6, 5.6, 0.8, 32).translate(x, y + 13.4, z), 0xc4b98b)
  for (let index = 0; index < 6; index++) {
    const angle = (index * Math.PI) / 3
    const px = x + Math.cos(angle) * 6.3,
      pz = z + Math.sin(angle) * 6.3
    const height = 7 + (index % 2) * 2
    draw.solid(
      new THREE.CylinderGeometry(0.85, 1.05, height, 12).translate(px, y + 9 + height / 2, pz),
      0xe7e4d5,
    )
    draw.solid(new THREE.ConeGeometry(1.2, 3.4, 12).translate(px, y + 10.7 + height, pz), 0x596b78)
  }
  draw.solid(new THREE.CylinderGeometry(0.12, 0.18, 10, 8).translate(x, y + 19, z), 0xe1dac5)
  draw.solid(new THREE.SphereGeometry(0.65, 12, 8).translate(x, y + 24.3, z), 0xd8c18b)
}

function addForedeck(draw: RoyalDrawing, y: number) {
  // The empty pointed foredeck, recessed rectangle and its coping are
  // visible in the reference. Their exact footprint is not a published plan.
  draw.box([22, 0.18, 11], [-83, y + 0.1, -22], 0xe7e1cc)
  draw.box([19.5, 0.2, 8.5], [-83, y + 0.14, -22], 0x31586b)
  draw.box([29, 0.25, 2], [-111, y + 0.15, 0], 0xd7d4bf)
  for (const z of [-36, 36]) draw.box([26, 0.2, 1.1], [-77, y + 0.15, z], 0xd7cba5)
}

export function addRoyalQuay(
  draw: RoyalDrawing,
  context: { outline: Polygon; floor: number; water: number },
) {
  const { THREE } = draw
  const inner = context.outline.map(([x, z]): [number, number] => [x * 1.3, z * 1.35])
  const shape = new THREE.Shape([
    new THREE.Vector2(-235, 165),
    new THREE.Vector2(225, 165),
    new THREE.Vector2(225, -165),
    new THREE.Vector2(-235, -165),
  ])
  shape.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x, -z))))
  const quay = new THREE.ExtrudeGeometry(shape, {
    depth: context.floor - context.water + 2,
    bevelEnabled: false,
  })
  quay.rotateX(-Math.PI / 2).translate(0, context.water - 2, 0)
  draw.solid(quay, 0x687b87).name = 'royal-basin-surrounding-quay'
  terraceBand(draw, inner, { y: context.floor + 0.15, height: 0.3, colour: 0xd4d6ce })
  // The accordion fender seen ahead of the bow, modelled as steel rings.
  for (let ring = 0; ring < 14; ring++) {
    const geometry = new THREE.TorusGeometry(7.5, 0.9, 8, 24)
    geometry.rotateY(Math.PI / 2).translate(-181 + ring * 3.1, context.water + 7, 0)
    draw.solid(geometry, 0x293943)
  }
  addFloodlights(draw, context)
}

function addFloodlights(draw: RoyalDrawing, context: { floor: number; water: number }) {
  const { THREE } = draw
  const lamps: Three.Matrix4[] = []
  const cones: Three.Matrix4[] = []
  const points: Vec3[] = []
  for (const x of [-160, -100, -40, 20, 80, 140])
    for (const z of [-109, 109]) points.push([x, context.floor, z])
  for (const z of [-60, 0, 60]) points.push([182, context.floor, z])
  for (const [x, y, z] of points) {
    draw.box([1.8, 0.6, 1.8], [x, y + 0.3, z], 0x364954)
    draw.box([0.22, 8, 0.22], [x, y + 4.4, z], 0x536875)
    draw.box([3.3, 0.25, 0.35], [x, y + 8.5, z], 0xb8c2c3)
    for (const side of [-1, 1])
      lamps.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x + side, y + 8.5, z),
          new THREE.Quaternion(),
          new THREE.Vector3(1.25, 0.65, 0.6),
        ),
      )
    const light = new THREE.Vector3(x, y + 8.5, z)
    const target = new THREE.Vector3(x * 0.7, context.floor + 23, z * 0.54)
    const delta = light.clone().sub(target)
    cones.push(
      new THREE.Matrix4().compose(
        light.clone().add(target).multiplyScalar(0.5),
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          delta.clone().normalize(),
        ),
        new THREE.Vector3(8, delta.length(), 8),
      ),
    )
  }
  instances(draw, lamps, { colour: 0xf2f7ff, gain: 6, name: 'royal-quay-floodlights' })
  const geometry = new THREE.ConeGeometry(1, 1, 16, 1, true)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader:
      'varying float vAlong; void main(){ vAlong=1.0-uv.y; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }',
    fragmentShader:
      'varying float vAlong; void main(){ float a=0.075*pow(1.0-vAlong,1.3); gl_FragColor=vec4(1.7,1.85,2.0,a); }',
  })
  draw.geometries.add(geometry)
  draw.materials.add(material)
  const beams = new THREE.InstancedMesh(geometry, material, cones.length)
  cones.forEach((matrix, index) => beams.setMatrixAt(index, matrix))
  beams.computeBoundingSphere()
  beams.name = 'royal-quay-light-beams'
  draw.root.add(beams)
}
