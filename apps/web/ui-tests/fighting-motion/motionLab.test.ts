import { describe, expect, it } from 'vitest'
import { clampMotionFrame, phaseAtFrame, representativeFrame, totalMoveFrames } from './motionLab'

const frames = { startup: 6, active: 3, recovery: 12, hitstun: 0, blockstun: 0, hitstop: 0 }

describe('motion lab timeline', () => {
  it('maps every frame to the authored combat phase', () => {
    expect(totalMoveFrames(frames)).toBe(21)
    expect(phaseAtFrame(0, frames)).toBe('startup')
    expect(phaseAtFrame(6, frames)).toBe('active')
    expect(phaseAtFrame(9, frames)).toBe('recovery')
  })

  it('keeps scrubbing inside the move and exposes stable review frames', () => {
    expect(clampMotionFrame(-4, frames)).toBe(0)
    expect(clampMotionFrame(99, frames)).toBe(20)
    expect(representativeFrame('startup', frames)).toBe(3)
    expect(representativeFrame('active', frames)).toBe(6)
    expect(representativeFrame('recovery', frames)).toBe(14)
  })
})
