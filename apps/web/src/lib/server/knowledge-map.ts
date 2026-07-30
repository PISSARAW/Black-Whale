import type { KnowledgeVisualState } from '$lib/components/perspective/types'
import type { RecordLink } from '$lib/identity/continuity'
import { prisma } from './db'

/**
 * What one character knows, believes and no longer knows, read from
 * `KnowledgeState` / `Belief` / `Fact` rather than written by hand.
 *
 * The page this feeds used to be four literal chips and a `<pre>` block naming
 * Fugetsu and Melody whoever the reader had asked about. The archive stores the
 * observer, the fact, the acquisition method, the source character and the event
 * each of those was true from — which is the whole of what the mock-up mimicked.
 */

export interface KnowledgeSubject extends RecordLink {
  type: string
}

export interface KnowledgeEntry {
  id: string
  /** Where the row came from: a knowledge state over a fact, or a bare belief. */
  origin: 'KNOWLEDGE' | 'BELIEF'
  state: KnowledgeVisualState
  subject: KnowledgeSubject
  predicate: string
  /** The value as JSON text: predicates are free-form, so it is shown verbatim. */
  value: string
  confidence: number | null
  acquisitionMethod: string | null
  /** Who told them, when the archive names an informant. */
  source: RecordLink | null
  /** The chapter the row starts at, and the one it was superseded in. */
  fromChapter: number
  untilChapter: number | null
  truthStatus: string | null
}

/** One edge of the knowledge graph: observer → subject, labelled by its state. */
export interface KnowledgeEdge {
  id: string
  from: string
  relation: KnowledgeVisualState
  to: string
  predicate: string
}

export interface KnowledgeMap {
  entries: KnowledgeEntry[]
  edges: KnowledgeEdge[]
}

const eventInclude = { include: { chapter: true } } as const

/**
 * `EpistemicState` and `AcquisitionMethod` both bear on how a row should read: a
 * fact heard from someone is reported, a rumour is a rumour whatever the reader
 * believes of it. Acquisition wins only where it is more specific than the
 * epistemic state, and an interval that has closed reads as outdated first —
 * that is the point the page exists to make.
 */
export function visualStateFor(
  epistemicState: string,
  acquisitionMethod: string | null,
  closed: boolean,
): KnowledgeVisualState {
  if (closed) return 'outdated'
  if (acquisitionMethod === 'RUMOR') return 'rumor'

  switch (epistemicState) {
    case 'KNOWN':
      return acquisitionMethod === 'TOLD_BY_OTHER' || acquisitionMethod === 'DOCUMENT'
        ? 'reported'
        : 'known'
    case 'BELIEVED':
      return 'believed'
    case 'SUSPECTED':
      return 'suspected'
    case 'DOUBTED':
      return 'contradicted'
    case 'REJECTED':
      return 'rejected'
    default:
      return 'unknown'
  }
}

/** A belief carries no epistemic state, only a confidence the archive stored. */
export function beliefStateFor(confidence: number, closed: boolean): KnowledgeVisualState {
  if (closed) return 'outdated'
  if (confidence >= 0.8) return 'believed'
  if (confidence >= 0.4) return 'suspected'
  return 'rumor'
}

/** Subject labels, resolved per subject type in one round of queries. */
async function resolveSubjects(
  subjects: Array<{ type: string; id: string }>,
): Promise<Map<string, KnowledgeSubject>> {
  const idsByType = new Map<string, Set<string>>()
  for (const subject of subjects) {
    const bucket = idsByType.get(subject.type) ?? new Set<string>()
    bucket.add(subject.id)
    idsByType.set(subject.type, bucket)
  }

  const resolved = new Map<string, KnowledgeSubject>()
  const put = (type: string, id: string, label: string, href: string | null) =>
    resolved.set(`${type}:${id}`, { type, id, label, href })

  const ids = (type: string) => [...(idsByType.get(type) ?? [])]

  const [characters, bodies, consciousnesses, locations, events] = await Promise.all([
    prisma.character.findMany({ where: { id: { in: ids('CHARACTER') } } }),
    prisma.body.findMany({ where: { id: { in: ids('BODY') } } }),
    prisma.consciousness.findMany({ where: { id: { in: ids('CONSCIOUSNESS') } } }),
    prisma.location.findMany({ where: { id: { in: ids('LOCATION') } } }),
    prisma.narrativeEvent.findMany({ where: { id: { in: ids('EVENT') } } }),
  ])

  for (const row of characters)
    put('CHARACTER', row.id, row.canonicalName, `/characters/${row.slug}`)
  for (const row of bodies) put('BODY', row.id, row.label, `/bodies/${row.id}`)
  for (const row of consciousnesses)
    put('CONSCIOUSNESS', row.id, row.label, `/consciousness/${row.id}`)
  for (const row of locations) put('LOCATION', row.id, row.name, null)
  for (const row of events) put('EVENT', row.id, row.title, null)

  // Ability, affiliation and cohort subjects keep their stored id: inventing a
  // label for them would be the mock-up's mistake in a smaller place.
  for (const subject of subjects) {
    const key = `${subject.type}:${subject.id}`
    if (!resolved.has(key)) put(subject.type, subject.id, subject.id, null)
  }

  return resolved
}

export async function loadKnowledgeMap(
  observerCharacterId: string,
  observerName: string,
  spoilerLimit: number | null,
): Promise<KnowledgeMap> {
  const chapterCap = spoilerLimit === null ? {} : { chapter: { number: { lte: spoilerLimit } } }

  const [knowledgeStates, beliefs] = await Promise.all([
    prisma.knowledgeState.findMany({
      where: { observerCharacterId, fromEvent: chapterCap },
      include: {
        fact: true,
        fromEvent: eventInclude,
        untilEvent: eventInclude,
        sourceCharacter: true,
      },
    }),
    prisma.belief.findMany({
      where: { observerCharacterId, fromEvent: chapterCap },
      include: { fromEvent: eventInclude, untilEvent: eventInclude },
    }),
  ])

  const subjects = await resolveSubjects([
    ...knowledgeStates.map((state) => ({
      type: state.fact.subjectType as string,
      id: state.fact.subjectId,
    })),
    ...beliefs.map((belief) => ({ type: belief.subjectType, id: belief.subjectId })),
  ])

  /** An interval whose end the reader may not see is reported as still open. */
  const closingChapter = (untilEvent: { chapter: { number: number } } | null): number | null => {
    if (!untilEvent) return null
    if (spoilerLimit !== null && untilEvent.chapter.number > spoilerLimit) return null
    return untilEvent.chapter.number
  }

  const fallback = (type: string, id: string): KnowledgeSubject => ({
    type,
    id,
    label: id,
    href: null,
  })

  const entries: KnowledgeEntry[] = [
    ...knowledgeStates.map((state): KnowledgeEntry => {
      const until = closingChapter(state.untilEvent)
      return {
        id: state.id,
        origin: 'KNOWLEDGE',
        state: visualStateFor(state.epistemicState, state.acquisitionMethod, until !== null),
        subject:
          subjects.get(`${state.fact.subjectType}:${state.fact.subjectId}`) ??
          fallback(state.fact.subjectType, state.fact.subjectId),
        predicate: state.fact.predicate,
        value: JSON.stringify(state.fact.value),
        confidence: state.confidence,
        acquisitionMethod: state.acquisitionMethod,
        source: state.sourceCharacter
          ? {
              id: state.sourceCharacter.id,
              label: state.sourceCharacter.canonicalName,
              href: `/characters/${state.sourceCharacter.slug}`,
            }
          : null,
        fromChapter: state.fromEvent.chapter.number,
        untilChapter: until,
        truthStatus: state.fact.truthStatus,
      }
    }),
    ...beliefs.map((belief): KnowledgeEntry => {
      const until = closingChapter(belief.untilEvent)
      return {
        id: belief.id,
        origin: 'BELIEF',
        state: beliefStateFor(belief.confidence, until !== null),
        subject:
          subjects.get(`${belief.subjectType}:${belief.subjectId}`) ??
          fallback(belief.subjectType, belief.subjectId),
        predicate: belief.predicate,
        value: JSON.stringify(belief.believedValue),
        confidence: belief.confidence,
        acquisitionMethod: null,
        source: null,
        fromChapter: belief.fromEvent.chapter.number,
        untilChapter: until,
        truthStatus: null,
      }
    }),
  ].sort((left, right) => left.fromChapter - right.fromChapter)

  return {
    entries,
    edges: entries.map((entry) => ({
      id: entry.id,
      from: observerName,
      relation: entry.state,
      to: entry.subject.label,
      predicate: entry.predicate,
    })),
  }
}
