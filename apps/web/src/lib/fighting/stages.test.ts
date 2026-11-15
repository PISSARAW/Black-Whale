import { describe, expect, it } from 'vitest'
import { theShip } from '../tour/blueprint'
import { pointInPolygon, structureFootprint } from '../tour/geometry'
import { buildTierMesh } from '../tour/mesh'
import { COURT_BAR_RUNS, COURT_BAR_X } from '../tour/supremeCourtFurniture'
import { findFightLane, laneBackdrop } from './stageLane'
import { roomBarriers } from './stageRoomDetails'
import { roomPlan } from './stageShipRoom'
import { DEFAULT_FIGHT_STAGE, FIGHT_STAGES, fightStage } from './stages'

const ship = theShip()
const rooms = FIGHT_STAGES.filter((stage) => stage.kind === 'ship-room')

describe('fight stages', () => {
  it('offers the original hold, Heavens Arena and rooms of the visit', () => {
    expect(fightStage(DEFAULT_FIGHT_STAGE).kind).toBe('hold')
    expect(FIGHT_STAGES.some((stage) => stage.kind === 'heavens-arena')).toBe(true)
    expect(rooms.length).toBeGreaterThan(0)
    expect(new Set(FIGHT_STAGES.map((stage) => stage.id)).size).toBe(FIGHT_STAGES.length)
  })

  it('names only rooms the blueprint holds', () => {
    for (const stage of rooms) expect(ship.spaces.has(stage.spaceId ?? '')).toBe(true)
    for (const stage of FIGHT_STAGES.filter((item) => item.kind !== 'ship-room')) {
      expect(stage.spaceId).toBeNull()
    }
  })

  it.each(rooms.map((stage) => [stage.id, stage.spaceId ?? '']))(
    'finds a clear lane with a backdrop in %s',
    (_id, spaceId) => {
      const space = ship.spaces.get(spaceId)!
      const plan = roomPlan(ship, space)
      const columns = plan.columns.get(spaceId) ?? []
      const barriers = roomBarriers(spaceId)
      const lane = findFightLane(space, plan.structures, { columns, barriers })
      const solids = plan.structures.filter((item) => item.base < 2.2).map(structureFootprint)
      for (const along of [-5.7, -3, 0, 3, 5.7]) {
        const point: [number, number] = [
          lane.centre[0] + lane.direction[0] * along,
          lane.centre[1] + lane.direction[1] * along,
        ]
        expect(pointInPolygon(point, space.footprint)).toBe(true)
        expect(solids.some((solid) => pointInPolygon(point, solid))).toBe(false)
        expect(barriers.some((barrier) => pointInPolygon(point, barrier))).toBe(false)
        for (const column of columns) {
          expect(Math.hypot(point[0] - column[0], point[1] - column[1])).toBeGreaterThan(1)
        }
      }
      const [bx, bz] = laneBackdrop(lane.direction)
      expect(pointInPolygon([lane.centre[0] + bx, lane.centre[1] + bz], space.footprint)).toBe(true)
    },
  )

  it.each(rooms.map((stage) => [stage.id, stage.spaceId ?? '']))(
    'raises %s from the mesh of the visit',
    (_id, spaceId) => {
      const mesh = buildTierMesh(roomPlan(ship, ship.spaces.get(spaceId)!))
      expect(mesh.groups.map((group) => group.spaceId)).toEqual([spaceId])
      expect(mesh.positions.length).toBeGreaterThan(0)
      expect(mesh.colors.length).toBe(mesh.positions.length)
    },
  )

  it('derives the Supreme Court collision rail from the rail drawn by the visit', () => {
    const barriers = roomBarriers('tier-1-supreme-court')
    expect(barriers).toHaveLength(COURT_BAR_RUNS.length)
    for (const [index, [from, to]] of COURT_BAR_RUNS.entries()) {
      const barrier = barriers[index]
      expect(Math.min(...barrier.map(([x]) => x))).toBeLessThan(COURT_BAR_X)
      expect(Math.max(...barrier.map(([x]) => x))).toBeGreaterThan(COURT_BAR_X)
      expect(Math.min(...barrier.map(([, z]) => z))).toBeLessThan(from)
      expect(Math.max(...barrier.map(([, z]) => z))).toBeGreaterThan(to)
    }
  })
})
