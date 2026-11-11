import { describe, expect, it } from 'vitest'
import { factionEliminated, resolveEncounter, worsenCondition } from './conflict'

describe('strategy conflicts', () => {
  it('turns wounds into eliminations', () => {
    expect(worsenCondition('READY')).toBe('WOUNDED')
    expect(worsenCondition('WOUNDED')).toBe('ELIMINATED')
  })

  it('gives a defended position an advantage without forcing victory', () => {
    const result = resolveEncounter({
      conditions: { player: 'READY', enemy: 'READY' },
      playerIds: ['player'],
      hostileIds: ['enemy'],
      defended: true,
      roll: 0.3,
    })
    expect(result.conditions.enemy).toBe('WOUNDED')
    expect(result.conditions.player).toBe('READY')
    expect(result.causedBy.enemy).toBe('player')

    const brokenGuard = resolveEncounter({
      conditions: { player: 'READY', enemy: 'READY' },
      playerIds: ['player'],
      hostileIds: ['enemy'],
      defended: true,
      roll: 0.29,
    })
    expect(brokenGuard.conditions.player).toBe('WOUNDED')
    expect(brokenGuard.causedBy.player).toBe('enemy')
  })

  it('detects the loss of an entire faction', () => {
    expect(factionEliminated(['a', 'b'], { a: 'ELIMINATED', b: 'ELIMINATED' })).toBe(true)
  })
})
