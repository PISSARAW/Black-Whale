import { describe, expect, it } from 'vitest'
import { PIT, TIERS, tierTop, tierZ } from '../../heavensArenaLayout'
import {
  NO_DAMAGE,
  advanceDamage,
  damageFromBlast,
  damagedGroundY,
  visibilityThroughSmoke,
} from './damage'
import {
  BALCONY,
  EXITS,
  STAND_FRONT,
  groundAt,
  landingSurface,
  railBetween,
  surfacesAt,
} from './geometry'
import {
  CHROLLO_MOVES,
  HISOKA_MOVES,
  SPECTATOR_MOVES,
  arenaGraph,
  findPath,
  nearestExitRoute,
} from './navigation'

describe('playable stands', () => {
  it('walks on the ring, the pit, the rows and the aisle stairs', () => {
    expect(groundAt(0, 0.3)).toEqual({ kind: 'ring', y: 0 })
    expect(groundAt(15, 0)).toEqual({ kind: 'pit', y: -PIT })
    expect(groundAt(5, tierZ(3))).toMatchObject({ kind: 'tier', tier: 3, y: tierTop(3) })
    const low = groundAt(0, tierZ(1))!
    const high = groundAt(0, tierZ(6))!
    expect(low.kind).toBe('stairs')
    expect(high.y).toBeGreaterThan(low.y)
  })

  it('adds the balcony above the last rows and lands a falling body on the right level', () => {
    const z = (BALCONY.zFront + BALCONY.zBack) / 2
    expect(surfacesAt(0, z).map((surface) => surface.kind)).toContain('balcony')
    expect(landingSurface({ x: 0, y: BALCONY.y + 2, z })?.kind).toBe('balcony')
    expect(landingSurface({ x: 0, y: BALCONY.y - 1, z })?.kind).not.toBe('balcony')
  })

  it('stops a body at the pit barrier except at the aisle mouths', () => {
    const front = { x: 5, y: tierTop(0), z: STAND_FRONT - 0.3 }
    const pit = { x: 5, y: -PIT, z: STAND_FRONT + 0.6 }
    expect(railBetween(front, pit)?.id).toBe('pit-barrier')
    expect(railBetween({ ...front, x: 0 }, { ...pit, x: 0 })).toBeNull()
    expect(railBetween({ ...front, y: 2 }, { ...pit, y: 2 })).toBeNull()
  })

  it('routes spectators by stairs only, and lets fighters jump or swing', () => {
    const graph = arenaGraph()
    const seat = `tier:4:-5.75`
    const exitRoute = nearestExitRoute(graph, graph.nodes.get(seat)!.at)
    expect(EXITS.map((exit) => exit.id)).toContain(exitRoute.at(-1))
    const toBalcony = { from: 'ring:centre', to: 'balcony:0' }
    expect(findPath(graph, { ...toBalcony, moves: SPECTATOR_MOVES })).not.toBeNull()
    expect(findPath(graph, { ...toBalcony, moves: HISOKA_MOVES })).toEqual([
      'ring:centre',
      'truss',
      'balcony:0',
    ])
    const jumped = findPath(graph, {
      from: 'pit:-11.5',
      to: `tier:${TIERS - 1}:-5.75`,
      moves: CHROLLO_MOVES,
    })!
    expect(jumped.length).toBeLessThan(
      findPath(graph, { from: 'pit:-11.5', to: `tier:${TIERS - 1}:-5.75`, moves: SPECTATOR_MOVES })!
        .length + 1,
    )
  })

  it('leaves a crater, fire and smoke that thins out with time', () => {
    const blast = { at: { x: 2, y: 0, z: 0.3 }, power: 3 }
    const damage = damageFromBlast(NO_DAMAGE, blast)
    expect(damagedGroundY(damage, 2, 0.3)).toBeLessThan(0)
    expect(damage.fires).toHaveLength(1)
    const through = visibilityThroughSmoke(damage, { x: -6, y: 0, z: 0.3 }, { x: 8, y: 0, z: 0.3 })
    expect(through).toBeLessThan(1)
    let later = damage
    for (let frame = 0; frame < 60 * 41; frame += 1) later = advanceDamage(later)
    expect(later.smoke).toHaveLength(0)
    expect(later.craters).toHaveLength(1)
  })
})
