import { describe, expect, it } from 'vitest'
import { fittedMapTransform } from './mapViewport'

describe('fittedMapTransform', () => {
  it('centres a small deck and fits its hull instead of its empty SVG margins', () => {
    const viewport = { width: 1200, height: 600 }
    const drawing = { x: 326, y: 211, width: 524, height: 274 }
    const transform = fittedMapTransform({
      viewport,
      viewBox: { x: 0, y: 0, width: 1000, height: 600 },
      drawing,
    })
    expect(transform.scale).toBeGreaterThan(1)
    expect((drawing.x + drawing.width / 2 + 100) * transform.scale + transform.x).toBeCloseTo(600)
    expect((drawing.y + drawing.height / 2) * transform.scale + transform.y).toBeCloseTo(300)
    expect(drawing.height * transform.scale).toBeCloseTo(viewport.height * 0.88)
  })

  it('preserves the SVG letterboxing on a phone', () => {
    const drawing = { x: 100, y: 100, width: 800, height: 400 }
    const transform = fittedMapTransform({
      viewport: { width: 360, height: 480 },
      viewBox: { x: 0, y: 0, width: 1000, height: 600 },
      drawing,
    })
    expect(180 * transform.scale + transform.x).toBeCloseTo(180)
    expect(240 * transform.scale + transform.y).toBeCloseTo(240)
    expect(drawing.width * 0.36 * transform.scale).toBeCloseTo(360 * 0.88)
  })

  it('handles a hidden or not yet sized viewport', () => {
    expect(
      fittedMapTransform({
        viewport: { width: 0, height: 0 },
        viewBox: { x: 0, y: 0, width: 1000, height: 600 },
        drawing: { x: 0, y: 0, width: 0, height: 0 },
      }),
    ).toEqual({ x: 0, y: 0, scale: 1 })
  })
})
