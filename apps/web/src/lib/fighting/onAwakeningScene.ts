import { ON_LOOK, type OnAwakeningFrames } from './onAwakening'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightComfort } from './fightComfort'
import type { FightState } from './types'

const VERTEX = `
  uniform float u_time;
  uniform float u_seed;
  uniform float u_rise;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float h = uv.y;
    p.x += sin(h * 9.0 - u_time * 5.0 + u_seed) * 0.15 * h;
    p.x += sin(h * 19.0 - u_time * 7.0 + u_seed) * 0.06 * h;
    p.y *= u_rise;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const FRAGMENT = `
  uniform vec3 u_ink;
  uniform vec3 u_edge;
  uniform float u_time;
  uniform float u_seed;
  uniform float u_opacity;
  varying vec2 vUv;
  void main() {
    float taper = pow(1.0 - vUv.y, 0.65);
    float width = abs(vUv.x * 2.0 - 1.0) / max(0.03, taper);
    float body = 1.0 - smoothstep(0.5, 1.0, width);
    float base = smoothstep(0.0, 0.12, vUv.y);
    float tip = 1.0 - smoothstep(0.68, 1.0, vUv.y);
    float current = 0.8 + 0.2 * sin(vUv.y * 20.0 - u_time * 8.0 + u_seed);
    float alpha = body * base * tip * current * u_opacity;
    if (alpha < 0.01) discard;
    vec3 colour = mix(u_ink, u_edge, smoothstep(0.12, 0.8, width));
    gl_FragColor = vec4(colour, alpha);
  }
`

/** Independent per-side materials; the shared visitor aura is never recoloured or retimed. */
export function createOnAwakeningScene(
  options: Pick<EffectSceneOptions, 'THREE' | 'scene' | 'figureOf'> & {
    comfort: () => FightComfort
    reducedMotion: () => boolean
  },
) {
  const { THREE, scene } = options
  const ribbon = new THREE.PlaneGeometry(0.32, 2.5, 1, 24).translate(0, 1.25, 0)
  const ring = new THREE.RingGeometry(0.86, 0.95, 64)
  const scale = new THREE.Vector3()
  const actors = (['player', 'opponent'] as const).map((side) => {
    const root = new THREE.Group()
    root.name = `on-awakening:${side}`
    root.visible = false
    const strands = Array.from({ length: 12 }, (_, i) => {
      const angle = (i * Math.PI) / 6 + Math.PI / 12
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          u_time: { value: 0 },
          u_seed: { value: i * 1.73 },
          u_rise: { value: 1 },
          u_opacity: { value: 0 },
          u_ink: { value: new THREE.Color(ON_LOOK.ink) },
          u_edge: { value: new THREE.Color(ON_LOOK.edge) },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(ribbon, material)
      mesh.name = `on-rising-shadow:${i}`
      mesh.position.set(Math.sin(angle) * 0.58, -0.05, Math.cos(angle) * 0.48)
      mesh.rotation.y = angle
      root.add(mesh)
      return mesh
    })
    const material = new THREE.MeshBasicMaterial({
      color: ON_LOOK.edge,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const wave = new THREE.Mesh(ring, material)
    wave.name = 'on-release-wave'
    wave.rotation.x = -Math.PI / 2
    wave.position.y = 0.025
    root.add(wave)
    scene.add(root)
    return { side, root, strands, wave }
  })
  type Actor = (typeof actors)[number]
  function syncStrands(actor: Actor, timing: { frame: number | null; time: number }) {
    const { frame, time } = timing
    const rise = frame === null ? 1 : Math.min(1.05, 0.2 + frame / 40)
    const surge = frame === null ? 0 : Math.sin(Math.min(1, frame / 108) * Math.PI)
    for (const strand of actor.strands) {
      const uniforms = strand.material.uniforms
      uniforms.u_time.value = time
      uniforms.u_rise.value = rise
      uniforms.u_opacity.value = 0.12 + surge * 0.48
    }
  }
  function syncWave(actor: Actor, frame: number | null, fighter: FightState['player']) {
    const travel = frame === null ? -1 : (frame - 30) / 45
    actor.wave.visible = options.comfort().flashes && travel >= 0 && travel < 1 && fighter.y === 0
    if (!actor.wave.visible) return
    actor.wave.scale.setScalar(0.4 + travel * 2.4)
    actor.wave.material.opacity = (1 - travel) * 0.35
  }
  function syncActor(actor: Actor, state: FightState, frames: OnAwakeningFrames) {
    const { side, root } = actor
    const fighter = state[side]
    const figure = options.figureOf?.(side)
    root.visible = Boolean(fighter.nen.on && fighter.health > 0 && figure?.visible)
    if (!root.visible || !figure) return
    figure.updateWorldMatrix(true, false)
    figure.getWorldPosition(root.position)
    figure.getWorldScale(scale)
    root.scale.copy(scale)
    const reduced = options.reducedMotion()
    const frame = reduced ? null : frames[side]
    syncStrands(actor, { frame, time: reduced ? 0 : state.frame / 60 })
    syncWave(actor, frame, fighter)
    root.userData.entryFrame = frame
  }
  return {
    sync(state: FightState, frames: OnAwakeningFrames) {
      for (const actor of actors) syncActor(actor, state, frames)
    },
    dispose() {
      for (const { root, strands, wave } of actors) {
        scene.remove(root)
        strands.forEach((strand) => strand.material.dispose())
        wave.material.dispose()
      }
      ribbon.dispose()
      ring.dispose()
    },
  }
}
