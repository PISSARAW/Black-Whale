import { describe, expect, it } from 'vitest'
import { addCareerMatch } from './totals'
import { emptyCareer, type CareerMatch } from './types'

function match(id: string): CareerMatch {
  return {
    id,
    at: Number(id),
    source: 'versus-ai',
    player: 'kurapika',
    opponent: 'hisoka',
    stage: 'whale-hold',
    format: 'knockout',
    winner: 'player',
    rounds: { player: 2, opponent: 0 },
    practice: {
      frames: 60,
      player: { bestCombo: 1, bestComboDamage: 10, healthLost: 0 },
      opponent: { bestCombo: 0, bestComboDamage: 0, healthLost: 300 },
    },
    ruleset: 'test',
    intel: {
      auraObserved: true,
      kameoRevealed: false,
      revealedConditions: ['seiyaku'],
    },
  }
}

describe('persistent opponent knowledge', () => {
  it('keeps only observed facts and raises confidence across distinct matches', () => {
    let profile = emptyCareer()
    for (const id of ['1', '2', '3']) profile = addCareerMatch(profile, match(id))
    expect(profile.opponentKnowledge.hisoka?.entries).toEqual([
      expect.objectContaining({ fact: 'aura', observations: 3, confidence: 'established' }),
      expect.objectContaining({
        fact: 'condition:seiyaku',
        observations: 3,
        confidence: 'established',
      }),
    ])
    // Knowledge remains descriptive: ordinary career scoring is unchanged.
    expect(profile.totals.kurapika?.points).toBe(96)
  })

  it('does not invent knowledge when a completed match exposed nothing', () => {
    const hidden = { ...match('1'), intel: undefined }
    expect(addCareerMatch(emptyCareer(), hidden).opponentKnowledge).toEqual({})
  })
})
