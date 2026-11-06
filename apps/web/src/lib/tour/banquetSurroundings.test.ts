import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { blocksTheFloor, pointInPolygon, polygonsOverlap, structureFootprint } from './geometry'
import { BANQUET_SERVICE, BANQUET_SPACE } from './banquetView'
import { banquetWallRuns, galleryFront, wallBays, wallPoint } from './banquetWallLayout'
import { galleryParapetStart } from './banquetGalleries'
import { resolveMovement } from './navigation'
import { mangaViewById, viewsForSpace } from './mangaViews'

const ship = theShip()
const plan = ship.plans.get('tier-1')!
const hall = ship.spaces.get(BANQUET_SPACE)!
const galleries = plan.structures.filter(({ id }) => /-gallery-(forward|aft)-/.test(id))
const stairs = plan.structures.filter(({ id }) => id.includes('-gallery-stair-'))

describe('the banquet walls and mezzanines', () => {
  it('places every wall face inside its room and bounds panel frames to the doorway-cut run', () => {
    for (const id of [BANQUET_SPACE, BANQUET_SERVICE]) {
      const space = ship.spaces.get(id)!
      const runs = banquetWallRuns(plan, space)
      expect(runs.length).toBeGreaterThan(0)
      for (const run of runs) {
        const point = wallPoint(run, { along: run.length / 2, y: 0, inset: 0.2 })
        expect(pointInPolygon([point[0], point[2]], space.footprint)).toBe(true)
        for (const bay of wallBays(run)) {
          expect(bay.along - bay.width / 2).toBeGreaterThan(0)
          expect(bay.along + bay.width / 2).toBeLessThan(run.length)
        }
      }
    }
  })

  it('raises all five galleries above head height and opens the floor beneath them', () => {
    expect(galleries).toHaveLength(5)
    for (const gallery of galleries) {
      expect(gallery.base).toBeGreaterThan(2.7)
      expect(blocksTheFloor(gallery)).toBe(false)
      expect(galleryFront(gallery).top).toBeCloseTo(3.33)
    }
    const left = resolveMovement([-13.8, -5], [-13.8, -9], plan.walls)
    const right = resolveMovement([11.8, 7.5], [11.8, 12], plan.walls)
    expect(left[0]).toBeCloseTo(-13.8)
    expect(left[1]).toBeCloseTo(-9)
    expect(right[0]).toBeCloseTo(11.8)
    expect(right[1]).toBeCloseTo(12)
    expect(
      plan.walls.some(({ structureId }) => galleries.some(({ id }) => id === structureId)),
    ).toBe(false)
  })

  it('keeps both stair flights clear of tables, the royal dais and all room thresholds', () => {
    expect(stairs).toHaveLength(36)
    const otherFloorSolids = plan.structures.filter(
      (item) => item.spaceId === BANQUET_SPACE && !stairs.includes(item) && blocksTheFloor(item),
    )
    for (const step of stairs) {
      const footprint = structureFootprint(step)
      expect(footprint.every((point) => pointInPolygon(point, hall.footprint))).toBe(true)
      for (const other of otherFloorSolids) {
        expect(
          polygonsOverlap(footprint, structureFootprint(other)),
          `${step.id}/${other.id}`,
        ).toBe(false)
      }
    }
  })

  it('joins each flight to the gallery height through an opening in its parapet', () => {
    for (const side of ['port', 'starboard']) {
      const flight = stairs
        .filter(({ id }) => id.includes(`-${side}-`))
        .sort((a, b) => a.height - b.height)
      const last = flight.at(-1)!
      const gallery = galleries.find(
        (item) =>
          Math.abs(item.at[0] - last.at[0]) < 3 &&
          Math.abs(item.at[1] - last.at[1]) < Math.max(...item.size) / 2,
      )!
      expect(last.height).toBeCloseTo(galleryFront(gallery).top)
      expect(galleryParapetStart(gallery, plan.structures)).toBeGreaterThan(last.at[1] + 0.15)
      for (let index = 1; index < flight.length; index++) {
        expect(flight[index].height - flight[index - 1].height).toBeCloseTo(0.185)
        expect(flight[index - 1].at[1] - flight[index].at[1]).toBeCloseTo(0.3)
      }
    }
  })

  it('offers the chapter 358 gallery view from both ends without placing the camera in a solid', () => {
    const view = mangaViewById('banquet-side-galleries')!
    expect(view.chapter).toBe(358)
    for (const id of [BANQUET_SPACE, BANQUET_SERVICE]) expect(viewsForSpace(id)).toContain(view)
    expect(pointInPolygon(view.at, hall.footprint)).toBe(true)
    expect(
      plan.structures.some(
        (item) =>
          item.spaceId === BANQUET_SPACE &&
          blocksTheFloor(item) &&
          pointInPolygon(view.at, structureFootprint(item)),
      ),
    ).toBe(false)
  })
})
