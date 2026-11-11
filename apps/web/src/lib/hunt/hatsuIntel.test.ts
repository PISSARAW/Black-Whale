import { describe, expect, it } from 'vitest'
import { initialHatsuIntel, recordHatsuEvidence, type HatsuEvidence } from './hatsuIntel'

const clue = (kind: HatsuEvidence['kind'], confidence = 1): HatsuEvidence => ({
  kind,
  source: 'observed',
  observedAt: 10,
  confidence,
})

describe('unknown Hatsu identification', () => {
  it('does not narrow hypotheses from weak testimony', () => {
    const weak = recordHatsuEvidence(initialHatsuIntel(), clue('spatial-disappearance', 0.4))
    expect(weak.candidates).toHaveLength(4)
    expect(weak.confirmedAbilityId).toBeNull()
  })

  it('requires the whole signature before exposing a countermeasure', () => {
    const first = recordHatsuEvidence(initialHatsuIntel(), clue('spatial-disappearance'))
    expect(first.confirmedAbilityId).toBe('luini-spatial-teleportation')
    expect(first.countermeasures).toEqual([])
    const second = recordHatsuEvidence(first, clue('reused-location'))
    expect(second.countermeasures).toEqual(['invalidate-visited-anchor'])
  })

  it('keeps module-backed identity for every hypothesis', () => {
    expect(initialHatsuIntel().candidates.map((candidate) => candidate.abilityId)).toEqual([
      'luini-spatial-teleportation',
      'cats-name',
      'silent-majority',
      'surveillance-paper-dolls',
    ])
  })
})
