import { describe, expect, it } from 'vitest'
import { fightStance, stanceAt } from './fightStance'
import { FIGHTING_ROSTER } from './roster'

const turn = (value?: readonly number[]) => value?.[0] ?? 0

describe('fighting stances', () => {
  it.each(FIGHTING_ROSTER.map((fighter) => fighter.id))(
    '%s stands over its feet instead of sitting',
    (id) => {
      const stance = fightStance(id)
      if (!stance) return
      for (const seconds of [0, 0.2, 0.4, 0.6, 0.8]) {
        const pose = stanceAt(stance, seconds)
        // A shin leaning back past the thigh throws the knee forward: the figure sits.
        const leadShin = turn(pose.leadHip) + turn(pose.leadKnee)
        expect(leadShin).toBeLessThanOrEqual(0.3)
        expect(turn(pose.leadKnee)).toBeLessThanOrEqual(0.75)
        expect(turn(pose.rearKnee)).toBeLessThanOrEqual(0.5)
      }
    },
  )
})
