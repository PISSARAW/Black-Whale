import { describe, expect, it } from 'vitest'
import { personalityForFaction } from './tacticalAI'

describe('strategy AI personalities', () => {
  it('assigns a stable personality to every faction', () => {
    expect(personalityForFaction('faction-a')).toBe(personalityForFaction('faction-a'))
    expect(['CAUTIOUS', 'AGGRESSIVE', 'OPPORTUNIST']).toContain(personalityForFaction('faction-b'))
  })
})
