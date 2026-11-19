import { expect, it } from 'vitest'
import { createFightPoseContinuity } from './fightPoseContinuity'
import type { BodyPlan } from './fightPose'

it('carries the settled joint into a new gesture without accumulating IK during a repeated frozen frame', () => {
  const flow = createFightPoseContinuity()
  const walk: BodyPlan = {
    key: 'walk',
    pose: { leadKnee: [0.2, 0, 0], rearKnee: [0.1, 0, 0] },
    plant: true,
    blend: 0.05,
  }
  flow(walk, 0)
  flow.observe({ leadKnee: [0.7, 0, 0], rearKnee: [0.35, 0, 0] })
  const attack: BodyPlan = {
    key: 'attack:new',
    pose: { leadKnee: [0.3, 0, 0] },
    plant: true,
    blend: 0,
    attackFlow: { frame: 0, startup: 8, facing: 1, contact: { leadKnee: [0.8, 0, 0] } },
  }
  const first = flow(attack, 1 / 60)
  expect(first.leadKnee?.[0]).toBeCloseTo(0.7)
  flow.observe({ leadKnee: [0.9, 0, 0] })
  expect(flow(attack, 2 / 60)).toEqual(first)
  expect(flow(attack, 3 / 60)).toEqual(first)
})

it('keeps floor corrections out of authored root travel when starting the next gesture', () => {
  const flow = createFightPoseContinuity()
  flow({ key: 'walk', pose: { root: [0.02, -0.01, 0] }, plant: true, blend: 0.1 }, 0)
  flow.observe({ root: [0.1, -0.4, 0.2], leadKnee: [0.4, 0, 0] })
  const next = flow({ key: 'stance', pose: {}, plant: true, blend: 0.1 }, 1 / 60)
  expect(next.root).toEqual([0.02, -0.01, 0])
  expect(next.leadKnee).toEqual([0.4, 0, 0])
})
