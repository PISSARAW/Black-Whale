import { describe, expect, it } from 'vitest'
import { V3_OPPONENTS } from './adaptation'
import { ARENA_CAMPAIGN } from './campaign'
import { ARENA_CHALLENGES } from './challenges/catalogue'
import { ARENA_FORMATS } from './formats'
import { NEN_MASTERIES } from './profile'
import { ARENA_TERRAINS } from './terrain'

describe('Arena V3 release acceptance', () => {
  it('keeps every campaign reference executable', () => {
    const challenges = new Set(ARENA_CHALLENGES.map(({ id }) => id))
    const terrains = new Set(ARENA_TERRAINS.map(({ id }) => id))
    for (const mission of ARENA_CAMPAIGN) {
      expect(challenges.has(mission.challengeId)).toBe(true)
      expect(terrains.has(mission.terrainId)).toBe(true)
    }
  })

  it('ships the complete V3 content envelope', () => {
    expect(NEN_MASTERIES).toHaveLength(9)
    expect(ARENA_CAMPAIGN).toHaveLength(5)
    expect(V3_OPPONENTS.length).toBeGreaterThanOrEqual(5)
    expect(ARENA_FORMATS).toHaveLength(4)
    expect(ARENA_TERRAINS).toHaveLength(4)
  })
})
