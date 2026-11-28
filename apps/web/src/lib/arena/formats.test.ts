import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/reducer'
import { ARENA_FORMATS, formatOutcome } from './formats'
import { ARENA_TERRAINS, WAREHOUSE_SECTOR_ID, buildCombatTerrain } from './terrain'

describe('Arena V3 terrains and formats', () => {
  it('derives tactically identified arenas from the ship plans and panels', () => {
    expect(ARENA_TERRAINS.map(({ tacticalRole }) => tacticalRole)).toContain('open')
    for (const entry of ARENA_TERRAINS)
      expect(buildCombatTerrain(entry.id).space.provenance).toBe(
        entry.id === WAREHOUSE_SECTOR_ID ? 'plan' : 'panel',
      )
  })

  it('supports score, timed and mastery-gated formats', () => {
    const state = initialCombatState()
    state.player.score = 1
    expect(
      formatOutcome(
        ARENA_FORMATS.find(({ id }) => id === 'sudden-death')!,
        state,
      ),
    ).toBe('won')
    expect(
      formatOutcome(
        ARENA_FORMATS.find(({ id }) => id === 'forced-mastery')!,
        { ...state, player: { ...state.player, score: 3 } },
        false,
      ),
    ).toBe('playing')
    expect(
      formatOutcome(
        ARENA_FORMATS.find(({ id }) => id === 'forced-mastery')!,
        { ...state, player: { ...state.player, score: 3 } },
        true,
      ),
    ).toBe('won')
  })
})
