import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { fightFigureKey } from './fighterFigure'

describe('figure invalidation', () => {
  it.each(['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)(
    'keeps %s’s body while its separately drawn En expands',
    (id) => {
      const fighter = createFightState(id, 'hisoka').player
      const key = fightFigureKey(fighter)
      for (const radius of [0, 0.5, 1, 10, 30]) {
        expect(fightFigureKey({ ...fighter, nen: { ...fighter.nen, en: { radius } } })).toBe(key)
      }
    },
  )

  it('still rebuilds the aura, Gyo, In and Emperor Time when their appearance changes', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const key = fightFigureKey(fighter)
    for (const nen of [
      { ...fighter.nen, mode: 'ren' as const },
      { ...fighter.nen, gyo: true },
      { ...fighter.nen, in: true },
    ]) {
      expect(fightFigureKey({ ...fighter, nen })).not.toBe(key)
    }
    expect(
      fightFigureKey({ ...fighter, kurapika: { ...fighter.kurapika!, emperorTime: true } }),
    ).not.toBe(key)
  })
})
