import { describe, expect, it } from 'vitest'
import { difficultyLabel, EMPTY_STATS, gradeArena, recordEvent } from './progression'

describe('Arena progression', () => {
  it('grades efficient wins above missed exchanges', () => {
    const clean = { ...EMPTY_STATS, attacks: 4, hits: 4, blocks: 2 }
    const wasteful = { ...EMPTY_STATS, attacks: 10, hits: 2 }
    expect(gradeArena(clean, true, 80)).toBe('S')
    expect(gradeArena(wasteful, false, 10)).toBe('C')
  })

  it('records only player accuracy and successful defence', () => {
    const hit = recordEvent(EMPTY_STATS, {
      at: 1,
      attacker: 'player',
      zone: 'head',
      impact: 'clean',
      points: 1,
      technique: 'hatsu',
    })
    expect(hit).toMatchObject({ attacks: 1, hits: 1, hatsu: 1 })
  })

  it('names difficulty levels in the active locale', () => {
    expect(difficultyLabel('master', 'fr')).toBe('Maître')
    expect(difficultyLabel('initiate', 'en')).toBe('Initiate')
  })
})
