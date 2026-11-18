import { gyoSight } from './nenPerception'
import {
  CHAIN_ACCENT_COLOURS,
  CHAIN_ACCENT_FRAMES,
  type KurapikaFrames,
} from './kurapikaPresentation'
import type { createKurapikaChainModel } from './kurapikaChainModel'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

export function kurapikaNenVisible(
  options: EffectSceneOptions,
  state: FightState,
  side: FightSide,
) {
  const viewer = options.viewer?.() ?? 'player'
  return side === viewer || !state[side].nen.in || gyoSight(state[viewer])
}
export function kurapikaVisualSettings(options: EffectSceneOptions) {
  const comfort = options.comfort?.()
  return {
    flashes: comfort?.flashes ?? true,
    reduced: comfort?.camera === 0 && comfort?.flashes === false,
  }
}

/** All five accents follow the existing tip; no replacement chain or detached ghost is drawn. */
export function createKurapikaAccentScene(
  options: EffectSceneOptions,
  actor: { side: FightSide; model: ReturnType<typeof createKurapikaChainModel> },
) {
  const { THREE, scene } = options
  const root = new THREE.Group()
  root.name = `kurapika-accents:${actor.side}`
  const ring = new THREE.RingGeometry(0.05, 0.062, 32)
  const ray = new THREE.PlaneGeometry(0.16, 0.009)
  const accents = CHAIN_ACCENT_COLOURS.map((colour, stage) => {
    const group = new THREE.Group()
    group.name = `chain-accent:${stage}`
    const material = new THREE.MeshBasicMaterial({
      color: colour,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const halo = new THREE.Mesh(ring, material)
    group.add(halo)
    for (const rotation of [0, Math.PI / 2]) {
      const glint = new THREE.Mesh(ray, material)
      glint.rotation.z = rotation
      group.add(glint)
    }
    group.visible = false
    root.add(group)
    return { group, material }
  })
  scene.add(root)
  return {
    sync(state: FightState, frames: KurapikaFrames) {
      const settings = kurapikaVisualSettings(options)
      root.visible = kurapikaNenVisible(options, state, actor.side) && settings.flashes
      accents.forEach(({ group, material }, stage) => {
        const tip = actor.model.tips[stage]
        const frame = frames.accents[stage]
        group.visible = frame !== null && tip.visible
        if (frame === null || !group.visible) return
        tip.getWorldPosition(group.position)
        group.position.z += 0.025
        const t = frame / CHAIN_ACCENT_FRAMES
        group.scale.setScalar(0.65 + t)
        group.rotation.z = Math.PI / 4
        material.opacity = Math.sin(Math.PI * t) * 0.8
      })
    },
    dispose() {
      scene.remove(root)
      ring.dispose()
      ray.dispose()
      accents.forEach(({ material }) => material.dispose())
    },
  }
}
