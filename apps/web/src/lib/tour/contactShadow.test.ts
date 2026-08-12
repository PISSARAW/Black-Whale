import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { ShaderMaterial } from 'three'
import { CONTACT_LIFT, CONTACT_STRENGTH, contactShadow } from './contactShadow'

describe('contact shadow', () => {
  it('multiplies the floor rather than painting over it', () => {
    const patch = contactShadow(THREE, { radius: 0.5 })
    const material = patch.material as ShaderMaterial

    // The whole argument of the module: a shadow is light not arriving, so the
    // patch is a share taken off whatever the bake put there. Painted with
    // NormalBlending it would be a grey sticker on a lit deck and invisible in
    // the hold — which is what it replaced.
    expect(material.blending).toBe(THREE.MultiplyBlending)
    expect(material.depthWrite).toBe(false)
    // Fog on a multiplier is not haze: it would pull the patch towards the air
    // colour with distance, and a multiplier above one is a highlight.
    expect(material.fog).toBe(false)
  })

  it('lies flat, clear of the deck, and behind what stands in it', () => {
    const patch = contactShadow(THREE, { radius: 0.5 })

    expect(patch.rotation.x).toBeCloseTo(-Math.PI / 2)
    expect(patch.position.y).toBe(CONTACT_LIFT)
    expect(patch.renderOrder).toBeLessThan(0)
  })

  it('is an ellipse: as wide as asked, and shorter', () => {
    const patch = contactShadow(THREE, { radius: 0.8, squash: 0.4 })

    expect(patch.scale.x).toBeCloseTo(0.8)
    expect(patch.scale.y).toBeCloseTo(0.32)
  })

  it('shares one disc and one material per strength', () => {
    const one = contactShadow(THREE, { radius: 0.4 })
    const two = contactShadow(THREE, { radius: 1.2 })
    const weaker = contactShadow(THREE, { radius: 0.4, strength: 0.2 })

    // A promenade of forty people is one upload: the size is a scale, not a
    // second geometry, and the strength is the only thing that forks a material.
    expect(two.geometry).toBe(one.geometry)
    expect(two.material).toBe(one.material)
    expect(weaker.material).not.toBe(one.material)
    expect((one.material as ShaderMaterial).uniforms.uStrength.value).toBe(CONTACT_STRENGTH)
    expect((weaker.material as ShaderMaterial).uniforms.uStrength.value).toBe(0.2)
  })
})
