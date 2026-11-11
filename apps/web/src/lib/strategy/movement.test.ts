import { describe, expect, it } from 'vitest'
import { findStrategyRoute, strategyMovementGraph } from './movement'

describe('strategy movement routes', () => {
  it('finds a deterministic route and respects closed passages', () => {
    const graph = new Map([
      ['a', ['b']],
      ['b', ['a', 'c']],
      ['c', ['b']],
      ['isolated', []],
    ])
    expect(findStrategyRoute(graph, 'a', 'c')).toEqual(['a', 'b', 'c'])
    expect(findStrategyRoute(graph, 'a', 'c', new Set(['b']))).toBeNull()
    expect(findStrategyRoute(graph, 'a', 'isolated')).toBeNull()
  })

  it('uses the shared ship graph for royal rooms', () => {
    const graph = strategyMovementGraph([
      'tier-1',
      'tier-1-royal-residential-sector',
      'tier-1-royal-residential-sector-room-1001',
      'tier-1-royal-residential-sector-room-1014',
    ])
    const route = findStrategyRoute(
      graph,
      'tier-1-royal-residential-sector-room-1001',
      'tier-1-royal-residential-sector-room-1014',
    )
    expect(route?.[0]).toBe('tier-1-royal-residential-sector-room-1001')
    expect(route?.at(-1)).toBe('tier-1-royal-residential-sector-room-1014')
    expect(route!.length).toBeGreaterThan(2)
  })
})
