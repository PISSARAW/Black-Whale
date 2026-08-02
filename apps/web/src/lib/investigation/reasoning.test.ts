import { describe, expect, it } from 'vitest'
import { freshKnowledgeLedger, recordClaim, type KnowledgeLedger } from './knowledge'
import { assessConclusion, type InvestigationConclusion } from './reasoning'

const conclusion: InvestigationConclusion = {
  id: 'remote-nen-attack',
  canonical: true,
  refutedBy: ['physical-weapon-found'],
  paths: [
    { id: 'witness-path', allOf: ['snakes-seen', 'no-attacker-seen'], weight: 1 },
    { id: 'forensic-path', allOf: ['nen-residue'], anyOf: ['wounds', 'death-window'], weight: 1 },
  ],
}

function know(ledger: KnowledgeLedger, propositionId: string) {
  return recordClaim(ledger, {
    id: `claim:${propositionId}`,
    propositionId,
    subjectId: 'kurapika',
    nature: 'fact',
    supports: true,
    confidence: 0.9,
    sourceEvidenceIds: [],
    learnedAt: ledger.claims.length,
  })
}

describe('investigation V3 nonlinear reasoning', () => {
  it('reports a partial conclusion and the missing proposition', () => {
    const assessment = assessConclusion(know(freshKnowledgeLedger(), 'snakes-seen'), conclusion)
    expect(assessment.status).toBe('partial')
    expect(assessment.missingPropositionIds).toContain('no-attacker-seen')
  })

  it('accepts either complete reasoning path', () => {
    let ledger = know(freshKnowledgeLedger(), 'nen-residue')
    ledger = know(ledger, 'death-window')
    const assessment = assessConclusion(ledger, conclusion)
    expect(assessment.status).toBe('established')
    expect(assessment.satisfiedPathIds).toEqual(['forensic-path'])
  })

  it('refutes a conclusion when a disqualifying proposition is established', () => {
    const assessment = assessConclusion(
      know(freshKnowledgeLedger(), 'physical-weapon-found'),
      conclusion,
    )
    expect(assessment.status).toBe('refuted')
  })
})
