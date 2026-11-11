import { describe, expect, it } from 'vitest'
import { MISSIONS, selectMission } from './definitions'
import {
  completeObjective,
  initialObjectives,
  objectiveTruth,
  objectivesPermitExtraction,
  setObjective,
  nextObjectiveAction,
} from './objectives'
import { seedFromText } from './random'
import { validateMission } from './validate'
import { groundForMission } from './setup'

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
  it('places missions on their declared ship terrain', () => {
    const report = groundForMission(selectMission('missing-report', 1))
    const courier = groundForMission(selectMission('courier', 1))
    expect(report.arena.id).toBe('tserriednich')
    expect(courier.arena.id).toBe('tubeppa')
    expect(courier.graph.nodes.length).toBeGreaterThan(0)
  })
  it('keeps material completion separate from truth', () => {
    let objectives = initialObjectives(MISSIONS['missing-report'].objectives)
    objectives = setObjective(objectives, 'copy-report', 'believed')
    expect(objectivesPermitExtraction(objectives)).toBe(true)
    objectives = setObjective(objectives, 'confirm-author', 'invalidated')
    expect(objectiveTruth(objectives)).toEqual({ acquired: 2, confirmed: 0, false: 1 })
  })
  it('gives every mission its own objective actions', () => {
    for (const mission of Object.values(MISSIONS)) {
      let objectives = initialObjectives(mission.objectives)
      while (nextObjectiveAction(objectives)) {
        const action = nextObjectiveAction(objectives)!
        const kind = {
          COPY: 'copy',
          VERIFY: 'identify',
          FOLLOW: 'follow',
          PLANT: 'plant',
          ESCORT: 'escort',
          PERFORM_DUTY: 'duty',
        }[action] as (typeof objectives)[number]['kind']
        objectives = completeObjective(objectives, [kind], 'confirmed')
      }
      expect(objectivesPermitExtraction(objectives), mission.id).toBe(true)
    }
  })

  it('never lets an optional duty take the place of the required one', () => {
    const objectives = completeObjective(
      initialObjectives(MISSIONS['compromised-shift'].objectives),
      ['copy'],
      'believed',
    )
    expect(objectives.find((item) => item.id === 'replace-register')?.state).toBe('believed')
    expect(objectives.find((item) => item.id === 'perform-duty')?.state).toBe('unknown')
  })
})
