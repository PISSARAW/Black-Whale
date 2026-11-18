import { expect, it } from 'vitest'
import { createFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { nenMasteryProfile, meetsNenTraining } from './nenMastery'
import { fightCategoryEfficiency, categoryPower } from './nenCategories'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s has evidence-qualified training without inferred affinity',
  (id) => {
    const profile = nenMasteryProfile(id)
    const fighter = createFight(id, 'hisoka').player
    expect(profile.training.enhancer.level).toBeGreaterThan(0)
    for (const [category, training] of Object.entries(profile.training)) {
      if (training.level === 2) expect(training.abilities.length).toBeGreaterThan(0)
      if (training.level === 0) expect(training.evidence).toBe('unverified')
      expect(meetsNenTraining(fighter, { category: category as 'emitter', level: 2 })).toBe(
        training.level === 2,
      )
    }
  },
)

it('does not turn Theta’s archived projectile or Emperor Time into newly learned abilities', () => {
  const theta = createFight('theta', 'kurapika').player
  expect(nenMasteryProfile('theta').abilities).toEqual([])
  expect(meetsNenTraining(theta, { category: 'emitter', level: 2 })).toBe(false)
  const kurapika = createFight('kurapika', 'hisoka').player
  const before = nenMasteryProfile('kurapika')
  const active = { ...kurapika, kurapika: { ...kurapika.kurapika!, emperorTime: true } }
  expect(fightCategoryEfficiency(active, 'emitter')).toBe(1)
  expect(nenMasteryProfile(active.id)).toEqual(before)
  expect(
    meetsNenTraining(active, { category: 'emitter', level: 2, ability: 'double-machine-gun' }),
  ).toBe(false)
  expect(categoryPower(createFight('franklin', 'hisoka').player, 'emitter')).toBe(1.2)
})
