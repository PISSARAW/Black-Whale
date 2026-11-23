import { describe, expect, it } from 'vitest'
import { FIGHTING_ROSTER } from './roster'
import {
  MOTION_AUDIT_SLOTS,
  fighterMotionScore,
  moveMotionScore,
  rosterMotionScorecard,
} from './rosterMotionScorecard'

describe('roster motion scorecard', () => {
  it('ranks all forty fighters and all 360 physical moves with bounded scores', () => {
    const scorecard = rosterMotionScorecard()
    expect(scorecard).toHaveLength(40)
    expect(new Set(scorecard.map(({ id }) => id)).size).toBe(40)
    expect(scorecard.flatMap(({ moves }) => moves)).toHaveLength(360)
    for (const fighter of scorecard) {
      expect(fighter.moves).toHaveLength(9)
      expect(fighter.priorityMoves).toHaveLength(3)
      for (const value of [
        fighter.score,
        fighter.mechanics,
        fighter.rhythm,
        fighter.contact,
        fighter.silhouette,
        fighter.identity,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(10)
      }
    }
  })

  it('separates dedicated choreography from generated roster coverage', () => {
    expect(moveMotionScore('kurapika', 'standingHeavy')).toMatchObject({
      source: 'dedicated',
      keys: 9,
      stagedChain: true,
      activeHold: true,
    })
    expect(moveMotionScore('bill', 'standingHeavy')).toMatchObject({
      source: 'dedicated',
      keys: 7,
      stagedChain: true,
      activeHold: true,
    })
    expect(moveMotionScore('tyson', 'standingHeavy').source).toBe('archetype')
    expect(moveMotionScore('kurapika', 'standingHeavy').score).toBeGreaterThan(
      moveMotionScore('tyson', 'standingHeavy').score,
    )
  })

  it('keeps the report deterministic and exposes an actionable bottom wave', () => {
    const first = rosterMotionScorecard()
    expect(rosterMotionScorecard()).toEqual(first)
    expect(first.slice(0, 10).every(({ priorityMoves }) => priorityMoves.length === 3)).toBe(true)
    expect(first.at(-1)!.score).toBeGreaterThan(first[0].score)
  })

  it('audits every roster id against the same nine-slot contract', () => {
    for (const { id } of FIGHTING_ROSTER) {
      const audit = fighterMotionScore(id)
      expect(audit.moves.map(({ slot }) => slot)).toEqual(MOTION_AUDIT_SLOTS)
    }
  })
})
