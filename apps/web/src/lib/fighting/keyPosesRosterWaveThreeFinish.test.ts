import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { bodyPlan } from './fightBodyMotion'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { ROSTER_WAVE_THREE_FIGHTERS } from './keyPosesRosterWaveThree'
import { ROSTER_WAVE_THREE_FINISH_SLOTS } from './keyPosesRosterWaveThreeFinish'
import { moveForSlot } from './movesets'
import { FIGHTING_ROSTER } from './roster'
import { fighterMotionScore, rosterMotionScorecard } from './rosterMotionScorecard'

describe('roster motion wave three low heavy and air attacks', () => {
  it('completes all nine physical attacks with thirty-three distinct timelines', () => {
    const signatures = new Set<string>()
    for (const id of ROSTER_WAVE_THREE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_THREE_FINISH_SLOTS) {
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
    expect(signatures.size).toBe(33)
  })

  it('keeps air attacks tucked, descending and unplanted', () => {
    for (const id of ROSTER_WAVE_THREE_FIGHTERS) {
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
        expect(contact.rearKnee?.[0], `${id}:${slot}`).toBeGreaterThan(0.25)
        expect(timeline.at(-1)!.pose.root?.[1], `${id}:${slot}`).toBeLessThan(0)
        expect(bodyPlan(fighter, { seconds: 1, progress: 0 })).toMatchObject({ plant: false })
        expect(bodyPlan(fighter, { seconds: 1, progress: 0 })?.supportFoot).toBeUndefined()
      }
    }
  })

  it('anchors low heavy over the rear support in both facings', () => {
    for (const id of ROSTER_WAVE_THREE_FIGHTERS) {
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

  it('raises every final-wave fighter beyond P8', () => {
    const p8: Record<(typeof ROSTER_WAVE_THREE_FIGHTERS)[number], number> = {
      phinks: 8.6,
      zakuro: 8.6,
      franklin: 8.7,
      sayird: 8.7,
      voconte: 8.7,
      bill: 8.7,
      biscuit: 8.8,
      furykov: 8.8,
      halkenburg: 8.7,
      hinrigh: 8.7,
      saiyu: 8.8,
    }
    for (const id of ROSTER_WAVE_THREE_FIGHTERS)
      expect(fighterMotionScore(id).score, id).toBeGreaterThan(p8[id])
  })

  it('certifies dedicated choreography for all 360 roster attacks', () => {
    const scorecard = rosterMotionScorecard()
    expect(scorecard).toHaveLength(FIGHTING_ROSTER.length)
    expect(scorecard.flatMap(({ moves }) => moves)).toHaveLength(360)
    for (const fighter of scorecard) {
      expect(fighter.dedicatedMoves, fighter.id).toBe(9)
      expect(
        fighter.moves.every(({ source }) => source === 'dedicated'),
        fighter.id,
      ).toBe(true)
    }
  })
})
