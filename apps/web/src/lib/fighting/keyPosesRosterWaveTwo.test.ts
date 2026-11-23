import { describe, expect, it } from 'vitest'
import { createFightState } from './fightState'
import { bodyPlan } from './fightBodyMotion'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { ROSTER_WAVE_TWO_FIGHTERS, ROSTER_WAVE_TWO_SLOTS } from './keyPosesRosterWaveTwo'
import { moveForSlot } from './movesets'
import { fighterMotionScore } from './rosterMotionScorecard'

describe('roster motion wave two grounded fundamentals', () => {
  it('authors thirty distinct seven-key timelines', () => {
    const signatures = new Set<string>()
    for (const id of ROSTER_WAVE_TWO_FIGHTERS) {
      for (const slot of ROSTER_WAVE_TWO_SLOTS) {
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

  it('locks the correct support and pivot in both facings', () => {
    for (const id of ROSTER_WAVE_TWO_FIGHTERS) {
      for (const slot of ROSTER_WAVE_TWO_SLOTS) {
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

  it('raises every second-wave fighter above the P4 baseline', () => {
    const baseline: Record<(typeof ROSTER_WAVE_TWO_FIGHTERS)[number], number> = {
      musse: 6.9,
      padaille: 6.9,
      rihan: 6.9,
      theta: 6.9,
      yokotani: 6.9,
      basho: 7,
      beyond: 7,
      leorio: 7,
      longhi: 7,
      lynch: 7,
    }
    for (const id of ROSTER_WAVE_TWO_FIGHTERS)
      expect(fighterMotionScore(id).score, id).toBeGreaterThan(baseline[id])
  })
})
