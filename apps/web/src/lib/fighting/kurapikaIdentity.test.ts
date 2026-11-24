import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { kurapikaSpeedActive, kurapikaSpeedBodyVisible } from './kurapikaIdentity'

describe('Kurapika speed identity', () => {
  it('uses brief visual gaps without changing the ordinary dash state', () => {
    const fighter = createFightState('kurapika', 'phinks').player
    fighter.motion = {
      velocityX: 0,
      prejumpFrames: 0,
      jumpDirection: 0,
      landingFrames: 0,
      dash: { direction: 1, frame: 2, frames: 15, peak: 106 },
      heldDirection: 0,
      tapDirection: 0,
      tapWindow: 0,
    }
    expect(kurapikaSpeedActive(fighter)).toBe(true)
    expect(kurapikaSpeedBodyVisible(fighter)).toBe(false)
    fighter.motion.dash!.frame = 4
    expect(kurapikaSpeedBodyVisible(fighter)).toBe(true)
    expect(fighter.wakeupInvulnerableFrames).toBe(0)
  })
})
