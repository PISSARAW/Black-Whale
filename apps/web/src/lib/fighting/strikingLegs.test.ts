import { describe, expect, it } from 'vitest'
import { strikingStance } from './strikingLegs'
import { fightStance } from './fightStance'

describe('princes strike from a lunge', () => {
  it.each(['benjamin', 'tserriednich'] as const)('%s steps the lead foot forward', (id) => {
    const standing = fightStance(id)!.pose
    const striking = strikingStance(id, standing)
    // Lead hip swings further forward and the knees bend more than in the idle stance.
    expect(striking.leadHip![0]).toBeLessThan(standing.leadHip![0])
    expect(striking.leadKnee![0]).toBeGreaterThan(standing.leadKnee![0])
    expect(striking.rearHip![0]).toBeGreaterThan(standing.rearHip![0])
    // The upper body keeps the prince's own stance.
    expect(striking.chest).toEqual(standing.chest)
  })
  it('leaves every other fighter on its own stance', () => {
    const standing = fightStance('kurapika')!.pose
    expect(strikingStance('kurapika', standing)).toBe(standing)
  })
})
