import { describe, expect, it } from 'vitest'
import { createSnapshotStore, snapshotKey } from './snapshotStore'

describe('the snapshot store', () => {
  it('answers a point it has already been asked', () => {
    const store = createSnapshotStore<string>()
    store.set('a', 'first')
    expect(store.get('a')).toBe('first')
    expect(store.stats).toEqual({ hits: 1, misses: 0 })
  })

  it('reports a miss rather than a stale answer', () => {
    const store = createSnapshotStore<string>()
    expect(store.get('never-asked')).toBe(null)
    expect(store.stats.misses).toBe(1)
  })

  it('drops the least recently used entry once it is full', () => {
    const store = createSnapshotStore<string>(2)
    store.set('a', 'first')
    store.set('b', 'second')
    store.set('c', 'third')
    expect(store.get('a')).toBe(null)
    expect(store.get('b')).toBe('second')
    expect(store.size).toBe(2)
  })

  // A reader moving back and forth between two chapters must not lose the one
  // they keep returning to just because a third was visited once.
  it('a read counts as use, so a revisited point survives a newcomer', () => {
    const store = createSnapshotStore<string>(2)
    store.set('a', 'first')
    store.set('b', 'second')
    store.get('a')
    store.set('c', 'third')
    expect(store.get('a')).toBe('first')
    expect(store.get('b')).toBe(null)
  })

  it('never grows past its bound, however many points are visited', () => {
    const store = createSnapshotStore<number>(3)
    for (let point = 0; point < 50; point += 1) store.set(`event-${point}`, point)
    expect(store.size).toBe(3)
  })

  // The cap is part of the answer, not of the reader: two readers standing on
  // the same event see different worlds if they have read to different points.
  it('keys a point by its event and the reader’s cap together', () => {
    expect(snapshotKey('event-1', 380)).not.toBe(snapshotKey('event-1', 416))
    expect(snapshotKey('event-1', 380)).toBe(snapshotKey('event-1', 380))
  })

  it('forgets everything on demand', () => {
    const store = createSnapshotStore<string>()
    store.set('a', 'first')
    store.clear()
    expect(store.size).toBe(0)
    expect(store.stats).toEqual({ hits: 0, misses: 0 })
  })
})
