import { describe, expect, it } from 'vitest'
import { createFight } from '../engine'
import { nenPsychologyOf } from '../nenPsychology'
import { emptyCareer, type CareerMatch, type CareerProfile } from './types'
import { applyCareerMorale, careerMoraleFor, careerMoraleLabel } from './morale'

function match(
  id: string,
  winner: 'player' | 'opponent',
  rounds: CareerMatch['rounds'],
  player: CareerMatch['player'] = 'kurapika',
  at = 100,
): CareerMatch {
  return {
    id,
    at,
    source: 'versus-ai',
    player,
    opponent: 'hisoka',
    stage: 'whale-hold',
    format: 'knockout',
    winner,
    rounds,
    ruleset: 'test',
    practice: {
      frames: 600,
      player: { bestCombo: 1, bestComboDamage: 10, healthLost: 30 },
      opponent: { bestCombo: 1, bestComboDamage: 10, healthLost: 30 },
    },
  }
}

function profile(...history: CareerMatch[]): CareerProfile {
  return { ...emptyCareer(), history }
}

describe('career morale between matches', () => {
  it('carries apprehension after a severe loss and resolve after a clear win', () => {
    const base = createFight('kurapika', 'hisoka', { mode: 'versus-ai' })
    const initial = nenPsychologyOf(base.player)
    const apprehensive = applyCareerMorale(
      base,
      profile(match('loss', 'opponent', { player: 0, opponent: 2 })),
    )
    expect(apprehensive.careerMorale).toEqual({
      kind: 'apprehension',
      sourceMatchId: 'loss',
    })
    expect(nenPsychologyOf(apprehensive.player).apprehension).toBe(initial.apprehension + 1_800)

    const resolved = applyCareerMorale(
      base,
      profile(match('win', 'player', { player: 2, opponent: 0 })),
    )
    expect(resolved.careerMorale?.kind).toBe('resolve')
    expect(nenPsychologyOf(resolved.player).resolve).toBe(Math.min(10_000, initial.resolve + 1_800))
  })

  it('uses the latest result for that fighter and ignores close results, training and other fighters', () => {
    const history = profile(
      match('other', 'opponent', { player: 0, opponent: 2 }, 'hisoka', 300),
      match('close', 'player', { player: 2, opponent: 1 }, 'kurapika', 200),
      match('old', 'opponent', { player: 0, opponent: 2 }, 'kurapika', 100),
    )
    expect(careerMoraleFor(history, 'kurapika')).toBeNull()
    expect(
      applyCareerMorale(createFight('kurapika', 'hisoka', { mode: 'training' }), history),
    ).not.toHaveProperty('careerMorale')
  })

  it('applies a decisive result to one subsequent career match only', () => {
    const decisive = match('loss', 'opponent', { player: 0, opponent: 2 })
    expect(careerMoraleFor(profile(decisive), 'kurapika')?.kind).toBe('apprehension')
    expect(
      careerMoraleFor({ ...profile(decisive), moraleSeen: [decisive.id] }, 'kurapika'),
    ).toBeNull()
  })

  it('provides bilingual opening labels', () => {
    const morale = { kind: 'apprehension', sourceMatchId: 'loss' } as const
    expect(careerMoraleLabel(morale, 'fr')).toContain('appréhension')
    expect(careerMoraleLabel(morale, 'en')).toContain('apprehension')
  })
})
