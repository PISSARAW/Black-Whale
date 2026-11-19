import { expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { advanceFighterAttack } from './fighterAttacks'
import { attackData } from './frameData'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT } from './types'
import { bodyPlan } from './fightBodyMotion'
import { createFightPoseContinuity } from './fightPoseContinuity'
import { shuffleSupport } from './fightShuffleStep'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s carries the whole stance and advances through startup, not at input',
  (id) => {
    let s = beginFight(createFight(id, 'franklin', { mode: 'versus-local' }))
    const x = s.player.x
    s = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'light',
      moveId: `${id}:standingLight`,
      auraCharged: false,
    })
    expect(s.player.attack).not.toBeNull()
    expect(s.player.x).toBe(x)
    const d = attackData('light', s.player)
    let f = s.player,
      last = x
    for (let i = 0; i < d.startup; i++) {
      f = advanceFighterAttack(f)
      expect(f.x).toBeGreaterThanOrEqual(last)
      expect(f.x).toBeLessThanOrEqual(x + d.lunge + 1e-8)
      last = f.x
    }
    expect(f.x).toBeCloseTo(x + d.lunge, 8)
    const walking = {
      ...s.player,
      attack: null,
      pose: 'walk' as const,
      motion: { ...s.player.motion!, heldDirection: 1 as const },
    }
    const plan = bodyPlan(walking, { seconds: 0, progress: 0 })!
    expect(plan.pose.leadKnee).toBeDefined()
    expect(plan.pose.rearKnee).toBeDefined()
    const flow = createFightPoseContinuity(),
      pose = flow(plan, 0)
    const standing = bodyPlan({ ...walking, pose: 'idle' }, { seconds: 1 / 60, progress: 0 })!
    const entry = flow(standing, 1 / 60)
    expect(entry.leadKnee).toEqual(pose.leadKnee)
    expect(shuffleSupport(walking).support).not.toBe(shuffleSupport(walking).free)
    const paused = tickFight({ ...s, hitstop: 3 }, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: EMPTY_INPUT,
    })
    expect(paused.player.x).toBe(s.player.x)
    expect(paused.player.attackDrive).toEqual(s.player.attackDrive)
  },
)
