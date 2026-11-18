import { expect, it } from 'vitest'
import { createFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { nenOperationCategory, nenOperationPower, nenTransmissionLifetime } from './nenOperations'
import { fightAbility } from './nenAbility'
import { categoryPower } from './nenCategories'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s resolves mechanisms without altering conditions or identity',
  (id) => {
    const fighter = createFight(id, 'hisoka').player
    const before = structuredClone(fighter),
      ability = fightAbility(fighter)
    for (const operation of [
      'impact',
      'projection',
      'construction',
      'property',
      'control',
      'healing',
    ] as const)
      expect(Number.isFinite(nenOperationPower(fighter, { ability, operation }))).toBe(true)
    expect(fighter).toEqual(before)
  },
)

it('separates elastic property, detached transmission, healing and imposed control', () => {
  const kurapika = createFight('kurapika', 'hisoka').player
  expect(nenOperationCategory('bungee-gum', 'property')).toBe('transmuter')
  expect(nenOperationCategory('holy-chain', 'healing')).toBe('enhancer')
  expect(nenOperationCategory('judgment-chain', 'control')).toBe('manipulator')
  expect(nenOperationPower(kurapika, { ability: 'holy-chain', operation: 'healing' })).toBe(
    categoryPower(kurapika, 'enhancer'),
  )
  expect(nenTransmissionLifetime(kurapika, { ability: 'judgment-chain', lifetime: 100 })).toBe(78)
  expect(
    nenTransmissionLifetime(kurapika, { ability: 'battle-cantabile-jupiter', lifetime: 100 }),
  ).toBe(100)
  expect(nenOperationCategory('illumi-needle-people', 'impact')).toBeNull()
  expect(nenOperationCategory('parallel-future', 'impact')).toBeNull()
})
