import { describe, expect, it } from 'vitest'
import { freshProgress, loadProgress, parseProgress, serializeProgress } from './progress'

describe('investigation progress', () => {
  it('round-trips a valid save', () => {
    const progress = freshProgress('case-a')
    progress.started = true
    progress.discoveredIds = ['wounds']
    progress.log.push({ id: 'discovery:wounds', kind: 'DISCOVERY', label: 'Corps examiné' })

    expect(parseProgress(serializeProgress(progress), 'case-a')).toEqual(progress)
  })

  it('rejects corrupt and unsupported saves', () => {
    expect(parseProgress('{oops', 'case-a')).toEqual(freshProgress('case-a'))
    expect(parseProgress('{"version":0,"caseId":"case-a"}', 'case-a')).toEqual(
      freshProgress('case-a'),
    )
  })

  it('upgrades supported saves by filling fields introduced later', () => {
    const parsed = parseProgress('{"version":1,"caseId":"case-a","started":true}', 'case-a')
    expect(parsed).toEqual({ ...freshProgress('case-a'), started: true })
  })

  it('moves a legacy save to its case-specific key', () => {
    const values = new Map<string, string>([
      [
        'black-whale:investigation:room-1014',
        '{"version":3,"caseId":"eleven-seconds","started":true,"discoveredIds":["body"]}',
      ],
    ])
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    }

    const progress = loadProgress(
      storage,
      'eleven-seconds',
      'black-whale:investigation:case:eleven-seconds',
    )

    expect(progress.discoveredIds).toEqual(['body'])
    expect(values.has('black-whale:investigation:room-1014')).toBe(false)
    expect(values.has('black-whale:investigation:case:eleven-seconds')).toBe(true)
  })

  it('deduplicates stored identifiers', () => {
    const parsed = parseProgress(
      '{"version":4,"caseId":"case-a","discoveredIds":["a","a",2]}',
      'case-a',
    )
    expect(parsed.discoveredIds).toEqual(['a'])
  })

  it('restores and bounds the last investigation context', () => {
    const parsed = parseProgress(
      '{"version":5,"caseId":"case-a","activeTab":"timeline","activeSubjectId":"guard","replaySecond":99}',
      'case-a',
    )
    expect(parsed.activeTab).toBe('timeline')
    expect(parsed.activeSubjectId).toBe('guard')
    expect(parsed.replaySecond).toBe(11)
  })

  it('migrates V5 saves with an empty social state', () => {
    const parsed = parseProgress('{"version":5,"caseId":"case-a","started":true}', 'case-a')
    expect(parsed.witnessDispositions).toEqual({})
  })
})
