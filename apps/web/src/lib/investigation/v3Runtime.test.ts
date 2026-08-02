import { describe, expect, it } from 'vitest'
import { room1014Case } from './case'
import { assessHypothesesFromEvidence } from './v3Runtime'

describe('investigation V3 runtime adapter', () => {
  it('exposes partial progress before a hypothesis is established', () => {
    const assessments = assessHypothesesFromEvidence(
      room1014Case.hypotheses,
      room1014Case.evidence,
      ['wounds'],
      'kurapika',
    )
    const canonical = assessments[room1014Case.canonicalHypothesisId]
    expect(canonical.status).toBe('partial')
    expect(canonical.missingPropositionIds.length).toBeGreaterThan(0)
  })

  it('establishes the canonical hypothesis from its complete evidence path', () => {
    const hypothesis = room1014Case.hypotheses.find(
      (item) => item.id === room1014Case.canonicalHypothesisId,
    )!
    const assessments = assessHypothesesFromEvidence(
      room1014Case.hypotheses,
      room1014Case.evidence,
      hypothesis.requiredEvidenceIds,
      'kurapika',
    )
    expect(assessments[hypothesis.id].status).toBe('established')
  })
})
