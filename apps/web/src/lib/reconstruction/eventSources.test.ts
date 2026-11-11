import { describe, expect, it } from 'vitest'
import { sourceIdsByEvent } from './eventSources'

describe('reconstruction event sources', () => {
  it('indexes world and presence evidence under the narrative event id', () => {
    expect(
      sourceIdsByEvent(
        [{ number: 390, events: [{ id: 'narrative-390-2', sequence: 2 }] }],
        [{ chapterNumber: 390, localSequence: 2, sourceIds: ['panel-a'] }],
        [{ fromEvent: { id: 'narrative-390-2' }, sources: [{ id: 'panel-b' }] }],
      ),
    ).toEqual({ 'narrative-390-2': ['panel-a', 'panel-b'] })
  })
})
