import type * as Three from 'three'
import { driftDust, dustOf } from '../tour/dust'
import type { Space, Tier } from '../tour/types'

/** Something a stage hangs in the air or lays on the floor, and keeps moving. */
export interface StageEffect {
  object: Three.Object3D
  update: (seconds: number) => void
  dispose: () => void
}

interface RoomAir {
  THREE: typeof Three
  space: Space
  tier: Tier
}

/**
 * The motes of the visit, in the rooms tall enough to hold any.
 *
 * The same cloud, seeded on the room, drifting by the same function: a duel in
 * the banquet hall stands in the air the visitor walked through. In plan
 * coordinates, so it goes inside the turned room and not beside it.
 */
export function roomDust(air: RoomAir): StageEffect | null {
  const { THREE, space, tier } = air
  const dust = dustOf(space, tier)
  if (!dust) return null
  const geometry = new THREE.BufferGeometry()
  const positions = new THREE.BufferAttribute(dust.positions, 3)
  geometry.setAttribute('position', positions)
  const material = new THREE.PointsMaterial({
    color: 0xb9a88f,
    size: 0.07,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  // The cloud is the whole room; a sphere fitted to its first frame would cull
  // it the moment it drifted.
  points.frustumCulled = false
  let last: number | null = null
  return {
    object: points,
    update: (seconds) => {
      driftDust(dust, last === null ? 0 : Math.min(seconds - last, 0.1), seconds)
      last = seconds
      positions.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}

const SHEEN_VERTEX = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 vSheenUv;
  void main() {
    vSheenUv = textureMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** The mirror image, added faintly: a polished floor, not a sheet of glass. */
const SHEEN_FRAGMENT = /* glsl */ `
  uniform vec3 color;
  uniform sampler2D tDiffuse;
  varying vec4 vSheenUv;
  void main() {
    vec3 mirrored = texture2DProj(tDiffuse, vSheenUv).rgb;
    gl_FragColor = vec4(mirrored * color, 1.0);
  }
`

/** Wider and deeper than the frame, so the strip never shows an edge. */
const SHEEN_SIZE: readonly [number, number] = [60, 30]
/** Clear of the floor and of the joints drawn 3 cm above it. */
const SHEEN_HEIGHT = 0.035
/** Its near edge, behind the camera. */
const SHEEN_FRONT = 11

/**
 * The floor's sheen under the fighters: the scene mirrored in `y = 0` and added
 * back at `strength`.
 *
 * In scene coordinates — the lane is always the `x` axis, so the strip is laid
 * where the duel is and not across a hall nobody is looking at.
 */
export async function floorSheen(THREE: typeof Three, strength: number): Promise<StageEffect> {
  const { Reflector } = await import('three/examples/jsm/objects/Reflector.js')
  const geometry = new THREE.PlaneGeometry(SHEEN_SIZE[0], SHEEN_SIZE[1])
  const mirror = new Reflector(geometry, {
    textureWidth: 768,
    textureHeight: 384,
    clipBias: 0.02,
    color: new THREE.Color(strength, strength, strength),
    shader: {
      name: 'ClashFloorSheen',
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
      },
      vertexShader: SHEEN_VERTEX,
      fragmentShader: SHEEN_FRAGMENT,
    },
  })
  const material = mirror.material as Three.ShaderMaterial
  material.transparent = true
  material.blending = THREE.AdditiveBlending
  material.depthWrite = false
  mirror.rotation.x = -Math.PI / 2
  mirror.position.set(0, SHEEN_HEIGHT, SHEEN_FRONT - SHEEN_SIZE[1] / 2)
  return {
    object: mirror,
    update: () => undefined,
    dispose: () => {
      geometry.dispose()
      mirror.dispose()
    },
  }
}
