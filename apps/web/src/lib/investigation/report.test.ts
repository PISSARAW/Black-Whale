import { describe, expect, it } from 'vitest'
import { evaluateHypothesis, room1014Case } from './case'
import { buildFinalReport } from './report'

describe('final investigation report', () => {
  it('separates established facts, deductions and testimony', () => {
    const verdict = evaluateHypothesis(
      room1014Case,
      'hidden-nen',
      room1014Case.evidence.map((evidence) => evidence.id),
    )
    const report = buildFinalReport(room1014Case, verdict)

    expect(report.established.length).toBeGreaterThan(0)
    expect(report.deductions.length).toBeGreaterThan(0)
    expect(report.testimony.length).toBeGreaterThan(0)
  })

  it('keeps the assassin identity explicitly unresolved', () => {
    const verdict = evaluateHypothesis(
      room1014Case,
      'hidden-nen',
      room1014Case.evidence.map((evidence) => evidence.id),
    )
    expect(buildFinalReport(room1014Case, verdict).unknowns[0]).toContain(
      "identité de l'utilisateur",
    )
  })
})
