import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { SurfaceWalker } from './SurfaceWalker'
import { resolveMovement } from './navigation'
import type { Vec2 } from './types'

const plan = theShip().plans.get('tier-1')!

function walkRoute(walker: SurfaceWalker, points: Vec2[]): Vec2 {
  let at = points[0]
  for (const to of points.slice(1)) {
    at = walker.move(plan, { from: at, to, extras: [], ghost: false })
    expect(at[0], `target ${to}`).toBeCloseTo(to[0], 3)
    expect(at[1], `target ${to}`).toBeCloseTo(to[1], 3)
  }
  return at
}

describe('walking every modelled staircase', () => {
  const flights = new Map<string, typeof plan.structures>()
  for (const step of plan.structures.filter(
    ({ kind, id }) => kind === 'platform' && /-stair-|-steps/.test(id),
  )) {
    const key = step.id.replace(/-\d+$/, '')
    flights.set(key, [...(flights.get(key) ?? []), step])
  }
  it('covers all five physical flights and their 68 treads', () => {
    expect(flights.size).toBe(5)
    expect([...flights.values()].reduce((count, flight) => count + flight.length, 0)).toBe(68)
  })
  it.each([...flights])('ascends and descends every tread of %s', (_id, flight) => {
    const steps = [...flight].sort((a, b) => a.height - b.height)
    const first = steps[0],
      last = steps.at(-1)!
    const walker = new SurfaceWalker()
    const start: Vec2 = [first.at[0], first.at[1] + Math.min(...first.size) / 2 + 0.6]
    let at = start
    const base = walker.reset(plan, start)
    for (const step of steps) {
      at = walkRoute(walker, [at, step.at])
      expect(walker.floor(plan, at), step.id).toBeCloseTo(base + step.height)
    }
    expect(walker.floor(plan, at)).toBeCloseTo(base + last.height)
    at = walkRoute(walker, [
      at,
      ...steps
        .slice(0, -1)
        .reverse()
        .map(({ at }) => at),
      start,
    ])
    expect(walker.floor(plan, at)).toBeCloseTo(base)
  })
  it.each([
    [-11.157, -13.8],
    [9.157, 11.8],
  ])('reaches the %s flight from the central aisle and turns onto its gallery', (x, galleryX) => {
    const walker = new SurfaceWalker()
    const at = walkRoute(walker, [
      [-1, -17],
      [-1, -19.6],
      [x, -19.6],
      [x, -25.8],
      [galleryX, -25.8],
    ])
    expect(walker.floor(plan, at)).toBeCloseTo(131.33)
    const down = walkRoute(walker, [at, [x, -25.8], [x, -19.6], [-1, -19.6], [-1, -17]])
    expect(walker.floor(plan, down)).toBe(128)
  })

  it('walks continuously over the entrance joining the two port gallery slabs', () => {
    const walker = new SurfaceWalker()
    const at = walkRoute(walker, [
      [-11.157, -20],
      [-11.157, -25.8],
      [-13.8, -25.8],
      [-13.8, 19.5],
    ])
    expect(walker.floor(plan, at)).toBeCloseTo(131.33)
  })

  it('stays behind the upper parapet and the exposed gallery ends', () => {
    const walker = new SurfaceWalker()
    const at = walkRoute(walker, [
      [9.157, -20],
      [9.157, -25.8],
      [11.8, -25.8],
      [11.8, -19],
    ])
    const end = walker.move(plan, { from: at, to: [11.8, -15], extras: [], ghost: false })
    expect(end[1]).toBeLessThanOrEqual(-17.7)
    expect(walker.floor(plan, end)).toBeCloseTo(131.33)
    const side = walker.move(plan, { from: end, to: [6, end[1]], extras: [], ghost: false })
    expect(side[0]).toBeGreaterThan(11.05)
    expect(walker.floor(plan, side)).toBeCloseTo(131.33)
  })

  it('keeps the ground beneath the galleries accessible without teleporting up', () => {
    const walker = new SurfaceWalker()
    const at = walkRoute(walker, [
      [-13.8, -5],
      [-13.8, -9],
      [-13.8, -14],
    ])
    expect(walker.floor(plan, at)).toBe(128)
  })

  it('drops to the deck when a Hatsu removes the gallery from the walked plan', () => {
    const walker = new SurfaceWalker()
    const at = walkRoute(walker, [
      [-11.157, -20],
      [-11.157, -25.8],
      [-13.8, -25.8],
    ])
    const changed = {
      ...plan,
      structures: plan.structures.filter(({ id }) => !id.includes('-gallery-')),
    }
    expect(walker.floor(changed, at)).toBe(128)
  })

  it('climbs and descends the four royal steps through their side access', () => {
    const walker = new SurfaceWalker()
    const at = walkRoute(walker, [
      [-1, -19.6],
      [-4.1, -20],
      [-4.1, -22.6],
    ])
    expect(walker.floor(plan, at)).toBe(129)
    const down = walkRoute(walker, [at, [-4.1, -20], [-1, -19.6]])
    expect(walker.floor(plan, down)).toBe(128)
  })

  it('does not climb a high stair side or cross a table at ground level', () => {
    const walker = new SurfaceWalker()
    const at = walker.move(plan, {
      from: [-8.5, -23],
      to: [-11.157, -23],
      extras: [],
      ghost: false,
    })
    expect(at[0]).toBeGreaterThan(-9.4)
    expect(walker.floor(plan, at)).toBe(128)
    const blocked = walker.move(plan, {
      from: [-5.286, -18],
      to: [-5.286, -16],
      extras: [],
      ghost: false,
    })
    expect(blocked[1]).toBeLessThan(-17.5)
  })

  it('restores ground height on a room jump and preserves ordinary collision behaviour', () => {
    const walker = new SurfaceWalker()
    const at = walkRoute(walker, [
      [-11.157, -20],
      [-11.157, -25.8],
      [-13.8, -25.8],
    ])
    expect(walker.floor(plan, at)).toBeCloseTo(131.33)
    expect(walker.reset(plan, [-1, 10])).toBe(128)
    const from: Vec2 = [-1, 10],
      to: Vec2 = [-1, 12]
    const actual = walker.move(plan, { from, to, extras: [], ghost: false })
    const expected = resolveMovement(from, to, plan.walls)
    expect(actual[0]).toBeCloseTo(expected[0])
    expect(actual[1]).toBeCloseTo(expected[1])
  })
})
