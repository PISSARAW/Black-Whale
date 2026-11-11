import { describe, expect, it } from 'vitest'
import { MISSIONS, selectMission } from './definitions'
import {
  completeObjective,
  initialObjectives,
  objectiveTruth,
  objectivesPermitExtraction,
  setObjective,
} from './objectives'
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
  it('lets the copy and verify actions open extraction in every mission', () => {
    for (const mission of Object.values(MISSIONS)) {
      let objectives = initialObjectives(mission.objectives)
      objectives = completeObjective(objectives, ['copy', 'plant', 'follow'], 'believed')
      objectives = completeObjective(objectives, ['identify'], 'confirmed')
      expect(objectivesPermitExtraction(objectives), mission.id).toBe(true)
    }
  })

  it('never lets an optional duty take the place of the required one', () => {
    const objectives = completeObjective(
      initialObjectives(MISSIONS['compromised-shift'].objectives),
      ['copy', 'plant', 'follow'],
      'believed',
    )
    expect(objectives.find((item) => item.id === 'replace-register')?.state).toBe('believed')
    expect(objectives.find((item) => item.id === 'perform-duty')?.state).toBe('unknown')
  })
})
