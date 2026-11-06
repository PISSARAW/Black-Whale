import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import {
  enterGangway,
  gangwayDirection,
  gangwayFloor,
  gangwayPaths,
  stepGangway,
  type GangwayWalk,
} from './gangwayNavigation'
import type { Vec2 } from './types'
const paths = gangwayPaths(theShip())

describe('walking the royal gangways', () => {
  it('walks all three routes continuously, uphill and back down, to their actual interiors', () => {
    expect(paths).toHaveLength(3)
    for (const path of paths)
      for (const reverse of [false, true]) {
        const walk: GangwayWalk = { path, reverse, progress: 0, auto: false }
        let at: Vec2 = [...(reverse ? path.to : path.from)]
        let previousY = gangwayFloor(walk)
        let arrived = false
        const direction = gangwayDirection(walk)
        for (let frame = 0; frame < 4000 && !arrived; frame++) {
          const step = stepGangway(walk, at, [(direction[0] * 2.1) / 60, (direction[1] * 2.1) / 60])
          expect(Math.abs(step.floor - previousY)).toBeLessThan(0.04)
          expect(Math.hypot(step.at[0] - at[0], step.at[1] - at[1])).toBeLessThan(0.04)
          expect(step.returned).toBe(false)
          previousY = step.floor
          at = step.at
          walk.progress = step.progress
          arrived = step.arrived
          if (arrived) {
            expect(step.destination).toBe(reverse ? path.link.from : path.link.to)
            expect(step.destinationAt).toEqual(reverse ? path.from : path.to)
          }
        }
        expect(arrived).toBe(true)
        expect(previousY).toBeCloseTo(reverse ? path.fromY : path.toY, 6)
      }
  })
  it('requires an extended bridge and a movement towards its boarding point', () => {
    const path = paths[0],
      walk = { path, reverse: false, progress: 0, auto: false },
      direction = gangwayDirection(walk)
    const request = { tierId: path.fromTier, at: path.from, movement: direction, open: true }
    expect(enterGangway(paths, request)?.path).toBe(path)
    expect(enterGangway(paths, { ...request, open: false })).toBeNull()
    expect(enterGangway(paths, { ...request, movement: [-direction[0], -direction[1]] })).toBeNull()
    expect(enterGangway(paths, { ...request, at: [-1000, 1000] })).toBeNull()
  })
  it('keeps a visitor between the rails and allows turning back to the same quay', () => {
    const path = paths[0],
      walk = { path, reverse: false, progress: 0, auto: false },
      direction = gangwayDirection(walk)
    const middle: Vec2 = [(path.from[0] + path.to[0]) / 2, (path.from[1] + path.to[1]) / 2]
    const sideways = stepGangway(walk, middle, [-direction[1] * 50, direction[0] * 50])
    const lateral = Math.abs(
      -(sideways.at[0] - path.from[0]) * direction[1] +
        (sideways.at[1] - path.from[1]) * direction[0],
    )
    expect(lateral).toBeCloseTo(1.4, 6)
    const back = stepGangway(walk, path.from, [-direction[0], -direction[1]])
    expect(back.returned).toBe(true)
    expect(back.floor).toBe(path.fromY)
  })
})
