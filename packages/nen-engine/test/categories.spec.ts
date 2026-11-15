import { describe, expect, it } from 'vitest'
import {
  categoryEfficiency,
  categoryProximity,
  resolveNenCategoryAction,
  type NenCategoryProfile,
} from '../src/categories'

const profile: NenCategoryProfile = {
  naturalAffinity: 'enhancer',
  mastery: {
    enhancer: 100,
    emitter: 50,
    transmuter: 50,
    conjurer: 50,
    manipulator: 50,
    specialist: 50,
  },
  learnedAbilities: ['remote-pulse'],
}

describe('Nen category resolver', () => {
  it('follows the hexagon without inventing abilities', () => {
    expect(categoryProximity('enhancer', 'enhancer')).toBe(1)
    expect(categoryProximity('enhancer', 'emitter')).toBe(0.8)
    expect(categoryProximity('enhancer', 'specialist')).toBe(0.4)
    expect(categoryEfficiency(profile, 'emitter')).toBeCloseTo(0.4)
  })

  it('uses one declared modulator and keeps preview deterministic', () => {
    const resolution = resolveNenCategoryAction(
      profile,
      {
        id: 'pulse-panel',
        abilityId: 'remote-pulse',
        category: 'emitter',
        modulates: 'range',
        baseCost: 12,
        basePower: 2,
        baseRange: 10,
        baseDuration: 1,
        requiresTargetKinds: ['device'],
      },
      { aura: 20, inZetsu: false, distance: 3, targetKind: 'device' },
    )

    expect(resolution).toMatchObject({
      accepted: true,
      efficiency: 0.4,
      cost: 12,
      power: 2,
      range: 4,
      duration: 1,
    })
  })

  it('reports stable refusal reasons', () => {
    const action = {
      id: 'unknown-action',
      abilityId: 'not-learned',
      category: 'enhancer' as const,
      modulates: 'power' as const,
      baseCost: 5,
    }
    expect(resolveNenCategoryAction(profile, action, { aura: 100, inZetsu: false }).reason).toBe(
      'ABILITY_NOT_LEARNED',
    )
  })
})
