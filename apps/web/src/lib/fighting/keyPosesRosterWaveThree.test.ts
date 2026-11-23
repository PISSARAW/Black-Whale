import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { bodyPlan } from './fightBodyMotion'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { ROSTER_WAVE_THREE_FIGHTERS, ROSTER_WAVE_THREE_SLOTS } from './keyPosesRosterWaveThree'
import { moveForSlot } from './movesets'
import { fighterMotionScore } from './rosterMotionScorecard'

describe('roster motion wave three grounded fundamentals', () => {
  it('authors thirty-three distinct seven-key timelines', () => {
    const signatures = new Set<string>()
    for (const id of ROSTER_WAVE_THREE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_THREE_SLOTS) {
        const timeline = keyPoseTimeline(id, slot)!
        expect(keyPoseSource(id, slot), `${id}:${slot}`).toBe('dedicated')
        expect(timeline).toHaveLength(7)
        const contacts = timeline.filter(({ phase }) => phase === 'active')
        expect(contacts[1].pose).toEqual(contacts[0].pose)
        signatures.add(JSON.stringify(timeline))
      }
    }
    expect(signatures.size).toBe(33)
  })

  it('locks semantic support for all three grounded routes', () => {
    for (const id of ROSTER_WAVE_THREE_FIGHTERS) {
      for (const slot of ROSTER_WAVE_THREE_SLOTS) {
        const move = moveForSlot(id, slot)!
        const fighter = createFightState(id, 'hisoka').player
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
        const lead = slot !== 'standingLight'
        expect(bodyPlan(fighter, { seconds: 1, progress: 0 }), `${id}:${slot}`).toMatchObject({
          supportFoot: lead ? 'lead' : 'rear',
          pivotFoot: lead ? 'rear' : 'lead',
        })
      }
    }
  })

  it('raises every final-wave fighter above its baseline', () => {
    const baseline: Record<(typeof ROSTER_WAVE_THREE_FIGHTERS)[number], number> = {
      phinks: 7,
      zakuro: 7,
      franklin: 7.2,
      sayird: 7.2,
      voconte: 7.2,
      bill: 7.3,
      biscuit: 7.3,
      furykov: 7.3,
      halkenburg: 7.3,
      hinrigh: 7.3,
      saiyu: 7.3,
    }
    for (const id of ROSTER_WAVE_THREE_FIGHTERS)
      expect(fighterMotionScore(id).score, id).toBeGreaterThan(baseline[id])
  })
})
