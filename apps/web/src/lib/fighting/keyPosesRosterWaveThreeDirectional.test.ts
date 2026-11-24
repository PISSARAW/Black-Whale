import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { bodyPlan } from './fightBodyMotion'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { ROSTER_WAVE_THREE_FIGHTERS } from './keyPosesRosterWaveThree'
import { ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS } from './keyPosesRosterWaveThreeDirectional'
import { authoredStrikeDirection } from './physicalStrikeDirections'
import { moveForSlot } from './movesets'
import { rosterKeyPoses } from './rosterKeyPoses'
import { fighterMotionScore } from './rosterMotionScorecard'

describe('roster motion wave three directional attacks', () => {
  it('authors thirty-three distinct low, advancing and retreating timelines', () => {
    const signatures = new Set<string>()
    for (const id of ROSTER_WAVE_THREE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS) {
        const timeline = keyPoseTimeline(id, slot)!
        expect(keyPoseSource(id, slot), `${id}:${slot}`).toBe('dedicated')
        expect(timeline).toHaveLength(7)
        expect(timeline.filter(({ phase }) => phase === 'recovery')).toHaveLength(3)
        const contacts = timeline.filter(({ phase }) => phase === 'active')
        expect(contacts[1].pose).toEqual(contacts[0].pose)
        signatures.add(JSON.stringify(timeline))
      }
    }
    expect(signatures.size).toBe(33)
  })

  it('separates compression, forward drive and backward braking from generated poses', () => {
    for (const id of ROSTER_WAVE_THREE_FIGHTERS) {
      const contact = (slot: (typeof ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS)[number]) =>
        keyPoseTimeline(id, slot)!.find(({ phase, at }) => phase === 'active' && at === 0)!.pose
      if (authoredStrikeDirection(id, 'forwardHeavy')) {
        expect(contact('forwardHeavy').root?.[2] ?? 0, id).toBeGreaterThanOrEqual(0)
        expect(contact('backHeavy').root?.[2], id).toBeLessThan(0)
        continue
      }
      const generated = (slot: (typeof ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS)[number]) =>
        rosterKeyPoses(id)[slot]!.find(({ phase, at }) => phase === 'active' && at === 0)!.pose
      expect(contact('lowLight').leadKnee?.[0], id).toBeGreaterThan(
        (generated('lowLight').leadKnee?.[0] ?? 0) + 0.25,
      )
      expect(contact('forwardHeavy').root?.[2], id).toBeGreaterThan(
        (generated('forwardHeavy').root?.[2] ?? 0) + 0.04,
      )
      expect(contact('backHeavy').root?.[2], id).toBeLessThan(
        (generated('backHeavy').root?.[2] ?? 0) - 0.025,
      )
    }
  })

  it('routes every directional move through its semantic support', () => {
    for (const id of ROSTER_WAVE_THREE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS) {
        const move = moveForSlot(id, slot)!
        const fighter = createFightState(id, 'hisoka').player
        fighter.pose = move.kind
        fighter.crouching = move.variant === 'low'
        fighter.attack = {
          moveId: move.id,
          variant: move.variant,
          kind: move.kind,
          frame: move.tuning.startup,
          impacted: false,
          auraCharged: false,
          concealed: false,
          hatsuSource: null,
          projectileSpawned: false,
          reversal: false,
        }
        expect(bodyPlan(fighter, { seconds: 1, progress: 0 })).toMatchObject({
          supportFoot: slot === 'forwardHeavy' ? 'lead' : 'rear',
          pivotFoot: slot === 'forwardHeavy' ? 'rear' : 'lead',
        })
      }
    }
  })

  it('raises every final-wave fighter beyond P7', () => {
    const p7: Record<(typeof ROSTER_WAVE_THREE_FIGHTERS)[number], number> = {
      phinks: 7.9,
      zakuro: 7.8,
      franklin: 8,
      sayird: 8,
      voconte: 8,
      bill: 8,
      biscuit: 8,
      furykov: 8,
      halkenburg: 8,
      hinrigh: 8,
      saiyu: 8,
    }
    for (const id of ROSTER_WAVE_THREE_FIGHTERS)
      expect(fighterMotionScore(id).score, id).toBeGreaterThan(p7[id])
  })
})
