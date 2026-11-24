import { describe, expect, it } from 'vitest'
import { createFight } from './engine'
import { judgmentNenContract } from './judgmentRules'
import { moonlightNenContract, MOONLIGHT_CLAUSES } from './moonlightClauses'
import { nenContractBreached, validateNenContract } from './nenContract'
import { seiyakuNenContract, type SeiyakuKind } from './seiyaku'

describe('shared Nen contracts', () => {
  it('validates every shipped Moonlight and Seiyaku definition', () => {
    for (const clause of MOONLIGHT_CLAUSES)
      expect(validateNenContract(moonlightNenContract(clause)), clause.id).toEqual([])
    for (const kind of ['speed', 'aggression', 'blind'] satisfies SeiyakuKind[])
      expect(validateNenContract(seiyakuNenContract(kind)), kind).toEqual([])
  })

  it('projects Judgment clauses into the same disclosed contract vocabulary', () => {
    const fighter = createFight('kurapika', 'hisoka').player
    fighter.judgmentDeclaration = { frame: 0, clauses: ['zetsu', 'no-troupe-contact'] }
    expect(judgmentNenContract(fighter)).toMatchObject({
      source: 'judgment',
      restrictions: ['forced-zetsu', 'no-troupe-contact'],
      penalty: 'death',
      consent: 'physical-implantation',
    })
  })

  it('uses one breach evaluator for Moonlight and the three Seiyaku families', () => {
    const fighter = createFight('longhi', 'hisoka').player
    fighter.nen = { ...fighter.nen, ken: true }
    expect(nenContractBreached(seiyakuNenContract('speed'), { fighter })).toBe(true)
    fighter.nen = { ...fighter.nen, ken: false, gyo: true }
    expect(nenContractBreached(seiyakuNenContract('blind'), { fighter })).toBe(true)
    fighter.nen = { ...fighter.nen, gyo: false }
    expect(
      nenContractBreached(seiyakuNenContract('aggression'), { fighter, retreatFrames: 11 }),
    ).toBe(true)
  })
})
