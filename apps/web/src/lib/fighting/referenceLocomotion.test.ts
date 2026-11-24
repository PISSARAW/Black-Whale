import { describe, expect, it } from 'vitest'
import { BENJAMIN_WALK_STYLE, benjaminDashPoses } from './benjaminLocomotion'
import { CHROLLO_WALK_STYLE, chrolloDashPoses } from './chrolloLocomotion'
import { HISOKA_WALK_STYLE, hisokaDashPoses } from './hisokaLocomotion'
import { KURAPIKA_1999_GUARD, KURAPIKA_WALK_STYLE, kurapikaDashPoses } from './kurapikaLocomotion'

describe('reference character locomotion', () => {
  it('gives every reference fighter a complete authored three-beat dash', () => {
    for (const poses of [
      kurapikaDashPoses(true),
      hisokaDashPoses(true),
      chrolloDashPoses(true),
      benjaminDashPoses(true),
    ]) {
      expect(poses).toHaveLength(3)
      expect(poses[0].root?.[1]).toBeLessThan(0)
      expect(poses[1].root?.[2]).toBeGreaterThan(0)
    }
  })

  it('keeps four distinct silhouettes and uses the extended rig in the new slices', () => {
    const styles = [KURAPIKA_WALK_STYLE, HISOKA_WALK_STYLE, CHROLLO_WALK_STYLE, BENJAMIN_WALK_STYLE]
    expect(new Set(styles.map((style) => JSON.stringify(style.advance))).size).toBe(4)
    expect(KURAPIKA_WALK_STYLE.advance.leadPalm).toBeDefined()
    expect(BENJAMIN_WALK_STYLE.advance.leadClavicle).toBeDefined()
    expect(benjaminDashPoses(false)[1].root?.[2]).toBeLessThan(0)
    expect(kurapikaDashPoses(false)[1].root?.[2]).toBeLessThan(0)
  })

  it('adds the 1999 high guard, corkscrew retreat and one-knee ground skim', () => {
    const retreat = kurapikaDashPoses(false)
    expect(KURAPIKA_1999_GUARD.leadShoulder?.[2]).toBeGreaterThan(0.2)
    expect(KURAPIKA_1999_GUARD.rearElbow?.[0]).toBeGreaterThan(0)
    expect(Math.abs(retreat[1].body?.[0] ?? 0)).toBeGreaterThan(0.9)
    expect(retreat[1].leadKnee?.[0]).toBeGreaterThan(1)
    expect(retreat[2].root?.[1]).toBeLessThan(-0.08)
    expect(retreat[2].leadKnee?.[0]).toBeGreaterThan(1.3)
  })
})
