import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { CASINO_APPROACH } from './casinoLayout'
import { linkUnderfoot } from './navigation'
import { stairInteractionArrival } from './StairNavigator'
import {
  completesRouteStep,
  offersRouteInteriorExit,
  reachesRouteStep,
  routeCheckpoint,
  TSERRIEDNICH_EXTERIOR,
  TSERRIEDNICH_HALL,
  TSERRIEDNICH_ROUTE,
  TSERRIEDNICH_ROUTE_START,
  tserriednichRouteUrl,
} from './tserriednichRoute'

describe('the chapters 418–420 walk', () => {
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

  it('limits the interior exit shortcut only in the guided suite 1004', () => {
    expect(offersRouteInteriorExit(true, TSERRIEDNICH_ROUTE_START)).toBe(false)
    expect(offersRouteInteriorExit(true, TSERRIEDNICH_ROUTE[0]!.spaceIds[0]!)).toBe(true)
    expect(offersRouteInteriorExit(false, TSERRIEDNICH_ROUTE_START)).toBe(true)
    expect(offersRouteInteriorExit(true, 'another-interior')).toBe(true)
  })

  it('waits through the cutaway before advancing beyond the lockdown', () => {
    const hall = TSERRIEDNICH_ROUTE.find(({ id }) => id === 'recreation-hall')!
    const view = {
      spaceId: TSERRIEDNICH_HALL,
      position: [41, -38] as const,
      heading: 0,
      pitch: 0,
    }
    expect(completesRouteStep(hall, { ...view, gangways: 'open' })).toBe(false)
    expect(completesRouteStep(hall, { ...view, gangways: 'cutaway' })).toBe(false)
    expect(completesRouteStep(hall, { ...view, gangways: 'closed' })).toBe(true)
  })

  it('puts step-by-step checkpoints at their guide locations and frames the quay before finishing', () => {
    for (const step of TSERRIEDNICH_ROUTE) {
      const checkpoint = routeCheckpoint(step)
      expect(step.spaceIds).toContain(checkpoint.spaceId)
      if (checkpoint.at)
        expect(reachesRouteStep(step, checkpoint.spaceId, checkpoint.at)).toBe(true)
    }
    const outside = TSERRIEDNICH_ROUTE.at(-1)!
    const checkpoint = routeCheckpoint(outside)
    const view = {
      spaceId: checkpoint.spaceId,
      position: checkpoint.at!,
      heading: checkpoint.heading!,
      pitch: checkpoint.pitch!,
      gangways: 'closed' as const,
    }
    expect(completesRouteStep(outside, view)).toBe(true)
    expect(completesRouteStep(outside, { ...view, pitch: 0 })).toBe(false)
    expect(completesRouteStep(outside, { ...view, heading: view.heading + Math.PI })).toBe(false)
  })

  it('moves from the lockdown in the hall to the reconstructed casino approach', () => {
    const hall = TSERRIEDNICH_ROUTE.findIndex(({ id }) => id === 'recreation-hall')
    expect(TSERRIEDNICH_ROUTE.slice(hall, hall + 2)).toMatchObject([
      { evidence: 'panel', spaceIds: ['tier-1-vvip-recreation-hall'] },
      { id: 'casino-connection', evidence: 'reconstructed' },
    ])
    expect(TSERRIEDNICH_ROUTE.flatMap(({ spaceIds }) => spaceIds)).not.toContain(
      'tier-1-route-a-landing',
    )
  })

  it('leads through a side door to a crossing right beside the casino entrance', () => {
    const corridor = 'tier-1-c-port-corridor'
    expect(ship.adjacency.get(TSERRIEDNICH_HALL)).toContain(CASINO_APPROACH)
    const link = ship.links.find(({ from }) => from === CASINO_APPROACH)!
    expect(link).toMatchObject({ to: corridor, kind: 'door', provenance: 'inferred' })
    expect(linkUnderfoot(ship.links, CASINO_APPROACH, link.at)?.to).toBe(corridor)
    expect(linkUnderfoot(ship.links, corridor, [-39.35, 55])).toBeNull()
    expect(stairInteractionArrival({ link, to: corridor }, { facing: 0, looking: 0 })?.at).toEqual(
      link.atTo,
    )
    expect(ship.adjacency.get(corridor)).toContain('tier-1-vip-casino')
  })

  it('keeps the two descents before the reconstructed viewpoint', () => {
    expect(TSERRIEDNICH_ROUTE.slice(-4)).toMatchObject([
      { id: 'emergency-room', evidence: 'mixed' },
      { id: 'spiral-stair', evidence: 'mixed' },
      { id: 'casino-lower-hall', evidence: 'mixed' },
      { id: 'outside', evidence: 'reconstructed', spaceIds: [TSERRIEDNICH_EXTERIOR] },
    ])
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

    expect(reaches([TSERRIEDNICH_ROUTE_START], TSERRIEDNICH_ROUTE[0]!.spaceIds)).toBe(true)
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
