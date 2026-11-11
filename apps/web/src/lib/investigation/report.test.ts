import { describe, expect, it } from 'vitest'
import { evaluateHypothesis, room1014Case } from './case'
import { buildFinalReport } from './report'
import { elevenSecondsDefinition } from './cases/elevenSeconds'

describe('final investigation report', () => {
  it('separates established facts, deductions and testimony', () => {
    const verdict = evaluateHypothesis(
      room1014Case,
      'hidden-nen',
      room1014Case.evidence.map((evidence) => evidence.id),
    )
    const report = buildFinalReport(elevenSecondsDefinition('fr'), verdict)

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
    expect(buildFinalReport(elevenSecondsDefinition('fr'), verdict).unknowns[0]).toContain(
      "identité de l'utilisateur",
    )
  })

  it('reads in English for an English visitor, and names the incident rather than an id', () => {
    const definition = elevenSecondsDefinition('en')
    const verdict = evaluateHypothesis(
      definition.content,
      'hidden-nen',
      definition.content.evidence.map((evidence) => evidence.id),
    )
    const report = buildFinalReport(definition, verdict)
    expect(report.disposition).toBe('Mechanism established · perpetrator unidentified')
    expect(report.unknowns[0]).toBe('The identity of the Silent Majority user')
    expect(report.subtitle).toBe('Room 1014 incident')
  })
})
