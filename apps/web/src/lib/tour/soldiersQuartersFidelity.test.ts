import { describe, expect, it } from 'vitest'
import { certificationIssuesFor, evidenceFor } from './sourceBoundRoomTestSupport'
import * as THREE from 'three'
import { theShip } from './blueprint'
import { detailTagRangesOf } from './detailTag'
import { buildSourceBoundInteriorDetails } from './sourceBoundInteriorView'
import { buildCorridorWallDetails } from './corridorWallView'
import { MANGA_ROYAL_ARMY_ROOMS_VIEWS } from './mangaRoyalArmyRoomsViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { ROYAL_ARMY_LOCAL_SECTION, SOLDIERS_QUARTERS } from './royalArmyRoomsStyle'
import { soldiersQuartersBeds } from '../components/map/projection/soldiersQuartersPlan'
import { buildDoorDetails } from './doorView'
import { disposeBanquetDetails } from './banquetDetailBuilder'

describe('the map reconstruction of the soldiers’ quarters', () => {
  it('keeps eight mapped rooms and ninety-six bed symbols without published-plan claims', () => {
    const { spaces, structures } = evidenceFor('tier-1-soldiers-living-quarters')

    expect(spaces).toHaveLength(9)
    expect(spaces.filter(({ provenance }) => provenance === 'map')).toHaveLength(8)
    expect(spaces.find(({ id }) => id === SOLDIERS_QUARTERS)?.provenance).toBe('inferred')
    expect(structures).toHaveLength(96)
    expect(structures.every(({ kind, provenance }) => kind === 'bed' && provenance === 'map')).toBe(
      true,
    )
    expect(certificationIssuesFor('tier-1-soldiers-living-quarters')).toEqual([])
  })

  it('keeps the long bed axis, visible profiles and collision envelopes consistent', () => {
    const { structures } = evidenceFor(SOLDIERS_QUARTERS)
    for (const bed of structures) {
      expect(bed.size).toEqual([0.8, 1.9])
      expect(bed.height).toBe(0.66)
      expect(bed.rotation).toBe(bed.spaceId.includes('-hunters-') ? 90 : 0)
      expect(soldiersQuartersBeds.find(({ id }) => id === bed.id)?.at).toEqual(bed.at)
    }
    expect(soldiersQuartersBeds).toHaveLength(96)
  })

  it('gives all ten inspection cameras walkable anchors and explicit reconstruction labels', () => {
    const ship = theShip()
    expect(MANGA_ROYAL_ARMY_ROOMS_VIEWS).toHaveLength(10)
    for (const view of MANGA_ROYAL_ARMY_ROOMS_VIEWS) {
      const space = ship.spaces.get(view.spaceId)!
      expect(pointInPolygon(view.at, space.footprint), view.id).toBe(true)
      expect(
        ship.structures.some(
          (item) => item.spaceId === space.id && pointInPolygon(view.at, structureFootprint(item)),
        ),
        view.id,
      ).toBe(false)
      expect(view.staging).toEqual([])
      expect(view.labelFr).toMatch(/reconstitu|reconstruction|non montré/)
    }
  })

  it('removes gilded corridor dressing and marks bed profiles as estimates', () => {
    const ship = theShip()
    const plan = ship.plans.get('tier-1-b')!
    expect(buildCorridorWallDetails({ THREE, plan, spaceId: SOLDIERS_QUARTERS })).toBeNull()
    for (const space of plan.spaces.filter(({ locationId }) => locationId === SOLDIERS_QUARTERS)) {
      const root = buildSourceBoundInteriorDetails({
        THREE,
        plan,
        spaceId: space.id,
        reveal: false,
      })!
      const tags = root.children.flatMap((child) =>
        detailTagRangesOf(child as THREE.Mesh).map(({ tag }) => tag),
      )
      expect(tags.some(({ id }) => id.endsWith('floor-finish'))).toBe(false)
      expect(
        tags
          .filter(({ id }) => id.includes('-bunk-'))
          .every(
            ({ provenance, reconstructionRole }) =>
              provenance === 'inferred' && reconstructionRole === 'metric-estimate',
          ),
      ).toBe(true)
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).geometry.dispose()
      })
    }
  })

  it('uses chapter 380 for the local branch and leaves its unseen furniture unspecified', () => {
    const ship = theShip()
    const space = ship.spaces.get(ROYAL_ARMY_LOCAL_SECTION)!
    expect(space.source).toContain('Ch. 380')
    expect(ship.structures.filter(({ spaceId }) => spaceId === space.id)).toEqual([])
    expect(certificationIssuesFor(ROYAL_ARMY_LOCAL_SECTION)).toEqual([])
  })

  it('replaces inherited royal doors with tagged plain, animated reconstruction doors', () => {
    const plan = theShip().plans.get('tier-1-b')!
    const root = buildDoorDetails({ THREE, plan, spaceId: SOLDIERS_QUARTERS, reveal: false })!
    expect(root.animatedDoors!.length).toBeGreaterThan(0)
    root.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh) return
      const ranges = detailTagRangesOf(object as THREE.Mesh)
      expect(ranges.length).toBeGreaterThan(0)
      expect(
        ranges.every(
          ({ tag }) =>
            tag.provenance === 'inferred' && tag.reconstructionRole === 'functional-reconstruction',
        ),
      ).toBe(true)
    })
    disposeBanquetDetails(root)
  })
})
