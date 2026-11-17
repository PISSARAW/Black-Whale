import { describe, expect, it } from 'vitest'
import { FIGHT_SCREENS, fightScreen, routeTransitionKey } from './fightNavigation'

describe('Clash preparation navigation', () => {
  it('uses one persistent runtime across every preparation and battle page', () => {
    for (const prefix of ['', '/fr']) {
      const key = routeTransitionKey(`${prefix}/fighting`)
      for (const screen of FIGHT_SCREENS) {
        const path = `${prefix}/fighting/${screen}`
        expect(fightScreen(path)).toBe(screen)
        expect(routeTransitionKey(path)).toBe(key)
      }
    }
  })

  it('keeps language changes, online duels and unrelated routes independent', () => {
    const key = routeTransitionKey('/fr/fighting')
    for (const path of ['/fighting', '/fr/fighting/pvp', '/fr/fighting/pvp/123', '/fr/ship'])
      expect(routeTransitionKey(path)).not.toBe(key)
    expect(routeTransitionKey('/fr/ship')).toBe('/fr/ship')
    expect(fightScreen('/fr/fighting')).toBe('menu')
  })
})
