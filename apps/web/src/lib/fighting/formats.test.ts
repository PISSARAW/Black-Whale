import { describe, expect, it } from 'vitest'
import { createFight } from './engine'
import { FIGHT_FORMATS, fightFormat } from './formats'

describe('2D fight formats', () => {
  it('keeps Tour judging separate from health-based duels', () => {
    expect(FIGHT_FORMATS.map(({ victory }) => victory)).toEqual(['points', 'health', 'health'])
    expect(fightFormat('heavens-arena').hitTarget).toBe(10)
    expect(fightFormat('heavens-arena').knockdownTarget).toBe(3)
    expect(fightFormat('knockout').hitTarget).toBeNull()
  })

  it('uses each format duration in the initial deterministic state', () => {
    expect(createFight('kurapika', 'hisoka', 'heavens-arena').time).toBe(180)
    expect(createFight('kurapika', 'hisoka', 'knockout').time).toBe(120)
  })
})
