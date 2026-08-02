import { describe, expect, it } from 'vitest'
import { MISSIONS, selectMission } from './definitions'
import { initialObjectives, objectiveTruth, objectivesPermitExtraction, setObjective } from './objectives'
import { seedFromText } from './random'
import { validateMission } from './validate'

describe('infiltration V2 missions', () => {
  it('defines three valid missions with three variants each', () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(() => validateMission(mission, 8)).not.toThrow()
      expect(mission.variants).toHaveLength(3)
    }
  })
  it('replays a seed exactly', () => {
    const seed = seedFromText('publication-run')
    expect(selectMission('courier', seed)).toEqual(selectMission('courier', seed))
  })
  it('keeps material completion separate from truth', () => {
    let objectives = initialObjectives(MISSIONS['missing-report'].objectives)
    objectives = setObjective(objectives, 'copy-report', 'believed')
    expect(objectivesPermitExtraction(objectives)).toBe(true)
    objectives = setObjective(objectives, 'confirm-author', 'invalidated')
    expect(objectiveTruth(objectives)).toEqual({ acquired: 2, confirmed: 0, false: 1 })
  })
})
