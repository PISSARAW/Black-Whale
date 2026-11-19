import { expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { isJudgedKnockdown } from './towerJudging'
import { rosterMoveShape } from './rosterStrikeMotion'
import { residualNenReaction } from './nenReactionCarry'
import { nenImpactBodyPlan } from './nenImpactResponse'
it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s keeps a standing heavy recoil distinct from a sweep or paid Ko',
  (id) => {
    let state = beginFight(createFight(id, 'beyond', { mode: 'versus-local' }))
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'heavy',
      moveId: `${id}:standingHeavy`,
      auraCharged: false,
    })
    const judgment = {
      attacker: state.player,
      blocked: false,
      avoided: false,
      critical: false,
      knockback: 4,
    }
    expect(isJudgedKnockdown(judgment)).toBe(rosterMoveShape(`${id}:standingHeavy`) === 'sweep')
    expect(isJudgedKnockdown({ ...judgment, critical: true })).toBe(true)
    expect(isJudgedKnockdown({ ...judgment, knockback: 8 })).toBe(true)
    expect(isJudgedKnockdown({ ...judgment, blocked: true, critical: true })).toBe(false)
  },
)
it('a second projectile starts from the displayed imbalance and remains bounded without altering stun', () => {
  const fighter = createFight('hisoka', 'machi').player
  const response = {
    kind: 'projectile' as const,
    force: 1,
    zone: 'torso' as const,
    sourceX: 100,
    duration: 20,
  }
  const before = structuredClone(fighter)
  const carry = residualNenReaction(fighter, {
    reacting: true,
    progress: 0.3,
    contact: { nenResponse: response },
  })!
  expect(Object.keys(carry).length).toBeGreaterThan(0)
  const next = nenImpactBodyPlan(fighter, { response, progress: 0, carry }, {})!
  expect(next.pose.chest?.[0]).toBeGreaterThan(0)
  expect(Math.max(...Object.values(carry).flat())).toBeLessThanOrEqual(0.24)
  expect(fighter).toEqual(before)
  expect(
    residualNenReaction(fighter, {
      reacting: false,
      progress: 0.3,
      contact: { nenResponse: response },
    }),
  ).toBeUndefined()
})
