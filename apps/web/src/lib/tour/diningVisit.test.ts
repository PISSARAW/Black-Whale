import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { buildCorridorWallDetails } from './corridorWallView'
import { detailTagAt } from './detailTag'
import { buildDiningHallDetails } from './diningHallView'
import {
  DINING_STAIR_SOURCE,
  DINING_TABLE_SOURCE,
  DINING_VISIT_SPACES as spaces,
  DINING_VISIT_STAIR,
  DINING_VISIT_UPPER_LANE,
  DINING_VISIT_LOWER_LANE,
  DINING_VISIT_START,
  diningVisitUrl,
  isDiningVisitStart,
} from './diningVisit'
import { diningVisitActors } from './diningVisitActors'
import { closestPointOnSegment, pointInPolygon } from './geometry'
import { resolveMovement } from './navigation'
import { StairNavigator, stairInteractionArrival } from './StairNavigator'
import type { Vec2 } from './types'

const ship = theShip()

function walkWaypoints(tierId: string, waypoints: Vec2[]) {
  const plan = ship.plans.get(tierId)!
  for (let index = 1; index < waypoints.length; index++) {
    const reached = resolveMovement(waypoints[index - 1], waypoints[index], plan.walls)
    expect(reached[0]).toBeCloseTo(waypoints[index][0], 1)
    expect(reached[1]).toBeCloseTo(waypoints[index][1], 1)
  }
}

describe('the free visit between decks 4 and 5', () => {
  it('starts on deck 4 in Free Life and keeps frame diagnostics', () => {
    const url = diningVisitUrl(new URL('https://black-whale.test/fr/tour?frames&deck=tier-1'))
    expect(isDiningVisitStart(url)).toBe(true)
    expect(url.searchParams.get('world')).toBe('free')
    expect(url.searchParams.has('frames')).toBe(true)
    expect(url.searchParams.has('deck')).toBe(false)
  })

  it('gives a clear walking line and crosses the marked landing in both directions', () => {
    const stairs = new StairNavigator(ship)
    const upper: Vec2 = [-41, -17.5]
    const lower: Vec2 = [-42, -16.5]
    walkWaypoints('tier-4', [
      DINING_VISIT_START,
      [56.8, -17.5],
      [49, -17.5],
      [49, DINING_VISIT_UPPER_LANE],
      [-36, DINING_VISIT_UPPER_LANE],
      upper,
    ])
    const other = stairs.ends.find(
      (end) => end.spaceId === spaces.passage && end.to !== spaces.landing,
    )!
    expect(Math.abs(other.at[1] - DINING_VISIT_UPPER_LANE)).toBeGreaterThan(0.8)
    const lowerFork = stairs.ends.find(
      (end) => end.spaceId === spaces.landing && end.to !== spaces.passage,
    )!
    expect(Math.abs(lowerFork.at[0] - DINING_VISIT_LOWER_LANE)).toBeGreaterThan(0.8)
    walkWaypoints('tier-5', [
      DINING_VISIT_STAIR,
      [DINING_VISIT_LOWER_LANE, -17.5],
      [DINING_VISIT_LOWER_LANE, 7],
      [29.75, 7],
      [29.75, 12.1],
    ])
    expect(
      stairs.cross({
        spaceId: spaces.passage,
        from: upper,
        at: DINING_VISIT_STAIR,
        height: 0,
        enabled: true,
      }),
    ).toMatchObject({ spaceId: spaces.landing, arrival: { at: DINING_VISIT_STAIR } })
    expect(
      stairs.cross({
        spaceId: spaces.landing,
        from: lower,
        at: DINING_VISIT_STAIR,
        height: 0,
        enabled: true,
      }),
    ).toMatchObject({ spaceId: spaces.passage, arrival: { at: DINING_VISIT_STAIR } })
  })

  it('lets the visitor turn on the landing before automatic return is rearmed', () => {
    const stairs = new StairNavigator(ship)
    stairs.arrived(spaces.passage, spaces.landing)
    const request = {
      spaceId: spaces.landing,
      from: [-43, -17.5] as Vec2,
      at: DINING_VISIT_STAIR,
      height: 0,
      enabled: true,
    }
    expect(stairs.cross(request)).toBeNull()
    expect(stairs.cross({ ...request, at: [-45, -17.5] })).toBeNull()
    expect(stairs.cross(request)?.spaceId).toBe(spaces.passage)
  })

  it('preserves the same landing and camera direction for the keyboard and touch action', () => {
    const link = ship.links.find(
      ({ from, to }) => from === spaces.passage && to === spaces.landing,
    )!
    const view = { facing: Math.PI / 2, looking: 0.15 }
    const landing = { at: DINING_VISIT_STAIR, ...view }
    expect(stairInteractionArrival({ link, to: link.to }, view)).toEqual(landing)
    expect(stairInteractionArrival({ link, to: link.from }, view)).toEqual(landing)

    const other = ship.links.find((item) => item.kind === 'stair' && item !== link)!
    expect(stairInteractionArrival({ link: other, to: other.to }, view)).toBeUndefined()
  })

  it('keeps the reconstructed routines on clear floor and out of the other world modes', () => {
    expect(diningVisitActors(ship, 'tier-4', 'FREE_LIFE')).toHaveLength(0)
    expect(diningVisitActors(ship, 'tier-5', 'CANONICAL_VISIT')).toHaveLength(0)
    expect(diningVisitActors(ship, 'tier-5', 'ALTERNATE_SIMULATION')).toHaveLength(0)
    const actors = diningVisitActors(ship, 'tier-5', 'FREE_LIFE')
    expect(actors).toHaveLength(2)
    const { walls } = ship.plans.get('tier-5')!
    for (const actor of actors) {
      const { from, to } = actor.human!.pace!
      const space = ship.spaces.get(actor.spaceId)!
      for (let i = 0; i <= 20; i++) {
        const at: Vec2 = [
          from[0] + ((to[0] - from[0]) * i) / 20,
          from[1] + ((to[1] - from[1]) * i) / 20,
        ]
        expect(pointInPolygon(at, space.footprint)).toBe(true)
        let clearance = Infinity
        for (const wall of walls) {
          const [x, z] = closestPointOnSegment(at, wall.start, wall.end)
          clearance = Math.min(clearance, Math.hypot(at[0] - x, at[1] - z))
        }
        expect(clearance, actor.id).toBeGreaterThan(0.24)
      }
    }
  })

  it('finds both source tags through the scene raycaster', () => {
    const above = ship.plans.get('tier-4')!
    const below = ship.plans.get('tier-5')!
    const sign = buildCorridorWallDetails({ THREE, plan: above, spaceId: spaces.passage })!
    const hall = buildDiningHallDetails({
      THREE,
      plan: below,
      spaceId: spaces.hall,
      reveal: false,
    })!
    const ray = new THREE.Raycaster()
    sign.updateMatrixWorld(true)
    hall.updateMatrixWorld(true)
    ray.set(new THREE.Vector3(-40, above.tier.elevation + 1.63, -17.5), new THREE.Vector3(-1, 0, 0))
    expect(detailTagAt(ray.intersectObject(sign)[0]!)).toEqual(DINING_STAIR_SOURCE)
    ray.set(new THREE.Vector3(40, below.tier.elevation + 2, 12), new THREE.Vector3(0, -1, 0))
    expect(detailTagAt(ray.intersectObject(hall)[0]!)).toEqual(DINING_TABLE_SOURCE)
  })
})
