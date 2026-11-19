import { expect, it } from 'vitest'
import { createFightPoseContinuity } from './fightPoseContinuity'
import { bodyPlan } from './fightBodyMotion'
import { createFightState } from './fightState'
import { performAttack } from './engine'
import { attackData } from './frameData'
import { FIGHTING_ROSTER } from './roster'
import { linkedStrikePose } from './fightComboTransfer'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s carries the outgoing support to the exact next contact',
  (id) => {
    const state = createFightState(id, 'hisoka')
    const light = performAttack({ ...state, phase: 'fighting' }, 'player', 'light').player
    const heavy = performAttack({ ...state, phase: 'fighting' }, 'player', 'heavy').player
    const continuity = createFightPoseContinuity()
    const frame = attackData('light', light).startup
    const outgoing = bodyPlan(
      { ...light, attack: { ...light.attack!, frame } },
      { seconds: 0, progress: 0 },
    )!
    const before = continuity(outgoing, 0)
    const incoming = bodyPlan(heavy, { seconds: 1 / 60, progress: 0 })!
    expect(continuity(incoming, 1 / 60)).toEqual(before)
    const contact = bodyPlan(
      { ...heavy, attack: { ...heavy.attack!, frame: incoming.attackFlow!.startup } },
      { seconds: 1, progress: 0 },
    )!
    const middle = continuity(
      {
        ...incoming,
        attackFlow: { ...incoming.attackFlow!, frame: incoming.attackFlow!.startup / 2 },
      },
      0.05,
    )
    expect(middle).not.toEqual(before)
    expect(Object.values(middle).flat().every(Number.isFinite)).toBe(true)
    expect(continuity(contact, 0.1)).toEqual(contact.pose)
  },
)

it('keeps a distinct leg compression during a link instead of replacing it with the incoming arms', () => {
  const input = {
    from: { leadKnee: [0.8, 0, 0] as const },
    contact: { leadKnee: [0.2, 0, 0] as const },
    load: {},
    velocity: {},
    progress: 0.5,
    frames: 8,
  }
  const ordinary = linkedStrikePose(input)
  const supported = linkedStrikePose({
    ...input,
    transfer: {
      load: { rearKnee: [0.45, 0, 0] },
      drive: { chest: [0, 0.2, 0] },
      release: {},
      peak: 0.45,
    },
  })
  expect(supported.rearKnee![0]).toBeGreaterThan(0.3)
  expect(supported.leadKnee![0]).toBeGreaterThan(0.2)
  expect(supported).not.toEqual(ordinary)
})
