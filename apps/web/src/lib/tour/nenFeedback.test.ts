import { describe, expect, it } from 'vitest'
import { appendNenCause, type NenCauseEntry } from './nenFeedback'

describe('Nen cause log', () => {
  it('keeps only the four latest typed causes', () => {
    let entries: NenCauseEntry[] = []
    for (let id = 1; id <= 5; id += 1)
      entries = appendNenCause(entries, { code: 'ACTION_ACCEPTED', action: `action-${id}` }, id)
    expect(entries.map((entry) => entry.id)).toEqual([2, 3, 4, 5])
  })

  it('keeps keys unique when several causes arrive in the same millisecond', () => {
    const first = appendNenCause([], { code: 'ACTION_ACCEPTED', action: 'TEN' }, 10)
    const second = appendNenCause(first, { code: 'ACTION_ACCEPTED', action: 'REN' }, 10)

    expect(second.map((entry) => entry.id)).toEqual([10, 11])
  })
})
