import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { bodyPlan } from './fightBodyMotion'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { standingStrikeSupport } from './standingStrikeMotion'
import { moveForSlot } from './movesets'
import { ROSTER_WAVE_ONE_FIGHTERS, ROSTER_WAVE_ONE_SLOTS } from './keyPosesRosterWaveOne'
import { fighterMotionScore } from './rosterMotionScorecard'

describe('roster motion wave one grounded fundamentals', () => {
  it('authors thirty distinct seven-key grounded timelines', () => {
    const signatures = new Set<string>()
    for (const id of ROSTER_WAVE_ONE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_ONE_SLOTS) {
        const timeline = keyPoseTimeline(id, slot)!
        expect(keyPoseSource(id, slot), `${id}:${slot}`).toBe('dedicated')
        expect(timeline, `${id}:${slot}`).toHaveLength(7)
        expect(timeline.filter(({ phase }) => phase === 'recovery')).toHaveLength(3)
        const contacts = timeline.filter(({ phase }) => phase === 'active')
        expect(contacts).toHaveLength(2)
        expect(contacts[1].pose).toEqual(contacts[0].pose)
        expect(timeline.some(({ jointEase }) => jointEase?.pelvis)).toBe(true)
        signatures.add(JSON.stringify(timeline))
      }
    }
    expect(signatures.size).toBe(30)
  })

  it('locks a semantic support foot and opposite pivot in both facings', () => {
    for (const id of ROSTER_WAVE_ONE_FIGHTERS) {
      for (const facing of [1, -1] as const) {
        const fighter = createFightState(id, 'hisoka').player
        fighter.facing = facing
        fighter.pose = 'heavy'
        fighter.attack = {
          moveId: moveForSlot(id, 'standingHeavy')!.id,
          variant: 'standing',
          kind: 'heavy',
          frame: 8,
          impacted: false,
          auraCharged: false,
          concealed: false,
          hatsuSource: null,
          projectileSpawned: false,
          reversal: false,
        }
        const authored = standingStrikeSupport(
          fighter,
          'standingHeavy',
          moveForSlot(id, 'standingHeavy')!.tuning,
        )
        const support = authored?.supportFoot ?? 'lead'
        expect(bodyPlan(fighter, { seconds: 1, progress: 0 })).toMatchObject({
          supportFoot: support,
          pivotFoot: support === 'lead' ? 'rear' : 'lead',
        })
      }
    }
  })

  it('raises every first-wave fighter above its P0 authored-depth baseline', () => {
    const baselines: Record<(typeof ROSTER_WAVE_ONE_FIGHTERS)[number], number> = {
      melody: 6.7,
      mizaistom: 6.7,
      camilla: 6.8,
      gel: 6.8,
      illumi: 6.8,
      terebellum: 6.8,
      tserriednich: 6.8,
      cluck: 6.9,
      luini: 6.9,
      machi: 6.9,
    }
    for (const id of ROSTER_WAVE_ONE_FIGHTERS)
      expect(fighterMotionScore(id).score, id).toBeGreaterThan(baselines[id])
  })
})
