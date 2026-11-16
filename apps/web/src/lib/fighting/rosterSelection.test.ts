import { describe, expect, it } from 'vitest'
import { FIGHTING_ROSTER } from './roster'
import { groupedFightingRoster, randomDuel, randomFighter, ROSTER_GROUPS } from './rosterSelection'

describe('fighting roster selection', () => {
  it('places every playable fighter in exactly one labelled group', () => {
    const groups = groupedFightingRoster(FIGHTING_ROSTER)
    const ids = groups.flatMap(({ fighters }) => fighters.map(({ id }) => id))

    expect(groups.map(({ id }) => id)).toEqual(ROSTER_GROUPS.map(({ id }) => id))
    expect(ids).toHaveLength(FIGHTING_ROSTER.length)
    expect(new Set(ids).size).toBe(FIGHTING_ROSTER.length)
    expect(
      groups.every(({ fighters }) => fighters.every(({ affiliationFr }) => affiliationFr)),
    ).toBe(true)
  })

  it('draws two different fighters for a random duel', () => {
    expect(randomDuel(FIGHTING_ROSTER, () => 0)).toEqual(['kurapika', 'hisoka'])
    const [player, opponent] = randomDuel(FIGHTING_ROSTER, () => 0.999)
    expect(player).not.toBe(opponent)
  })

  it('excludes the other slot from an individual random draw', () => {
    expect(randomFighter(FIGHTING_ROSTER, 'kurapika', () => 0)).toBe('hisoka')
  })
})
