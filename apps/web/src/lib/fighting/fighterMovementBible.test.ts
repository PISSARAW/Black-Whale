import { describe, expect, it } from 'vitest'
import { FIGHTER_MOVEMENT_BIBLE, fighterMovementBible } from './fighterMovementBible'
import { fighterMotionProfile } from './fighterMotionProfile'
import { FIGHTING_ROSTER } from './roster'

describe('fighterMovementBible', () => {
  it('covers every roster fighter with bounded presentation multipliers', () => {
    expect(Object.keys(FIGHTER_MOVEMENT_BIBLE).length).toBeGreaterThanOrEqual(FIGHTING_ROSTER.length)
    for (const fighter of FIGHTING_ROSTER) {
      const bible = fighterMovementBible(fighter.id)
      expect(bible.freeHand.length).toBeGreaterThan(8)
      expect(bible.secondary.length).toBeGreaterThan(8)
      for (const value of [
        bible.locomotion,
        bible.burst,
        bible.air,
        bible.commitment,
        bible.weight,
        bible.exaggeration,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0.8)
        expect(value).toBeLessThanOrEqual(1.22)
      }
    }
  })

  it('feeds personal intent into the presentation profile without changing frame data', () => {
    const benjamin = fighterMotionProfile('benjamin')
    const hisoka = fighterMotionProfile('hisoka')
    expect(benjamin.landing).toBeGreaterThan(hisoka.landing)
    expect(benjamin.impact).toBeGreaterThan(hisoka.impact)
    expect(hisoka.dash).toBeGreaterThan(benjamin.dash)
  })
})
