import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { bodyPlan } from './fightBodyMotion'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { ROSTER_WAVE_ONE_FIGHTERS } from './keyPosesRosterWaveOne'
import { ROSTER_WAVE_ONE_FINISH_SLOTS } from './keyPosesRosterWaveOneFinish'
import { moveForSlot } from './movesets'
import { fighterMotionScore } from './rosterMotionScorecard'

describe('roster motion wave one low heavy and air attacks', () => {
  it('completes all nine physical attacks with thirty distinct timelines', () => {
    const signatures = new Set<string>()
    for (const id of ROSTER_WAVE_ONE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_ONE_FINISH_SLOTS) {
        const timeline = keyPoseTimeline(id, slot)!
        expect(keyPoseSource(id, slot), `${id}:${slot}`).toBe('dedicated')
        expect(timeline).toHaveLength(7)
        expect(timeline.filter(({ phase }) => phase === 'recovery')).toHaveLength(3)
        const contacts = timeline.filter(({ phase }) => phase === 'active')
        expect(contacts[1].pose).toEqual(contacts[0].pose)
        signatures.add(JSON.stringify(timeline))
      }
      expect(fighterMotionScore(id).dedicatedMoves, id).toBe(9)
    }
    expect(signatures.size).toBe(30)
  })

  it('tucks both air attacks and prepares their landing without planting a foot', () => {
    for (const id of ROSTER_WAVE_ONE_FIGHTERS) {
      for (const slot of ['airLight', 'airHeavy'] as const) {
        const move = moveForSlot(id, slot)!
        const fighter = createFightState(id, 'hisoka').player
        fighter.y = 3
        fighter.pose = move.kind
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
        const timeline = keyPoseTimeline(id, slot)!
        const contact = timeline.find(({ phase, at }) => phase === 'active' && at === 0)!.pose
        const landing = timeline.at(-1)!.pose
        expect(
          Math.max(contact.leadKnee?.[0] ?? 0, contact.rearKnee?.[0] ?? 0),
          `${id}:${slot}`,
        ).toBeGreaterThan(0.2)
        expect(landing.root?.[1], `${id}:${slot}`).toBeLessThan(0)
        expect(bodyPlan(fighter, { seconds: 1, progress: 0 })).toMatchObject({ plant: false })
        expect(bodyPlan(fighter, { seconds: 1, progress: 0 })?.supportFoot).toBeUndefined()
      }
    }
  })

  it('gives low heavy a rear support and lead pivot in both facings', () => {
    for (const id of ROSTER_WAVE_ONE_FIGHTERS) {
      const move = moveForSlot(id, 'lowHeavy')!
      for (const facing of [1, -1] as const) {
        const fighter = createFightState(id, 'hisoka').player
        fighter.facing = facing
        fighter.pose = move.kind
        fighter.crouching = true
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
          supportFoot: 'rear',
          pivotFoot: 'lead',
        })
      }
    }
  })

  it('raises every first-wave fighter beyond its P2 score', () => {
    const p2: Record<(typeof ROSTER_WAVE_ONE_FIGHTERS)[number], number> = {
      melody: 8.7,
      mizaistom: 8.7,
      camilla: 8.7,
      gel: 8.6,
      illumi: 8.7,
      terebellum: 8.7,
      tserriednich: 8.6,
      cluck: 8.6,
      luini: 8.7,
      machi: 8.6,
    }
    for (const id of ROSTER_WAVE_ONE_FIGHTERS)
      expect(fighterMotionScore(id).score, id).toBeGreaterThan(p2[id])
  })
})
