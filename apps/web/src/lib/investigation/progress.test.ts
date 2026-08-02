import { describe, expect, it } from 'vitest'
import { freshProgress, parseProgress, serializeProgress } from './progress'

describe('investigation progress', () => {
  it('round-trips a valid save', () => {
    const progress = freshProgress('case-a')
    progress.started = true
    progress.discoveredIds = ['wounds']
    progress.log.push({ id: 'discovery:wounds', kind: 'DISCOVERY', label: 'Corps examiné' })

    expect(parseProgress(serializeProgress(progress), 'case-a')).toEqual(progress)
  })

  it('rejects corrupt and obsolete saves', () => {
    expect(parseProgress('{oops', 'case-a')).toEqual(freshProgress('case-a'))
    expect(parseProgress('{"version":0,"caseId":"case-a"}', 'case-a')).toEqual(
      freshProgress('case-a'),
    )
  })

  it('deduplicates stored identifiers', () => {
    const parsed = parseProgress(
      '{"version":1,"caseId":"case-a","discoveredIds":["a","a",2]}',
      'case-a',
    )
    expect(parsed.discoveredIds).toEqual(['a'])
  })
})
