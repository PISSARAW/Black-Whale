import { expect, it } from 'vitest'
import { createFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { nenApplications } from './nenApplications'
import { applyAuraContext } from './nen'
import { EMPTY_INPUT } from './types'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s keeps personal conditions and bodily reinforcement separate',
  (id) => {
    const fighter = createFight(id, 'hisoka').player
    const basic = nenApplications(fighter)
    expect(basic.find((a) => a.id === 'strike')!.available).toBe(true)
    const sealed = { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, hatsuStolen: 1 } }
    expect(nenApplications(sealed).find((a) => a.id === 'personal')!.available).toBe(false)
    expect(nenApplications(sealed).find((a) => a.id === 'strike')!.available).toBe(true)
    const exhausted = { ...fighter, auraExhausted: true }
    expect(nenApplications(exhausted).every((a) => !a.available)).toBe(true)
  },
)

it('never coats an absent weapon or creates a Hatsu for Theta and protects real supports', () => {
  const state = createFight('theta', 'hisoka')
  expect(nenApplications(state.player).find((a) => a.id === 'personal')!.available).toBe(false)
  expect(applyAuraContext(state.player, { ...EMPTY_INPUT, shu: true }).nen.shu).toEqual([])
  expect(applyAuraContext(state.opponent, { ...EMPTY_INPUT, shu: true }).nen.shu).toContain('cards')
  const disarmed = { ...state.opponent, weaponsConfiscated: true }
  expect(applyAuraContext(disarmed, { ...EMPTY_INPUT, shu: true }).nen.shu).toEqual([])
})
