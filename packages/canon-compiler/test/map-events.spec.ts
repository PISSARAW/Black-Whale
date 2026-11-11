import type { PrismaClient } from '@prisma/client'
import { describe, expect, it, vi } from 'vitest'
import { EventIndex } from '../src/map/events.js'

describe('map event index', () => {
  it('chooses the earliest ordinal when chapter sequences are tied', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'event-389', sequence: 1 })
    const prisma = {
      chapter: { upsert: vi.fn().mockResolvedValue({ id: 'chapter-389' }) },
      narrativeEvent: { findFirst },
    } as unknown as PrismaClient

    await new EventIndex(prisma).ensure(389)

    expect(findFirst).toHaveBeenCalledWith({
      where: { chapterId: 'chapter-389' },
      orderBy: [{ sequence: 'asc' }, { ordinal: 'asc' }],
    })
  })
})
