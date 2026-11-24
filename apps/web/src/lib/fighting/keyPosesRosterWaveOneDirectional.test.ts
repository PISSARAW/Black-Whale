import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { bodyPlan } from './fightBodyMotion'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { ROSTER_WAVE_ONE_FIGHTERS } from './keyPosesRosterWaveOne'
import { ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS } from './keyPosesRosterWaveOneDirectional'
import { authoredStrikeDirection } from './physicalStrikeDirections'
import { moveForSlot } from './movesets'
import { rosterKeyPoses } from './rosterKeyPoses'
import { fighterMotionScore } from './rosterMotionScorecard'

describe('roster motion wave one directional attacks', () => {
  it('authors thirty distinct low, advancing and retreating timelines', () => {
    const signatures = new Set<string>()
    for (const id of ROSTER_WAVE_ONE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS) {
        const timeline = keyPoseTimeline(id, slot)!
        expect(keyPoseSource(id, slot), `${id}:${slot}`).toBe('dedicated')
        expect(timeline).toHaveLength(7)
        expect(timeline.filter(({ phase }) => phase === 'recovery')).toHaveLength(3)
        const contacts = timeline.filter(({ phase }) => phase === 'active')
        expect(contacts[1].pose).toEqual(contacts[0].pose)
        signatures.add(JSON.stringify(timeline))
      }
    }
    expect(signatures.size).toBe(30)
  })

  it('separates low compression, forward drive and backward braking', () => {
    for (const id of ROSTER_WAVE_ONE_FIGHTERS) {
      const contact = (slot: (typeof ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS)[number]) =>
        keyPoseTimeline(id, slot)!.find(({ phase, at }) => phase === 'active' && at === 0)!.pose
      if (authoredStrikeDirection(id, 'forwardHeavy')) {
        expect(contact('lowLight').root?.[1] ?? 0, id).toBeLessThanOrEqual(0)
        expect(contact('forwardHeavy').root?.[2] ?? 0, id).toBeGreaterThanOrEqual(0)
        expect(contact('backHeavy').root?.[2], id).toBeLessThan(0)
        continue
      }
      const generated = (slot: (typeof ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS)[number]) =>
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

  it('uses the correct support foot for every directional route and facing', () => {
    for (const id of ROSTER_WAVE_ONE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS) {
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

  it('raises the first wave again from its P1 score', () => {
    const p1: Record<(typeof ROSTER_WAVE_ONE_FIGHTERS)[number], number> = {
      melody: 7.8,
      mizaistom: 7.8,
      camilla: 7.8,
      gel: 7.6,
      illumi: 7.7,
      terebellum: 7.8,
      tserriednich: 7.7,
      cluck: 7.8,
      luini: 7.8,
      machi: 7.7,
    }
    for (const id of ROSTER_WAVE_ONE_FIGHTERS)
      expect(fighterMotionScore(id).score, id).toBeGreaterThan(p1[id])
  })
})
