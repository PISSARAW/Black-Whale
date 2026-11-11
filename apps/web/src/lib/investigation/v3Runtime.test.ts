import { describe, expect, it } from 'vitest'
import { room1014Case } from './case'
import { assessHypothesesFromEvidence, assessPlayableHypothesis } from './v3Runtime'

describe('investigation V3 runtime adapter', () => {
  it('exposes partial progress before a hypothesis is established', () => {
    const assessments = assessHypothesesFromEvidence({
      hypotheses: room1014Case.hypotheses,
      evidence: room1014Case.evidence,
      discoveredEvidenceIds: ['wounds'],
      viewerId: 'kurapika',
    })
    const canonical = assessments[room1014Case.canonicalHypothesisId]
    expect(canonical.status).toBe('partial')
    expect(canonical.missingPropositionIds.length).toBeGreaterThan(0)
  })

  it('establishes the canonical hypothesis from its complete evidence path', () => {
    const hypothesis = room1014Case.hypotheses.find(
      (item) => item.id === room1014Case.canonicalHypothesisId,
    )!
    const assessments = assessHypothesesFromEvidence({
      hypotheses: room1014Case.hypotheses,
      evidence: room1014Case.evidence,
      discoveredEvidenceIds: hypothesis.requiredEvidenceIds,
      viewerId: 'kurapika',
    })
    expect(assessments[hypothesis.id].status).toBe('established')
  })

  it('drives the playable verdict from the epistemic assessment', () => {
    const verdict = assessPlayableHypothesis(room1014Case, 'ordinary-weapon', [
      'wounds',
      'loberry-vision',
    ])

    expect(verdict.status).toBe('contradicted')
    expect(verdict.contradictions.map((item) => item.id)).toEqual(['loberry-vision'])
  })
})
