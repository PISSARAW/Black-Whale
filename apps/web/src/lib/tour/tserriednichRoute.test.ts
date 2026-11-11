import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import {
  reachesRouteStep,
  TSERRIEDNICH_EXTERIOR,
  TSERRIEDNICH_ROUTE,
  TSERRIEDNICH_ROUTE_START,
  tserriednichRouteUrl,
} from './tserriednichRoute'

describe('the chapters 419–420 walk', () => {
  const ship = theShip()

  it('only names spaces that exist in the walkable ship', () => {
    for (const step of TSERRIEDNICH_ROUTE) {
      for (const id of step.spaceIds) expect(ship.spaces.has(id), `${step.id}: ${id}`).toBe(true)
    }
    expect(ship.spaces.has(TSERRIEDNICH_ROUTE_START)).toBe(true)
    expect(ship.spaces.has(TSERRIEDNICH_EXTERIOR)).toBe(true)
  })

  it('distinguishes a casino waypoint from merely entering the same room', () => {
    const swamp = TSERRIEDNICH_ROUTE.find(({ id }) => id === 'swamp-ball')!
    expect(reachesRouteStep(swamp, 'tier-1-vip-casino', [-49, 34])).toBe(true)
    expect(reachesRouteStep(swamp, 'tier-1-vip-casino', [-49, 8])).toBe(false)
  })

  it('remains walkable in order while every retractable bridge is withdrawn', () => {
    const blocked = new Set(
      ship.links
        .filter(({ retractable }) => retractable)
        .flatMap(({ from, to }) => [`${from}>${to}`, `${to}>${from}`]),
    )
    const reaches = (from: readonly string[], to: readonly string[]) => {
      const wanted = new Set(to)
      const seen = new Set(from)
      const queue = [...from]
      for (const id of queue) {
        if (wanted.has(id)) return true
        for (const next of ship.adjacency.get(id) ?? []) {
          if (seen.has(next) || blocked.has(`${id}>${next}`)) continue
          seen.add(next)
          queue.push(next)
        }
      }
      return false
    }

    for (let index = 1; index < TSERRIEDNICH_ROUTE.length; index += 1) {
      const previous = TSERRIEDNICH_ROUTE[index - 1]!
      const next = TSERRIEDNICH_ROUTE[index]!
      expect(reaches(previous.spaceIds, next.spaceIds), `${previous.id} → ${next.id}`).toBe(true)
    }
  })

  it('builds a restart URL without stale deck or manga framing', () => {
    const url = tserriednichRouteUrl(
      new URL('https://black-whale.test/tour?deck=tier-2&mangaView=old&eventId=e'),
    )
    expect(url.searchParams.get('space')).toBe(TSERRIEDNICH_ROUTE_START)
    expect(url.searchParams.get('route')).toBe('tserriednich-419-420')
    expect(url.searchParams.has('deck')).toBe(false)
    expect(url.searchParams.has('mangaView')).toBe(false)
    expect(url.searchParams.get('eventId')).toBe('e')
  })
})
