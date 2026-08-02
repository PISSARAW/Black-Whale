import { describe, expect, it } from 'vitest'
import {
  projectReconstructionSource,
  resolveReconstructionSources,
  safeInternalSourceHref,
} from './sourceView'

describe('ReconstructionSourceView', () => {
  it('projects a manga source without inventing a missing page', () => {
    expect(
      projectReconstructionSource({
        id: ' source-401 ',
        chapterNumber: 401,
        page: null,
        description: '  Upper-deck corridor  ',
      }),
    ).toEqual({
      id: 'source-401',
      chapterNumber: 401,
      page: null,
      description: 'Upper-deck corridor',
      kind: 'manga',
      href: null,
    })
  })

  it('marks unresolved records without fabricating a chapter', () => {
    expect(projectReconstructionSource({ id: 'actor-id' })).toMatchObject({
      chapterNumber: null,
      page: null,
      kind: 'unresolved',
    })
  })

  it('allows internal navigation and rejects external or protocol-relative links', () => {
    expect(safeInternalSourceHref('/timeline?event=401-2')).toBe('/timeline?event=401-2')
    expect(safeInternalSourceHref('https://example.com/scan')).toBeNull()
    expect(safeInternalSourceHref('//example.com/scan')).toBeNull()
    expect(safeInternalSourceHref('/\\example.com')).toBeNull()
  })

  it('normalizes invalid page and chapter values to unknown', () => {
    expect(
      projectReconstructionSource({ id: 'invalid', chapterNumber: 0, page: 1.5 }),
    ).toMatchObject({ chapterNumber: null, page: null })
  })

  it('resolves known records and preserves an honest unresolved fallback', () => {
    expect(
      resolveReconstructionSources(
        ['source-401', 'actor-id', 'source-401'],
        [{ id: 'source-401', chapterNumber: 401, page: 12, description: 'Corridor' }],
      ),
    ).toEqual([
      {
        id: 'source-401',
        chapterNumber: 401,
        page: 12,
        description: 'Corridor',
        kind: 'manga',
        href: '/timeline?chapter=401',
      },
      {
        id: 'actor-id',
        chapterNumber: null,
        page: null,
        description: null,
        kind: 'unresolved',
        href: null,
      },
    ])
  })
})
