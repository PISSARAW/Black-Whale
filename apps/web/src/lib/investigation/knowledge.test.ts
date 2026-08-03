import { describe, expect, it } from 'vitest'
import {
  claimsKnownBy,
  freshKnowledgeLedger,
  propositionState,
  recordClaim,
  shareClaim,
} from './knowledge'

describe('investigation V3 knowledge ledger', () => {
  it('combines independent claims into an established proposition', () => {
    let ledger = freshKnowledgeLedger()
    ledger = recordClaim(ledger, {
      id: 'bill-saw-snakes',
      propositionId: 'snakes-visible',
      subjectId: 'kurapika',
      nature: 'testimony',
      supports: true,
      confidence: 0.6,
      sourceEvidenceIds: ['bill-testimony'],
      learnedAt: 1,
    })
    ledger = recordClaim(ledger, {
      id: 'sakata-saw-snakes',
      propositionId: 'snakes-visible',
      subjectId: 'kurapika',
      nature: 'testimony',
      supports: true,
      confidence: 0.55,
      sourceEvidenceIds: ['sakata-testimony'],
      learnedAt: 2,
    })

    expect(propositionState(ledger, 'snakes-visible', 'kurapika').certainty).toBe('established')
  })

  it('preserves a contradiction instead of choosing a truth silently', () => {
    let ledger = freshKnowledgeLedger()
    for (const [id, supports] of [
      ['loberry', true],
      ['furykov', false],
    ] as const) {
      ledger = recordClaim(ledger, {
        id,
        propositionId: 'doll-visible',
        subjectId: 'kurapika',
        nature: 'testimony',
        supports,
        confidence: 0.8,
        sourceEvidenceIds: [],
        learnedAt: 1,
      })
    }
    expect(propositionState(ledger, 'doll-visible').certainty).toBe('contradicted')
  })

  it('shares information with attenuation and keeps perspectives separate', () => {
    let ledger = recordClaim(freshKnowledgeLedger(), {
      id: 'private-observation',
      propositionId: 'hidden-mark',
      subjectId: 'kurapika',
      nature: 'fact',
      supports: true,
      confidence: 1,
      sourceEvidenceIds: ['mark'],
      learnedAt: 1,
    })
    ledger = shareClaim(ledger, {
      claimId: 'private-observation',
      recipientId: 'bill',
      learnedAt: 2,
    })

    expect(claimsKnownBy(ledger, 'bill')[0].confidence).toBe(0.85)
    expect(propositionState(ledger, 'hidden-mark', 'bill').certainty).toBe('established')
  })
})
