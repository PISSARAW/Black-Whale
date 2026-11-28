import { describe, it, expect } from 'vitest'
import { KAMEO_COMBO_LESSONS } from './comboLessons'
import { runKameoComboScenario } from './comboScenarios'
import { KAMEO_IDS } from './catalogue'
import { COMBAT_FIGHTERS, combatRoutesFor, combatLessonsFor } from '../combatRoutes'
import { movesetFor } from '../movesets'

describe('roster support boundaries', () => {
  it.each(COMBAT_FIGHTERS)('%s: support lessons preserve the native combo catalogue', (fighter) => {
    const native = combatRoutesFor(fighter)
    const { combos, signatureOpening, followUps } = movesetFor(fighter)!
    expect(native.every((route) => !route.kameo)).toBe(true)
    const nativeSequences = new Set(
      native.map((route) => route.moves.map((slot) => `${fighter}:${slot}`).join(',')),
    )
    const opening = signatureOpening?.id
    const transition = followUps?.find((move) => move.sourceMoveId === opening)?.id
    const finisher = followUps?.find((move) => move.sourceMoveId === transition)?.id
    if (opening) {
      expect(transition).toBeDefined()
      expect(finisher).toBeDefined()
      nativeSequences.add([opening, transition, finisher].join(','))
    }
    expect(combos.map((route) => route.join(','))).toEqual([...nativeSequences])
    expect(new Set(combos.map((route) => route.join(':'))).size).toBe(combos.length)
    expect(combatLessonsFor(fighter).filter((route) => route.kameo)).toHaveLength(6)
  })
  for (const route of KAMEO_COMBO_LESSONS)
    for (const corner of [false, true])
      it(`${route.id}, ${corner ? 'corner' : 'centre'}: immediate and late support`, () => {
        const immediate = runKameoComboScenario(route, { corner, response: 'guard' })
        expect(immediate.guaranteed, JSON.stringify({ ...immediate, state: undefined })).toBe(true)
        expect(immediate.defenderCanActAt).toBeGreaterThan(immediate.finishedAt)
        const late = runKameoComboScenario(route, { corner, callDelay: 60, response: 'jab' })
        if (route.kameo!.id === 'luzurus') {
          expect(late.guaranteed).toBe(false)
          expect(late.replySentAt).toBeGreaterThan(0)
          expect(late.replyHitAt).toBeGreaterThan(late.replySentAt)
          expect(late.replyDamage).toBeGreaterThan(0)
          const held = runKameoComboScenario(route, { corner, finishDelay: 90, response: 'guard' })
          expect(held.guaranteed).toBe(false)
          expect(held.defenderCanActAt).toBeGreaterThan(held.supportAt)
        }
      })
  for (const id of KAMEO_IDS)
    it(`${id}: an exhausted support cannot guarantee the exercise`, () => {
      const route = KAMEO_COMBO_LESSONS.find(
        (route) => route.fighter === 'kurapika' && route.kameo!.id === id,
      )!
      const result = runKameoComboScenario(route, { supportAura: 0, response: 'jab' })
      expect(result.guaranteed).toBe(false)
      expect(result.supportAt).toBe(-1)
      expect(result.defenderCanActAt).toBeGreaterThan(result.firstHitAt)
      expect(result.replySentAt).toBeGreaterThan(0)
    })
})
