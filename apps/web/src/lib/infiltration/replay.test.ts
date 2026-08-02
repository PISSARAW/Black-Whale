import { describe, expect, it } from 'vitest'
import { actionsAt, beginReplay, recordAction } from './replay'

describe('deterministic replay log', () => {
  it('preserves action order per simulation frame', () => {
    let replay = beginReplay('courier', 42)
    replay = recordAction(replay, 3, { type: 'ZETSU' })
    replay = recordAction(replay, 3, { type: 'DIVERT' })
    expect(actionsAt(replay, 3).map((action) => action.type)).toEqual(['ZETSU', 'DIVERT'])
  })
})
