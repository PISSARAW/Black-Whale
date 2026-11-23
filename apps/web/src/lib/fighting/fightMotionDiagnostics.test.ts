import { describe, expect, it } from 'vitest'
import {
  goldenHeavyDiagnosticFailures,
  goldenHeavyDiagnostics,
  type FightMotionSnapshot,
} from './fightMotionDiagnostics'

const stance: FightMotionSnapshot = {
  feet: [
    [-0.2, 0, 0],
    [0.2, 0, 0],
  ],
  pelvis: [0, 1, 0],
  leadHand: [0.2, 1.5, 0],
  rearHand: [-0.2, 1.4, 0],
}

describe('golden heavy motion diagnostics', () => {
  it('measures the planted foot, pivot, pelvis and authored fist target', () => {
    const contact: FightMotionSnapshot = { ...stance, rearHand: [0.4, 1.1, 0.1] }
    const current: FightMotionSnapshot = {
      ...contact,
      feet: [
        [-0.18, 0, 0.03],
        [0.202, 0, 0.001],
      ],
      pelvis: [0.08, 0.96, 0.04],
    }
    const value = goldenHeavyDiagnostics(current, stance, contact, 1)
    expect(value.plantedFootDrift).toBeCloseTo(Math.hypot(0.002, 0.001))
    expect(value.pivotFootDrift).toBeCloseTo(Math.hypot(0.02, 0.03))
    expect(value.pelvisTravel).toBeCloseTo(Math.hypot(0.08, 0.04, 0.04))
    expect(value.fistToContact).toBe(0)
    expect(goldenHeavyDiagnosticFailures(value)).toEqual([])
  })

  it('names objective failures instead of relying on visual judgement', () => {
    const contact = { ...stance, rearHand: [0.4, 1.1, 0.1] as const }
    const current = {
      ...stance,
      feet: [
        [-0.3, 0, 0],
        [0.3, 0, 0],
      ] as const,
    }
    expect(
      goldenHeavyDiagnosticFailures(goldenHeavyDiagnostics(current, stance, contact, 1)),
    ).toEqual(['planted-foot-drift', 'pivot-foot-translation', 'fist-off-contact'])
  })
})
