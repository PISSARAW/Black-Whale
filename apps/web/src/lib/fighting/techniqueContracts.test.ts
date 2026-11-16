import { describe, expect, it } from 'vitest'
import { createFight } from './engine'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { canonicalTechniqueAllowed, techniqueContract } from './techniqueContracts'

describe('canonical technique contracts', () => {
  it('keeps canon separate from competitive tuning', () => {
    const move = moveForSlot('hisoka', 'neutralSpecial')!
    expect(techniqueContract(move)).toMatchObject({
      evidence: 'manga-shown',
      narrativeEffect: expect.stringContaining('rubber and gum'),
    })
    expect(move.tuning).toMatchObject({ startup: expect.any(Number), damage: expect.any(Number) })
  })

  it('forbids Chain Jail against Hisoka but permits active Spiders', () => {
    const move = moveForSlot('kurapika', 'neutralSpecial')!
    const hisokaFight = createFight('kurapika', 'hisoka')
    const chrolloFight = createFight('kurapika', 'chrollo')
    const illumiFight = createFight('kurapika', 'illumi')
    expect(canonicalTechniqueAllowed(hisokaFight, 'player', move)).toBe(false)
    expect(canUseMovesetMove(hisokaFight, 'player', move)).toBe(false)
    expect(canonicalTechniqueAllowed(chrolloFight, 'player', move)).toBe(true)
    expect(canonicalTechniqueAllowed(illumiFight, 'player', move)).toBe(true)
  })

  it('does not apply the anti-Troupe restriction to Judgment Chain', () => {
    const judgment = moveForSlot('kurapika', 'finisher')!
    const hisokaFight = createFight('kurapika', 'hisoka')
    expect(canonicalTechniqueAllowed(hisokaFight, 'player', judgment)).toBe(true)
  })
})
