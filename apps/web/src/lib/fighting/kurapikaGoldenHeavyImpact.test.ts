import { describe, expect, it } from 'vitest'
import {
  isKurapikaGoldenHeavy,
  kurapikaGoldenHeavyAudioAccent,
  kurapikaGoldenHeavyImpact,
} from './kurapikaGoldenHeavyImpact'

const base = {
  sparks: 14,
  sparkSpeed: 0.022,
  sparkSize: 1.05,
  shakeMs: 155,
  shakeX: 0.04,
  shakeY: 0.028,
}

describe('Kurapika golden heavy impact', () => {
  it('concentrates the hit in a short horizontal body-blow accent', () => {
    const hit = kurapikaGoldenHeavyImpact(base, false)
    expect(hit.shakeX).toBeGreaterThan(base.shakeX)
    expect(hit.shakeY).toBeLessThan(base.shakeY)
    expect(hit.shakeMs).toBeLessThan(base.shakeMs)
    expect(hit.shakeX / hit.shakeY).toBeGreaterThan(base.shakeX / base.shakeY)
  })

  it('makes a block shorter, duller and quieter than a clean hit', () => {
    const hit = kurapikaGoldenHeavyImpact(base, false)
    const block = kurapikaGoldenHeavyImpact(base, true)
    const hitAudio = kurapikaGoldenHeavyAudioAccent(false)
    const blockAudio = kurapikaGoldenHeavyAudioAccent(true)
    expect(block.sparkSize).toBeLessThan(hit.sparkSize)
    expect(block.shakeMs).toBeLessThan(hit.shakeMs)
    expect(blockAudio.thumpPeak).toBeLessThan(hitAudio.thumpPeak)
    expect(blockAudio.duration).toBeLessThan(hitAudio.duration)
  })

  it('only activates for the contracted move id', () => {
    expect(isKurapikaGoldenHeavy('kurapika:standingHeavy')).toBe(true)
    expect(isKurapikaGoldenHeavy('kurapika:crouchingHeavy')).toBe(false)
    expect(isKurapikaGoldenHeavy()).toBe(false)
  })
})
