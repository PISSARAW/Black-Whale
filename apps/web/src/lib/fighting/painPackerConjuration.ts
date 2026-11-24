import type { EffectSceneOptions } from './fighterEffectScene'
import { feitanEase, PAIN_PACKER_ENTRY_FRAMES } from './feitanPresentation'

export function createPainPackerConjuration(THREE: EffectSceneOptions['THREE']) {
  const root = new THREE.Group()
  root.name = 'pain-packer-conjuration'
  const material = new THREE.MeshBasicMaterial({
    color: 0xff4b18,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const curves = [-1, 1].map((sign) => {
    const points = Array.from({ length: 45 }, (_, i) => {
      const t = i / 44
      const angle = t * Math.PI * 3 * sign
      return new THREE.Vector3(Math.sin(angle) * 0.42, t * 1.95, Math.cos(angle) * 0.35)
    })
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, 0.012, 5, false)
    const mesh = new THREE.Mesh(geometry, material)
    root.add(mesh)
    return geometry
  })
  const glyphGeometry = new THREE.BoxGeometry(0.018, 0.34, 0.012)
  const glyphs = Array.from({ length: 5 }, (_, index) => {
    const glyph = new THREE.Mesh(glyphGeometry, material)
    glyph.name = 'pain-packer-pressure-mark'
    glyph.position.set((index - 2) * 0.17, 1.15 + (index % 2) * 0.3, 0.4)
    glyph.rotation.z = (index - 2) * 0.08
    root.add(glyph)
    return glyph
  })
  root.visible = false
  return {
    root,
    sync(frame: number | null, reduced: boolean) {
      root.visible = frame !== null && !reduced
      if (frame === null) return 1
      const t = frame / PAIN_PACKER_ENTRY_FRAMES
      material.opacity = Math.sin(Math.PI * t) * 0.45
      root.rotation.y = t * Math.PI * 1.4
      glyphs.forEach((glyph, index) => {
        glyph.scale.y = 0.5 + Math.sin(t * Math.PI * 3 + index) * 0.3
      })
      return 1.08 - feitanEase(t) * 0.18
    },
    dispose() {
      root.removeFromParent()
      curves.forEach((geometry) => geometry.dispose())
      glyphGeometry.dispose()
      material.dispose()
    },
  }
}
