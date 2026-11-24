import { describe, expect, it } from 'vitest'
import { CANON_COMBAT_RULES, canonCombatRule } from './canonCombatRules'

const EXPECTED = [
  'rihan',
  'camilla',
  'halkenburg',
  'saiyu',
  'terebellum',
  'voconte',
  'longhi',
  'yokotani',
  'leorio',
  'bill',
  'mizaistom',
  'gel',
  'padaille',
  'beyond',
  'musse',
  'sayird',
  'zakuro',
  'bonolenov',
  'biscuit',
  'kalluto',
  'hinrigh',
  'shizuku',
  'machi',
  'phinks',
  'franklin',
  'feitan',
  'furykov',
  'lynch',
  'theta',
  'kurapika',
] as const

describe('character-specific canon combat boundaries', () => {
  it('covers every fighter in the expanded 30-character implementation plan exactly once', () => {
    expect(Object.keys(CANON_COMBAT_RULES).sort()).toEqual([...EXPECTED].sort())
    expect(new Set(Object.values(CANON_COMBAT_RULES).map((entry) => entry.fighter)).size).toBe(30)
  })

  it.each(EXPECTED)('%s declares evidence, adaptations and explicit prohibitions', (id) => {
    const entry = canonCombatRule(id)
    expect(entry.sourceChapters.length).toBeGreaterThan(0)
    expect(entry.attested.length).toBeGreaterThan(0)
    expect(entry.gameplayAdaptations.length).toBeGreaterThan(0)
    expect(entry.prohibitedExtrapolations.length).toBeGreaterThan(0)
  })
})
