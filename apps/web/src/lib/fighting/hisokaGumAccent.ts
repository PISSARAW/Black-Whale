import { HISOKA_ACCENT_FRAMES, type HisokaFrames } from './hisokaPresentation'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { Vector3 } from 'three'

export function createHisokaGumAccent(options: EffectSceneOptions) {
  const { THREE } = options
  const root = new THREE.Group()
  root.name = 'hisoka-gum-accent'
  const geometry = new THREE.RingGeometry(0.018, 0.028, 16)
  const material = new THREE.MeshBasicMaterial({
    color: 0xffb8dd,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    opacity: 0,
  })
  const motes = Array.from({ length: 4 }, () => new THREE.Mesh(geometry, material))
  root.add(...motes)
  options.scene.add(root)
  return {
    sync(points: Vector3[], frames: HisokaFrames | null) {
      root.visible = Boolean(frames && points.length > 1 && options.comfort?.().flashes !== false)
      if (!root.visible || !frames) return
      const age = frames.attach ?? frames.pull ?? frames.rebound
      root.visible = age !== null
      if (age === null) return
      const t = age / HISOKA_ACCENT_FRAMES,
        envelope = Math.sin(Math.PI * t)
      material.opacity = envelope * 0.75
      root.userData.frame = age
      motes.forEach((mote, index) => {
        let ratio = Math.max(0, Math.min(1, t * 1.4 - index * 0.1))
        if (frames.pull !== null) ratio = 1 - ratio
        mote.position.copy(points[Math.round(ratio * (points.length - 1))])
        mote.scale.setScalar(0.6 + envelope * 1.4)
      })
    },
    dispose() {
      root.removeFromParent()
      geometry.dispose()
      material.dispose()
    },
  }
}
