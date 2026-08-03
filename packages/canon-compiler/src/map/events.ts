import type { PrismaClient } from '@prisma/client'
import { parseChapterReference } from '../chapters.js'

/**
 * The event log, as the map needs to address it.
 *
 * A chapter reference has to become a real event before anything can be bound
 * to it, and half the bounds the catalogue sets are "the event *after* this
 * one" — a presence is half-open, so a character who dies in an event is still
 * standing there while it happens.
 */

export interface EventRef {
  id: string
  sequence: number
  chapter: { number: number }
}

interface OrderedRow {
  id: string
  sequence: number
  ordinal: number | null
  chapter: { number: number }
}

export class EventIndex {
  /**
   * Ordering the log costs one query, and `eventAfter` is called per character.
   * The cache is dropped whenever a chapter gains an event, which is the only
   * way the order can change during a run.
   */
  private ordered: OrderedRow[] | null = null

  constructor(private readonly prisma: PrismaClient) {}

  /** The chapter's event at `sequence`, creating chapter and event if needed. */
  async ensure(
    number: number,
    { sequence = null, title }: { sequence?: number | null; title?: string } = {},
  ): Promise<EventRef> {
    const chapter = await this.prisma.chapter.upsert({
      where: { number },
      update: {},
      create: { number, title: title ?? `Chapitre ${number}` },
    })
    const existing = await this.prisma.narrativeEvent.findFirst({
      where: { chapterId: chapter.id, ...(sequence === null ? {} : { sequence }) },
      orderBy: { sequence: 'asc' },
    })
    if (existing) return { id: existing.id, sequence: existing.sequence, chapter: { number } }

    const created = await this.prisma.narrativeEvent.create({
      data: {
        chapterId: chapter.id,
        sequence: sequence ?? 1,
        title: `Début du chapitre ${number}`,
        summary: `Événement de référence pour le chapitre ${number}`,
      },
    })
    this.ordered = null
    return { id: created.id, sequence: created.sequence, chapter: { number } }
  }

  /** `ch-383` or `ch-383.3` as an event; null for anything else, `ch-unknown` included. */
  async resolve(chapterId: string | null | undefined): Promise<EventRef | null> {
    const reference = parseChapterReference(chapterId)
    if (!reference) return null
    return this.ensure(reference.number, { sequence: reference.sequence })
  }

  private async all(): Promise<OrderedRow[]> {
    if (this.ordered) return this.ordered
    const events = await this.prisma.narrativeEvent.findMany({
      select: { id: true, sequence: true, ordinal: true, chapter: { select: { number: true } } },
    })
    // Ordinals are the true chronology; chapter and sequence are the fallback
    // for events the timeline pass has not numbered yet.
    this.ordered = events.sort(
      (left, right) =>
        (left.ordinal ?? Number.MAX_SAFE_INTEGER) - (right.ordinal ?? Number.MAX_SAFE_INTEGER) ||
        left.chapter.number - right.chapter.number ||
        left.sequence - right.sequence,
    )
    return this.ordered
  }

  /** The next event on the timeline, which is where an inclusive bound closes. */
  async after(event: EventRef | null): Promise<EventRef | null> {
    if (!event) return null
    const events = await this.all()
    const index = events.findIndex((candidate) => candidate.id === event.id)
    const next = index === -1 ? undefined : events[index + 1]
    return next ? { id: next.id, sequence: next.sequence, chapter: next.chapter } : null
  }

  /** Ordinal per event id, for comparing two bounds without re-querying. */
  async ordinals(): Promise<ReadonlyMap<string, number>> {
    const events = await this.all()
    return new Map(events.map((event) => [event.id, event.ordinal ?? Number.MAX_SAFE_INTEGER]))
  }
}
