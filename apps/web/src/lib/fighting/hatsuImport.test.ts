import { expect, it } from 'vitest'
import { resolveFightImpacts } from './combatImpact'
import { createFight } from './engine'
import { hatsuFor } from './hatsu/registry'
import { FIGHTING_ROSTER } from './roster'
it('keeps the Hatsu registry callable when contact resolution loads first', () => {
  expect(resolveFightImpacts).toBeTypeOf('function')
  expect(createFight).toBeTypeOf('function')
  for (const fighter of FIGHTING_ROSTER)
    expect(hatsuFor(fighter.id).onFrame, fighter.id).toBeTypeOf('function')
})
