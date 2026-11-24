import { describe, expect, it } from 'vitest'
import { createHisokaMachiDemo } from './demo'

describe('Hisoka versus Machi video choreography', () => {
  it('executes every correction shown by the final render', () => {
    const demo = createHisokaMachiDemo()
    for (let frame = 0; frame < 1440; frame++) demo.advance()
    expect(demo.diagnostics()).toMatchObject({
      frame: 1440,
      gumAttached: true,
      gumPulled: true,
      gumRebounded: true,
    })
    const audit = demo.diagnostics()
    expect(audit.cardThrows).toBeGreaterThanOrEqual(1)
    expect(audit.hits).toBeGreaterThanOrEqual(3)
    expect(audit.gumFrames).toBeGreaterThanOrEqual(20)
    expect(audit.textureFrames).toBeGreaterThanOrEqual(30)
    expect(audit.dashFrames).toBeGreaterThan(0)
  })
})
