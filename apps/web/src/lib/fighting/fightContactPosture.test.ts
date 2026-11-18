import { expect, it } from 'vitest'
import { bodyPlan } from './fightBodyMotion'
import { createFightState } from './fightState'
import { performAuraAttack } from './engine'
import { createFightPoseContinuity } from './fightPoseContinuity'
import { FIGHTING_ROSTER } from './roster'
import { moveForSlot } from './movesets'
import { contactPostureFrom, withContactPosture } from './fightContactPosture'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s retains its low entry through an actual forward-light contact',
  (id) => {
    const state = { ...createFightState(id, 'hisoka'), phase: 'fighting' as const }
    const move = moveForSlot(id, 'forwardLight')!
    const fighter = performAuraAttack({
      state,
      side: 'player',
      kind: move.kind,
      moveId: move.id,
      auraCharged: false,
    }).player
    const start = bodyPlan(fighter, { seconds: 0, progress: 0 })!
    const low = {
      leadHip: [-0.8, 0, 0] as const,
      rearHip: [-0.75, 0, 0] as const,
      leadKnee: [1.65, 0, 0] as const,
      rearKnee: [1.55, 0, 0] as const,
    }
    const posture = contactPostureFrom(low, start)
    expect(posture).toBeDefined()
    const flow = createFightPoseContinuity()
    flow({ key: 'crouch', pose: low, plant: true, blend: 0 }, 0)
    expect(flow(start, 1 / 60)).toMatchObject(low)
    const attack = start.attackFlow!
    const at = (frame: number) =>
      bodyPlan(
        { ...fighter, attack: { ...fighter.attack!, frame } },
        { seconds: frame / 60, progress: 0 },
      )!
    const contactPlan = at(attack.startup)
    const contact = flow(contactPlan, (attack.startup + 1) / 60)
    expect(contact.leadKnee![0] + contact.rearKnee![0]).toBeGreaterThan(
      contactPlan.pose.leadKnee![0] + contactPlan.pose.rearKnee![0] + 0.4,
    )
    expect(contact.leadShoulder).toEqual(contactPlan.pose.leadShoulder)
    expect(flow(contactPlan, 99)).toEqual(contact)
    const end = at(attack.startup + attack.active! + attack.recovery!)
    expect(withContactPosture(end, posture).pose).toEqual(end.pose)
  },
)

it('leaves a standing entry and airborne technique unchanged', () => {
  const contact = { leadKnee: [0.3, 0, 0] as const, rearKnee: [0.2, 0, 0] as const }
  const plan = {
    key: 'attack:test',
    pose: contact,
    plant: false,
    blend: 0,
    attackFlow: { frame: 0, startup: 5, facing: 1 as const, contact },
  }
  expect(contactPostureFrom({ leadKnee: [1.7, 0, 0] }, plan)).toBeUndefined()
  expect(contactPostureFrom(contact, { ...plan, plant: true })).toBeUndefined()
})
