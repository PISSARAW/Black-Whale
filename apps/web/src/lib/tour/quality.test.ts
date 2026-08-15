import { describe, expect, it } from 'vitest'
import { detectTier, qualityProfile, resolveTier } from './quality'

describe('detecting the palier', () => {
  it('puts a coarse pointer on the light palier whatever its GPU says', () => {
    expect(detectTier({ renderer: 'NVIDIA GeForce RTX 4090', coarse: true })).toBe('low')
  })

  it('reads the integrated families off the driver string, case-blind', () => {
    for (const name of ['Mali-G78', 'Adreno (TM) 650', 'Intel(R) UHD Graphics 630', 'PowerVR']) {
      expect(detectTier({ renderer: name, coarse: false })).toBe('low')
    }
  })

  it('assumes the full palier for a discrete card', () => {
    expect(detectTier({ renderer: 'ANGLE (NVIDIA GeForce RTX 3070)', coarse: false })).toBe('high')
  })

  it('assumes the full palier when the browser masks the driver string', () => {
    // `WEBGL_debug_renderer_info` is absent in privacy-hardened browsers. The
    // wrong guess there is the cheap one: the visitor can overrule it, and
    // guessing `low` would quietly hand every hardened browser a lesser ship.
    expect(detectTier({ renderer: null, coarse: false })).toBe('high')
    expect(detectTier({ renderer: '', coarse: false })).toBe('high')
  })
})

describe('the visitor overruling the detection', () => {
  it('defers to the detection on auto', () => {
    expect(resolveTier('auto', 'low')).toBe('low')
    expect(resolveTier('auto', 'high')).toBe('high')
  })

  it('lets the visitor win in both directions', () => {
    expect(resolveTier('high', 'low')).toBe('high')
    expect(resolveTier('low', 'high')).toBe('low')
  })
})

describe('what a palier switches on', () => {
  it('turns off everything that costs a second pass over the frame, on low', () => {
    const light = qualityProfile({ tier: 'low', coarse: true })
    expect(light.bloom).toBe(false)
    expect(light.godRays).toBe(false)
    expect(light.auraDistortion).toBe(false)
    expect(light.surfaceDetail).toBe(false)
  })

  it('keeps the grade on both paliers: it is one multiply-add', () => {
    expect(qualityProfile({ tier: 'low', coarse: true }).grade).toBe(true)
    expect(qualityProfile({ tier: 'high', coarse: false }).grade).toBe(true)
  })

  it('keeps the depth-of-field pass off until native depth sampling is portable', () => {
    // Chrome/ANGLE can compile the Bokeh shader successfully and still return
    // a completely black frame, so capability detection cannot recover here.
    expect(qualityProfile({ tier: 'low', coarse: false }).dof).toBe(false)
    expect(qualityProfile({ tier: 'high', coarse: false }).dof).toBe(false)
  })

  it('thins the dust on low without putting it out', () => {
    // The dust is what makes a six-thousand-square-metre hall read as a volume,
    // and the small screen is the one that needs that most.
    const share = qualityProfile({ tier: 'low', coarse: true }).dustScale
    expect(share).toBeGreaterThan(0)
    expect(share).toBeLessThan(1)
  })

  it('keys the anti-aliasing on the pointer, not on the palier', () => {
    // The composer renders offscreen, so the canvas `antialias` never reaches
    // the screen: a `low` desktop needs SMAA exactly as much as a `high` one,
    // and a phone is the only machine that should go without.
    expect(qualityProfile({ tier: 'low', coarse: false }).smaa).toBe(true)
    expect(qualityProfile({ tier: 'high', coarse: true }).smaa).toBe(false)
  })

  it('keeps temporal accumulation off because it can alternate with black frames', () => {
    expect(qualityProfile({ tier: 'low', coarse: false }).taa).toBe(false)
    expect(qualityProfile({ tier: 'high', coarse: false }).taa).toBe(false)
  })

  it('keeps camera motion blur off so walking remains readable', () => {
    expect(qualityProfile({ tier: 'low', coarse: false }).motionBlur).toBe(false)
    expect(qualityProfile({ tier: 'high', coarse: false }).motionBlur).toBe(false)
  })

  it('keeps global screen-space reflections off', () => {
    expect(qualityProfile({ tier: 'low', coarse: false }).ssr).toBe(false)
    expect(qualityProfile({ tier: 'high', coarse: false }).ssr).toBe(false)
  })
})
