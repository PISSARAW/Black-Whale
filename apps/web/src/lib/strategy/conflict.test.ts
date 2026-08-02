import { describe, expect, it } from 'vitest'
import { factionEliminated, resolveEncounter, worsenCondition } from './conflict'

describe('strategy conflicts', () => {
  it('turns wounds into eliminations', () => {
    expect(worsenCondition('READY')).toBe('WOUNDED')
    expect(worsenCondition('WOUNDED')).toBe('ELIMINATED')
  })

  it('gives a defended position the advantage', () => {
    const result = resolveEncounter({
      conditions: { player: 'READY', enemy: 'READY' },
      playerIds: ['player'],
      hostileIds: ['enemy'],
      defended: true,
      roll: 0,
    })
    expect(result.conditions.enemy).toBe('WOUNDED')
    expect(result.conditions.player).toBe('READY')
  })

  it('detects the loss of an entire faction', () => {
    expect(factionEliminated(['a', 'b'], { a: 'ELIMINATED', b: 'ELIMINATED' })).toBe(true)
  })
})
