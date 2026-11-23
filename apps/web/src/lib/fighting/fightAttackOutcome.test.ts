import { describe, expect, it } from 'vitest'
import { attackData } from './frameData'
import {
  physicalAttackOutcome,
  physicalAttackOutcomePose,
  type PhysicalAttackOutcome,
} from './fightAttackOutcome'
import { bodyPlan } from './fightBodyMotion'
import { createFightState } from './fightState'
import { MOTION_AUDIT_SLOTS } from './rosterMotionScorecard'
import { moveForSlot } from './movesets'
import { FIGHTING_ROSTER } from './roster'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

function attacking(id: FighterId, slot: MoveSlot, outcome: PhysicalAttackOutcome) {
  const fighter = createFightState(id, 'hisoka').player
  const move = moveForSlot(id, slot)!
  fighter.pose = move.kind
  fighter.crouching = move.variant === 'low'
  fighter.y = move.variant === 'air' ? 3 : 0
  fighter.attack = {
    moveId: move.id,
    variant: move.variant,
    kind: move.kind,
    frame: 0,
    impacted: outcome === 'hit' || outcome === 'block',
    confirmedHit: outcome === 'hit',
    confirmedBlock: outcome === 'block',
    auraCharged: false,
    concealed: false,
    hatsuSource: null,
    projectileSpawned: false,
    reversal: false,
  }
  const frames = attackData(move.kind, fighter)
  fighter.attack.frame =
    frames.startup + frames.active + Math.max(1, Math.floor(frames.recovery * 0.18))
  return { fighter, frames }
}

describe('physical attack outcomes', () => {
  it.each(['hit', 'block', 'whiff'] as const)(
    'adds a distinct %s recovery to all 360 physical attacks',
    (outcome) => {
      for (const { id } of FIGHTING_ROSTER) {
        for (const slot of MOTION_AUDIT_SLOTS) {
          const { fighter, frames } = attacking(id, slot, outcome)
          const pose = physicalAttackOutcomePose(fighter, {
            slot,
            frame: fighter.attack!.frame,
            frames,
          })
          if (id === 'kurapika' && slot === 'standingHeavy') expect(pose).toEqual({})
          else {
            expect(Object.keys(pose).length, `${id}:${slot}:${outcome}`).toBeGreaterThan(3)
            expect(Object.values(pose).flat().every(Number.isFinite)).toBe(true)
          }
        }
      }
    },
  )

  it('separates hit follow-through, guard recoil and whiff overextension', () => {
    const read = (outcome: Exclude<PhysicalAttackOutcome, 'pending'>) => {
      const { fighter, frames } = attacking('phinks', 'standingHeavy', outcome)
      return physicalAttackOutcomePose(fighter, {
        slot: 'standingHeavy',
        frame: fighter.attack!.frame,
        frames,
      })
    }
    const hit = read('hit'),
      block = read('block'),
      whiff = read('whiff')
    expect(hit.root![2]).toBeGreaterThan(0)
    expect(block.root![2]).toBeLessThan(0)
    expect(whiff.chest![1]).toBeGreaterThan(hit.chest![1])
  })

  it('starts after contact, follows confirmation and fades before neutral', () => {
    const { fighter, frames } = attacking('biscuit', 'lowHeavy', 'block')
    const start = frames.startup + frames.active
    expect(physicalAttackOutcome(fighter, 'lowHeavy', frames)).toBe('block')
    expect(
      physicalAttackOutcomePose(fighter, { slot: 'lowHeavy', frame: start - 1, frames }),
    ).toEqual({})
    expect(
      physicalAttackOutcomePose(fighter, {
        slot: 'lowHeavy',
        frame: start + frames.recovery,
        frames,
      }),
    ).toEqual({})
  })

  it('is visible in the live body plan without changing attack state', () => {
    const { fighter } = attacking('saiyu', 'forwardHeavy', 'whiff')
    const before = structuredClone(fighter) as ArcadeFighter
    const whiff = bodyPlan(fighter, { seconds: 1, progress: 0 })!
    const { fighter: hitFighter } = attacking('saiyu', 'forwardHeavy', 'hit')
    const hit = bodyPlan(hitFighter, { seconds: 1, progress: 0 })!
    expect(whiff.pose).not.toEqual(hit.pose)
    expect(fighter).toEqual(before)
  })
})
