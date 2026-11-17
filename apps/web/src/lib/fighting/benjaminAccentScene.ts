import { gyoSight } from './nenPerception'
import { benjaminNenActive } from './benjaminBaton'
import { BENJAMIN_ACCENT_FRAMES, type BenjaminFrames } from './benjaminPresentation'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import type { Object3D } from 'three'

export function benjaminAccentVisible(
  options: EffectSceneOptions,
  state: FightState,
  side: FightSide,
) {
  const viewer = options.viewer?.() ?? 'player'
  return (
    state[side].id === 'benjamin' &&
    benjaminNenActive(state[side]) &&
    (side === viewer || !state[side].nen.in || gyoSight(state[viewer]))
  )
}
export function benjaminReduced(options: EffectSceneOptions) {
  const c = options.comfort?.()
  return c?.camera === 0 && c.flashes === false
}
export function benjaminHand(
  options: EffectSceneOptions,
  state: FightState,
  c: { side: FightSide; hand: 'left' | 'right' },
) {
  const hand = options.figureOf?.(c.side)?.getObjectByName(`hand-${c.hand}`)
  return (
    hand?.localToWorld(new options.THREE.Vector3(0, -0.025, 0.025)) ??
    new options.THREE.Vector3(
      options.worldX(state[c.side].x) + state[c.side].facing * 0.4,
      options.worldY(state[c.side].y + 8),
      0.4,
    )
  )
}

/** Three small pressure arcs leave the physical left palm, without inventing a projectile. */
export function createBenjaminAccentScene(options: EffectSceneOptions, side: FightSide) {
  const { THREE } = options
  const root = new THREE.Group()
  root.name = `benjamin-accents:${side}`
  const geometry = new THREE.RingGeometry(0.87, 1, 40, 1, -0.9, 3.2)
  const material = new THREE.MeshBasicMaterial({
    color: 0xf0ece0,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0,
  })
  const arcs = Array.from({ length: 3 }, () => new THREE.Mesh(geometry, material))
  root.add(...arcs)
  options.scene.add(root)
  return {
    sync(state: FightState, frame: BenjaminFrames) {
      root.userData.events = frame
      root.visible =
        frame.air !== null &&
        benjaminAccentVisible(options, state, side) &&
        !benjaminReduced(options) &&
        options.comfort?.().flashes !== false
      if (!root.visible || frame.air === null) return
      const t = frame.air / BENJAMIN_ACCENT_FRAMES,
        facing = state[side].facing
      const palm = benjaminHand(options, state, { side, hand: 'left' })
      root.position.copy(palm)
      material.opacity = Math.sin(Math.PI * t) * 0.6
      arcs.forEach((arc, i) => {
        const flight = Math.max(0, t - i * 0.1)
        arc.position.set(facing * (0.03 + flight * 0.45), 0, 0.025 * i)
        arc.rotation.set(0, facing * 0.75, facing === 1 ? 0 : Math.PI)
        arc.scale.setScalar(0.08 + flight * 0.26)
      })
    },
    dispose() {
      root.removeFromParent()
      geometry.dispose()
      material.dispose()
    },
  }
}

export function poseCuldcept(
  options: EffectSceneOptions,
  c: {
    state: FightState
    side: FightSide
    frame: BenjaminFrames
    rectangle: Object3D
    card: Object3D
  },
) {
  const { state, side, rectangle, card, frame } = c
  const left = benjaminHand(options, state, { side, hand: 'left' })
  const right = benjaminHand(options, state, { side, hand: 'right' })
  rectangle.position.copy(left).lerp(right, 0.5)
  rectangle.position.x += state[side].facing * 0.15
  rectangle.position.z += 0.03
  rectangle.scale.setScalar(1)
  card.position.copy(right)
  card.position.z += 0.035
  card.scale.setScalar(1)
  card.rotation.set(0, 0, -state[side].facing * 0.08)
  if (benjaminReduced(options)) return
  if (frame.capture !== null && card.visible) {
    const t = ease(frame.capture / BENJAMIN_ACCENT_FRAMES)
    rectangle.visible = true
    rectangle.position.lerp(card.position, t)
    rectangle.scale.setScalar(1 - 0.92 * t)
    card.scale.setScalar(0.25 + 0.75 * t)
    card.rotation.y = Math.PI * (1 - t)
  }
  if (frame.release !== null) {
    const t = frame.release / BENJAMIN_ACCENT_FRAMES
    card.visible = true
    card.scale.setScalar(1 - ease(t))
    card.rotation.z -= state[side].facing * 0.6 * t
    card.position.x += state[side].facing * 0.18 * t
  }
}
function ease(t: number) {
  return t * t * (3 - 2 * t)
}
