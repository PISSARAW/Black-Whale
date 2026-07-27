import { describe, expect, it, vi } from 'vitest'
import { KnowledgeEngine } from '../src/index.js'

const EVENT = { id: 'event-3', sequence: 3, ordinal: 30, chapter: { number: 405 } }
const EARLIER = { id: 'event-1', sequence: 1, ordinal: 10, chapter: { number: 401 } }
const LATER = { id: 'event-9', sequence: 9, ordinal: 90, chapter: { number: 412 } }

function knowledgeRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    observerCharacterId: 'kurapika',
    factId: 'fact-prince-dead',
    fromEventId: 'event-1',
    untilEventId: null,
    epistemicState: 'KNOWN',
    confidence: 0.9,
    acquisitionMethod: 'WITNESSED',
    sourceCharacterId: null,
    acquisitionEventId: 'event-1',
    fromEvent: EARLIER,
    untilEvent: null,
    fact: { id: 'fact-prince-dead', subjectId: 'prince-woble' },
    ...overrides,
  }
}

function beliefRow(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    observerCharacterId: 'kurapika',
    subjectType: 'CHARACTER',
    subjectId: 'tserriednich',
    predicate: 'location',
    believedValue: 'tier-1',
    fromEventId: 'event-1',
    untilEventId: null,
    confidence: 0.5,
    sourceEventId: 'event-1',
    fromEvent: EARLIER,
    untilEvent: null,
    ...overrides,
  }
}

function fakePrisma(options: {
  event?: typeof EVENT | null
  knowledge?: unknown[]
  beliefs?: unknown[]
  facts?: unknown[]
}) {
  return {
    narrativeEvent: { findUnique: async () => (options.event === undefined ? EVENT : options.event) },
    knowledgeState: { findMany: vi.fn(async () => options.knowledge ?? []) },
    belief: { findMany: vi.fn(async () => options.beliefs ?? []) },
    fact: { findMany: vi.fn(async () => options.facts ?? []) },
  } as never
}

describe('KnowledgeEngine.getKnowledgeOf', () => {
  it('returns what the observer knows at that point', async () => {
    const engine = new KnowledgeEngine(fakePrisma({ knowledge: [knowledgeRow('k1')] }))
    const states = await engine.getKnowledgeOf({ observerId: 'kurapika', eventId: 'event-3' })

    expect(states).toHaveLength(1)
    expect(states[0]?.epistemicState).toBe('KNOWN')
  })

  it('drops knowledge the observer no longer holds', async () => {
    // A retracted belief: the record was closed by the target event itself.
    const engine = new KnowledgeEngine(
      fakePrisma({ knowledge: [knowledgeRow('k1', { untilEvent: EVENT })] }),
    )

    expect(await engine.getKnowledgeOf({ observerId: 'kurapika', eventId: 'event-3' })).toEqual([])
  })

  it('drops knowledge the observer has not acquired yet', async () => {
    const engine = new KnowledgeEngine(
      fakePrisma({ knowledge: [knowledgeRow('k1', { fromEvent: LATER })] }),
    )

    expect(await engine.getKnowledgeOf({ observerId: 'kurapika', eventId: 'event-3' })).toEqual([])
  })

  it('narrows the query to one subject when asked', async () => {
    const prisma = fakePrisma({ knowledge: [] })
    const engine = new KnowledgeEngine(prisma)
    await engine.getKnowledgeOf({ observerId: 'kurapika', eventId: 'event-3', subjectId: 'prince-woble' })

    const call = (prisma as unknown as { knowledgeState: { findMany: { mock: { calls: unknown[][] } } } })
      .knowledgeState.findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> }
    expect(call.where).toMatchObject({
      observerCharacterId: 'kurapika',
      fact: { subjectId: 'prince-woble' },
    })
  })

  it('refuses an unknown event rather than returning nothing', async () => {
    const engine = new KnowledgeEngine(fakePrisma({ event: null }))
    await expect(engine.getKnowledgeOf({ observerId: 'kurapika', eventId: 'nope' })).rejects.toThrow(
      /Event nope not found/,
    )
  })
})

describe('KnowledgeEngine.getBeliefsOf', () => {
  it('returns a belief that still holds, false or not', async () => {
    const engine = new KnowledgeEngine(fakePrisma({ beliefs: [beliefRow('b1')] }))
    const beliefs = await engine.getBeliefsOf({ observerId: 'kurapika', eventId: 'event-3' })

    expect(beliefs).toHaveLength(1)
    expect(beliefs[0]?.believedValue).toBe('tier-1')
  })

  it('drops a belief that has been corrected', async () => {
    const engine = new KnowledgeEngine(fakePrisma({ beliefs: [beliefRow('b1', { untilEvent: EVENT })] }))

    expect(await engine.getBeliefsOf({ observerId: 'kurapika', eventId: 'event-3' })).toEqual([])
  })

  it('filters beliefs by subject directly, not through a fact', async () => {
    const prisma = fakePrisma({ beliefs: [] })
    const engine = new KnowledgeEngine(prisma)
    await engine.getBeliefsOf({ observerId: 'kurapika', eventId: 'event-3', subjectId: 'tserriednich' })

    const call = (prisma as unknown as { belief: { findMany: { mock: { calls: unknown[][] } } } })
      .belief.findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> }
    expect(call.where).toMatchObject({ observerCharacterId: 'kurapika', subjectId: 'tserriednich' })
  })
})
