import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { EMPTY_INPUT } from './types'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { bodyPlan } from './fightBodyMotion'
import { FIGHTING_ROSTER } from './roster'
import { fightReplayHash } from './fightReplayHash'

const distance = (a: number = 0, b: number = 0) => Math.abs(a - b)

describe('ground recovery before a buffered reversal', () => {
  it.each(FIGHTING_ROSTER.map((f) => f.id))(
    '%s gathers, supports and rises before becoming actionable',
    (id) => {
      let state = beginFight(createFight(id, 'hisoka', 'knockout'))
      state = { ...state, player: { ...state.player, pose: 'down', knockdownFrames: 44 } }
      const observer = createFightReactionPresentation()
      const poses = []
      for (let n = 0; n < 50; n++) {
        const hash = fightReplayHash(state)
        const context = observer(state, 'player', {
          fighter: state.player,
          seconds: state.frame / 60,
        })
        const plan = bodyPlan(state.player, { ...context, seconds: state.frame / 60 })!
        const pose = context.poseContinuity!(plan, state.frame / 60)
        poses.push({ pose, down: state.player.knockdownFrames, attack: state.player.attack })
        expect(fightReplayHash(state)).toBe(hash)
        if (state.player.knockdownFrames === 4) state = performAttack(state, 'player', 'heavy')
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
      }
      const lastDown = poses.filter((p) => p.down > 0).at(-1)!
      const standing = bodyPlan(
        { ...state.player, attack: null, pose: 'idle' },
        { seconds: state.frame / 60, progress: 0 },
      )!.pose
      expect(distance(lastDown.pose.body?.[0], standing.body?.[0])).toBeLessThan(0.1)
      expect(poses.some((p) => (p.pose.leadKnee?.[0] ?? 0) > 1.1)).toBe(true)
      expect(poses.some((p) => p.attack?.reversal)).toBe(true)
      const beforeAttack = poses.findIndex((p) => p.attack)
      for (let n = 1; n <= beforeAttack; n++) {
        expect(distance(poses[n].pose.body?.[0], poses[n - 1].pose.body?.[0])).toBeLessThan(0.5)
        expect(distance(poses[n].pose.leadKnee?.[0], poses[n - 1].pose.leadKnee?.[0])).toBeLessThan(
          0.6,
        )
      }
    },
  )
  it('keeps a dead or sleeping body down', () => {
    const state = beginFight(createFight('benjamin', 'hisoka', 'knockout'))
    for (const extra of [
      { health: 0 },
      { arsenalSleep: { owner: 'opponent' as const, cause: 'cookie' as const } },
    ]) {
      const fighter = { ...state.player, ...extra, pose: 'down' as const, knockdownFrames: 1 }
      expect(bodyPlan(fighter, { seconds: 1, progress: 0.99 })!.pose.body![0]).toBeLessThan(-1)
    }
  })
})
