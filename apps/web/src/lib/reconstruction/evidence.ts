export type EvidenceLevel = 'attested' | 'derived' | 'inferred'

export interface ReconstructionEvidence {
  id: string
  level: EvidenceLevel
  label: string
  detail: string | null
}

interface EventEvidenceInput {
  chapterNumber: number
  eventId: string
  occurredAtBasis?: string | null
  occurredAtSource?: string | null
  sourceIds?: string[]
}

export function evidenceForEvent(input: EventEvidenceInput): ReconstructionEvidence[] {
  const evidence: ReconstructionEvidence[] = [
    {
      id: `chapter-${input.chapterNumber}`,
      level: 'attested',
      label: `Chapter ${input.chapterNumber}`,
      detail: input.eventId,
    },
  ]

  if (input.occurredAtBasis) {
    evidence.push({
      id: `time-${input.eventId}`,
      level: input.occurredAtBasis === 'stated' ? 'attested' : 'derived',
      label: `Time · ${input.occurredAtBasis}`,
      detail: input.occurredAtSource ?? null,
    })
  }

  for (const sourceId of [...new Set(input.sourceIds ?? [])]) {
    evidence.push({
      id: sourceId,
      level: 'attested',
      label: sourceId,
      detail: null,
    })
  }

  return evidence
}

export function claimLevel(certainty: string, precision: string): EvidenceLevel {
  if (certainty === 'CONFIRMED' && precision === 'EXACT_ROOM') return 'attested'
  if (certainty === 'PROBABLE' || certainty === 'LAST_KNOWN') return 'inferred'
  return 'derived'
}
