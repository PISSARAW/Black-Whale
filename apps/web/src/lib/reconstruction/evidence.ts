import type { ReconstructionSourceView } from './sourceView'

export type EvidenceLevel = 'attested' | 'derived' | 'inferred'

/**
 * What a piece of evidence is, before it is put into words.
 *
 * The reader's language is the inspector's business, so evidence carries the
 * facts — a chapter, a dating basis, a resolved source — and never a sentence.
 * Internal ids stay out of it: they are keys, not something to read.
 */
export type EvidenceSubject =
  | { kind: 'chapter'; chapter: number }
  | { kind: 'time'; basis: string; source: string | null }
  | {
      kind: 'source'
      chapter: number | null
      page: number | null
      description: string | null
      href: string | null
    }

export interface ReconstructionEvidence {
  id: string
  level: EvidenceLevel
  subject: EvidenceSubject
}

interface EventEvidenceInput {
  chapterNumber: number
  eventId: string
  occurredAtBasis?: string | null
  occurredAtSource?: string | null
  sourceIds?: string[]
  /** The sources the page already resolved; an id missing here stays unresolved. */
  sources?: readonly ReconstructionSourceView[]
}

export function evidenceForEvent(input: EventEvidenceInput): ReconstructionEvidence[] {
  const evidence: ReconstructionEvidence[] = [
    {
      id: `chapter-${input.chapterNumber}`,
      level: 'attested',
      subject: { kind: 'chapter', chapter: input.chapterNumber },
    },
  ]

  if (input.occurredAtBasis) {
    evidence.push({
      id: `time-${input.eventId}`,
      level: input.occurredAtBasis === 'stated' ? 'attested' : 'derived',
      subject: {
        kind: 'time',
        basis: input.occurredAtBasis,
        source: input.occurredAtSource ?? null,
      },
    })
  }

  const resolved = new Map((input.sources ?? []).map((source) => [source.id, source]))
  for (const sourceId of [...new Set(input.sourceIds ?? [])]) {
    evidence.push(sourceEvidence(sourceId, resolved.get(sourceId)))
  }

  return evidence
}

/** A cited source, read from its resolved record; an unresolved id is only derived. */
function sourceEvidence(id: string, source: ReconstructionSourceView | undefined) {
  if (!source) {
    return {
      id,
      level: 'derived',
      subject: { kind: 'source', chapter: null, page: null, description: null, href: null },
    } satisfies ReconstructionEvidence
  }
  return {
    id,
    level: source.kind === 'manga' ? 'attested' : 'derived',
    subject: {
      kind: 'source',
      chapter: source.chapterNumber,
      page: source.page,
      description: source.description,
      href: source.href,
    },
  } satisfies ReconstructionEvidence
}

export function claimLevel(certainty: string, precision: string): EvidenceLevel {
  if (certainty === 'CONFIRMED' && precision === 'EXACT_ROOM') return 'attested'
  if (certainty === 'PROBABLE' || certainty === 'LAST_KNOWN') return 'inferred'
  return 'derived'
}
