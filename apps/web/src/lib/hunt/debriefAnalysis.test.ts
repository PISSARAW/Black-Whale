import { describe, expect, it } from 'vitest'
import { explainRun } from './debriefAnalysis'
import type { HuntRunMetrics } from './metrics'

const baseline: HuntRunMetrics = {
  schemaVersion: 1,
  duration: 100,
  outcome: 'caught',
  enSweeps: 0,
  hatsuUses: 0,
  entravesLaid: 0,
  entravesSprung: 0,
  inspections: 0,
  falseTrails: 0,
  roomsVisited: 2,
  playerAuraSpent: 0,
  hunterAuraSpent: 0,
  auraRecovered: 0,
  timeInZetsu: 0,
}

describe('run explanation', () => {
  it('calls out preparation, information and misdirection', () => {
    expect(
      explainRun({
        ...baseline,
        enSweeps: 1,
        hatsuUses: 1,
        entravesLaid: 2,
        falseTrails: 1,
        playerAuraSpent: 40,
        hunterAuraSpent: 55,
      }),
    ).toEqual(['prepared', 'informed', 'misdirected', 'conserved'])
  })

  it('identifies a contact reached without preparation', () => {
    expect(explainRun(baseline)).toContain('unprepared')
  })
})
