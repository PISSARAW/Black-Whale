import type { Mesh, Object3D, Scene, ShaderMaterial } from 'three'
import { CONTACT_LIFT } from '$lib/tour/contactShadow'
import { fighterAuraHex } from './auraColours'
import type { FightComfort } from './fightComfort'
import type { FightSide, FightState } from './types'

type Three = typeof import('three')

const SIDES = ['player', 'opponent'] as const
const FLOOR_Y = CONTACT_LIFT + 0.002

const RADIAL_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const RADIAL_FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  uniform float uOpacity;
  uniform float uFalloff;
  varying vec2 vUv;
  void main() {
    float radius = length((vUv - 0.5) * 2.0);
    float density = pow(max(1.0 - radius, 0.0), uFalloff);
    gl_FragColor = vec4(uColour * density * uOpacity, density * uOpacity);
  }
`

interface ShadowOrigin {
  y: number
  scale: [number, number, number]
}

/**
 * Stable fight composition shared by every stage.
 *
 * It keeps the existing model shadows on the deck during airborne motion, then
 * adds one floor pool for the combat lane and one faint identity halo behind
 * each fighter. The layer reads rendered/interpolated model positions only and
 * never feeds anything back into simulation or camera fitting.
 */
export function createFightStagingScene(options: {
  THREE: Three
  scene: Scene
  figureOf: (side: FightSide) => Object3D
  comfort: () => FightComfort
}) {
  const { THREE, scene } = options
  const root = new THREE.Group()
  root.name = 'fight-staging'

  const floorMaterial = radialMaterial(THREE, 0xd7e8ee, 0.055, 1.65)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), floorMaterial)
  floor.name = 'fight-stage-floor-pool'
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, FLOOR_Y - 0.004, 0.55)
  floor.scale.set(3, 1.5, 1)
  floor.renderOrder = -2
  root.add(floor)

  const halos = Object.fromEntries(
    SIDES.map((side) => {
      const material = radialMaterial(THREE, 0xffffff, 0.07, 2.15)
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
      halo.name = `fight-stage-halo-${side}`
      halo.position.z = -1.35
      halo.scale.set(0.95, 1.45, 1)
      halo.renderOrder = -3
      root.add(halo)
      return [side, halo]
    }),
  ) as Record<FightSide, Mesh<import('three').PlaneGeometry, ShaderMaterial>>

  scene.add(root)
  const touched = new Map<Object3D, ShadowOrigin>()

  const syncShadow = (model: Object3D) => {
    const shadow = model.getObjectByName('contact-shadow')
    if (!shadow) return
    let origin = touched.get(shadow)
    if (!origin) {
      origin = { y: shadow.position.y, scale: shadow.scale.toArray() as [number, number, number] }
      touched.set(shadow, origin)
    }
    const height = Math.max(0, model.position.y)
    const spread = 1 + Math.min(0.55, height * 0.13)
    shadow.position.y = FLOOR_Y - model.position.y
    shadow.scale.set(origin.scale[0] * spread, origin.scale[1] * spread, origin.scale[2])
  }

  return {
    root,
    sync(state: FightState) {
      const figures = SIDES.map((side) => options.figureOf(side))
      figures.forEach(syncShadow)
      const x = figures.map((figure) => figure.position.x)
      const centre = (x[0] + x[1]) / 2
      const gap = Math.abs(x[1] - x[0])
      floor.position.x = centre
      floor.scale.x = Math.max(2.2, Math.min(6.8, gap * 0.55 + 1.7))
      floorMaterial.uniforms.uOpacity.value = options.comfort().highContrast ? 0.085 : 0.055

      SIDES.forEach((side, index) => {
        const figure = figures[index]
        const halo = halos[side]
        halo.position.x = figure.position.x
        halo.position.y = figure.position.y + (state[side].id === 'biscuit' ? 1.4 : 1.08)
        halo.scale.y = state[side].id === 'biscuit' ? 1.85 : 1.45
        halo.material.uniforms.uColour.value.setHex(fighterAuraHex(state[side].id))
        halo.material.uniforms.uOpacity.value = options.comfort().highContrast ? 0.105 : 0.07
      })
    },
    dispose() {
      touched.forEach((origin, shadow) => {
        shadow.position.y = origin.y
        shadow.scale.set(...origin.scale)
      })
      scene.remove(root)
      floor.geometry.dispose()
      floor.material.dispose()
      SIDES.forEach((side) => {
        halos[side].geometry.dispose()
        halos[side].material.dispose()
      })
    },
  }
}

function radialMaterial(
  THREE: Three,
  colour: number,
  opacity: number,
  falloff: number,
): ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColour: { value: new THREE.Color(colour) },
      uOpacity: { value: opacity },
      uFalloff: { value: falloff },
    },
    vertexShader: RADIAL_VERTEX,
    fragmentShader: RADIAL_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
}
