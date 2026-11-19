import { describe, expect, it } from 'vitest'
import { bodyPlan } from './fightBodyMotion'
import { FIGHT_LEAN_BUDGETS, keepFightPosture } from './fightPostureBudget'
import { createFightState } from './fightState'
import type { BodyPlan } from './fightPose'
import { attackData } from './frameData'
import { moveForSlot } from './movesets'

describe('fight posture budget', () => {
  it('limits the composed body and trunk without changing twist or side bend', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const plan: BodyPlan = {
      key: 'stacked-attack',
      blend: 0,
      plant: true,
      pose: { body: [0.8, 0.2, -0.1], chest: [0.5, -0.4, 0.15] },
      attackFlow: {
        frame: 4,
        startup: 8,
        active: 3,
        recovery: 12,
        supportLeg: 'lead',
        loadAt: 0.5,
        facing: 1,
        contact: { body: [0.9, 0.1, 0], chest: [0.4, -0.2, 0.1] },
      },
    }
    const limited = keepFightPosture(plan, {
      ...fighter,
      pose: 'heavy',
      attack: {
        kind: 'heavy',
        frame: 4,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      },
    })
    expect(limited.pose.body).toEqual([FIGHT_LEAN_BUDGETS.attack.body[1], 0.2, -0.1])
    expect(limited.pose.body![0] + limited.pose.chest![0]).toBeCloseTo(
      FIGHT_LEAN_BUDGETS.attack.trunk[1],
    )
    expect(limited.attackFlow?.contact?.body?.[0]).toBe(FIGHT_LEAN_BUDGETS.attack.body[1])
    expect(limited.attackFlow?.contact?.body?.[1]).toBe(0.1)
  })

  it('keeps authored falls outside the active-fighting budget', () => {
    const fighter = { ...createFightState('kurapika', 'hisoka').player, pose: 'ko' as const }
    const plan: BodyPlan = {
      key: 'fall',
      blend: 0,
      plant: false,
      pose: { body: [-1.5, 0, 0], chest: [0.8, 0, 0] },
    }
    expect(keepFightPosture(plan, fighter)).toBe(plan)
  })

  it('bounds the real idle, walk and dash plans after all motion layers are composed', () => {
    const fighter = createFightState('benjamin', 'hisoka').player
    const states = [
      fighter,
      { ...fighter, pose: 'walk' as const },
      {
        ...fighter,
        pose: 'walk' as const,
        motion: {
          ...fighter.motion!,
          dash: { direction: fighter.facing, frame: 4, frames: 12, peak: 54 },
        },
      },
    ]
    for (const state of states) {
      const pose = bodyPlan(state, { seconds: 0.4, progress: 0 })!.pose
      const budget = state.pose === 'walk' ? FIGHT_LEAN_BUDGETS.moving : FIGHT_LEAN_BUDGETS.ready
      expect(pose.body?.[0] ?? 0).toBeGreaterThanOrEqual(budget.body[0])
      expect(pose.body?.[0] ?? 0).toBeLessThanOrEqual(budget.body[1])
      expect((pose.body?.[0] ?? 0) + (pose.chest?.[0] ?? 0)).toBeGreaterThanOrEqual(budget.trunk[0])
      expect((pose.body?.[0] ?? 0) + (pose.chest?.[0] ?? 0)).toBeLessThanOrEqual(budget.trunk[1])
    }
  })

  it.each(['beyond', 'franklin'] as const)(
    '%s stays upright through the contact frame of its heaviest grounded attack',
    (id) => {
      const fighter = createFightState(id, 'hisoka').player
      const move = moveForSlot(id, 'standingHeavy')!
      const attacking = {
        ...fighter,
        pose: move.kind,
        attack: {
          kind: move.kind,
          variant: move.variant,
          moveId: move.id,
          frame: 0,
          impacted: false,
          auraCharged: false,
          concealed: false,
          hatsuSource: null,
          projectileSpawned: false,
          reversal: false,
        },
      }
      attacking.attack.frame = attackData(move.kind, attacking).startup
      const pose = bodyPlan(attacking, { seconds: 0.4, progress: 0 })!.pose
      const budget = FIGHT_LEAN_BUDGETS.bruteAttack
      expect(pose.body?.[0] ?? 0).toBeGreaterThanOrEqual(budget.body[0])
      expect(pose.body?.[0] ?? 0).toBeLessThanOrEqual(budget.body[1])
      expect((pose.body?.[0] ?? 0) + (pose.chest?.[0] ?? 0)).toBeGreaterThanOrEqual(budget.trunk[0])
      expect((pose.body?.[0] ?? 0) + (pose.chest?.[0] ?? 0)).toBeLessThanOrEqual(budget.trunk[1])
    },
  )
})
