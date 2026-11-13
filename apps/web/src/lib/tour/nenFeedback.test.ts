import { describe, expect, it } from 'vitest'
import { appendNenCause, type NenCauseEntry } from './nenFeedback'

describe('Nen cause log', () => {
  it('keeps only the four latest typed causes', () => {
    let entries: NenCauseEntry[] = []
    for (let id = 1; id <= 5; id += 1)
      entries = appendNenCause(entries, { code: 'ACTION_ACCEPTED', action: `action-${id}` }, id)
    expect(entries.map((entry) => entry.id)).toEqual([2, 3, 4, 5])
  })
})
