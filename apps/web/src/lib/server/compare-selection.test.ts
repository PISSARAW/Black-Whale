import { describe, expect, it } from 'vitest'
import { resolveComparisonSelection } from './compare-selection.js'

const data = {
  characters: [{ id: 'kurapika' }, { id: 'tserriednich' }, { id: 'benjamin' }],
  events: [{ id: 'e1' }, { id: 'e2' }],
}

const resolve = (query: string) => resolveComparisonSelection(new URLSearchParams(query), data)

describe('resolveComparisonSelection', () => {
  it('defaults a bare URL to the latest event and the first two characters', () => {
    const selection = resolve('')

    expect(selection.selectedEventId).toBe('e2')
    expect(selection.selectedLeft).toBe('kurapika')
    expect(selection.selectedRight).toBe('tserriednich')
    expect(selection.compareCanonical).toBe(false)
    expect(selection.sync).toEqual({ zoom: 1, tier: 'tier-1', zone: '', subject: '' })
  })

  it('honours explicit sides and event', () => {
    const selection = resolve('eventId=e1&left=benjamin&right=kurapika')

    expect(selection).toMatchObject({
      selectedEventId: 'e1',
      selectedLeft: 'benjamin',
      selectedRight: 'kurapika',
    })
  })

  it('enables the canonical column only for exactly 1', () => {
    expect(resolve('canonical=1').compareCanonical).toBe(true)
    expect(resolve('canonical=true').compareCanonical).toBe(false)
    expect(resolve('canonical=0').compareCanonical).toBe(false)
  })

  /** NaN would propagate into the map transform and blank both panels. */
  it.each(['zoom=abc', 'zoom=', 'zoom=0', 'zoom=-2'])('falls back to zoom 1 for ?%s', (query) => {
    expect(resolve(query).sync.zoom).toBe(1)
  })

  it('keeps a valid zoom', () => {
    expect(resolve('zoom=2.5').sync.zoom).toBe(2.5)
  })

  it('yields empty selections when there is no data to default to', () => {
    const selection = resolveComparisonSelection(new URLSearchParams(''), {
      characters: [],
      events: [],
    })

    expect(selection.selectedEventId).toBe('')
    expect(selection.selectedLeft).toBe('')
    expect(selection.selectedRight).toBe('')
  })

  it('leaves the right side empty when only one character is visible', () => {
    const selection = resolveComparisonSelection(new URLSearchParams(''), {
      characters: [{ id: 'kurapika' }],
      events: [{ id: 'e1' }],
    })

    expect(selection.selectedLeft).toBe('kurapika')
    expect(selection.selectedRight).toBe('')
  })
})
