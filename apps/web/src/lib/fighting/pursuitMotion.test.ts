import { expect, it } from 'vitest'
import { createFightPoseContinuity } from './fightPoseContinuity'
import type { BodyPlan } from './fightPose'
import { pursuitSupport } from './pursuitMotion'

it.each(['hisoka:finisher', 'kurapika:forwardSpecial'] as const)(
  'charges %s entre la relance et le contact sans déplacer les poses aux extrémités',
  (pursuit) => {
    const draw = createFightPoseContinuity()
    const launch: BodyPlan = {
      key: 'launcher',
      plant: true,
      blend: 0,
      pose: { leadKnee: [0.1, 0, 0], chest: [0, 0, 0] },
    }
    const contact = { leadKnee: [0.1, 0, 0], chest: [0, 0, 0] } as const
    draw(launch, 0)
    const at = (frame: number) =>
      draw(
        {
          ...launch,
          key: 'pursuit',
          pose: contact,
          attackFlow: { frame, startup: 8, facing: 1, contact, pursuit },
        },
        (frame + 1) / 60,
      )
    expect(at(0)).toEqual(launch.pose)
    const load = at(4)
    if (pursuit === 'hisoka:finisher') expect(load.leadKnee![0]).toBeGreaterThan(0.7)
    else expect(load.chest![1]).toBeGreaterThan(0.4)
    expect(at(8)).toEqual(contact)
  },
)

it('inverse les appuis de la traction et du fouet quand le côté change', () => {
  expect([pursuitSupport('hisoka:finisher', 1), pursuitSupport('hisoka:finisher', -1)]).toEqual([
    0, 1,
  ])
  expect([
    pursuitSupport('kurapika:forwardSpecial', 1),
    pursuitSupport('kurapika:forwardSpecial', -1),
  ]).toEqual([1, 0])
})
