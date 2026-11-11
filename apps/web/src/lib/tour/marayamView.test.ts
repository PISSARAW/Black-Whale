import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildMarayamDetails,
  marayamSurfacePlan,
  hasMarayamModel,
  MARAYAM_PANEL_SPACES,
  MARAYAM_DINING,
  MARAYAM_STAFF,
} from './marayamView'
import { MARAYAM_PRIVATE_SPACES } from './marayamView'
import { MANGA_MARAYAM_VIEWS } from './mangaMarayamViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { marayamApartmentFixtures } from '$lib/components/map/projection/marayamApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1013')!
const build = (spaceId: string, changes = {}) =>
  buildMarayamDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Marayam’s apartment against the reception and bedroom panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from four reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1013'))).toEqual([])
    expect(MARAYAM_PRIVATE_SPACES).toHaveLength(4)
    for (const spaceId of MARAYAM_PRIVATE_SPACES) {
      expect(ship.spaces.get(spaceId)!.provenance).toBe('map')
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const table = plan.structures.find(
      (item) => item.spaceId === MARAYAM_DINING && item.kind === 'table',
    )!
    expect(table.height).toBeGreaterThan(0.7)
    expect(plan.structures.find((item) => item.id.endsWith('-living-child-table'))!.kind).toBe(
      'platform',
    )
    const bunks = plan.structures.filter(
      (item) => item.spaceId === MARAYAM_STAFF && item.kind === 'bed',
    )
    expect(bunks).toHaveLength(2)
    expect(bunks.every((item) => item.height > 2)).toBe(true)
    expect(
      plan.structures.find((item) => item.id.endsWith('-bedroom-child-crib'))!.sourceFr,
    ).toContain('375')
    expect(plan.structures.some((item) => item.id.endsWith('-living-framed-painting'))).toBe(false)
    expect(marayamSurfacePlan(plan, false).structures).toEqual([])
    expect(marayamSurfacePlan(plan, true)).toBe(plan)
    expect(marayamApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasMarayamModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [...MARAYAM_PANEL_SPACES, ...MARAYAM_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(MARAYAM_PANEL_SPACES.includes(id) ? 250_000 : 20_000)
      for (const mesh of full.children as THREE.Mesh[])
        expect(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite)).toBe(
          true,
        )
      const bounds = new THREE.Box3().setFromObject(full)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floorOf(room, plan.tier) - 0.01)
      expect(bounds.max.y).toBeLessThanOrEqual(
        floorOf(room, plan.tier) + ceilingOf(room, plan.tier) + 0.01,
      )
      full.traverse((object) => expect(object instanceof THREE.Light).toBe(false))
      if (plan.structures.some((item) => item.spaceId === id))
        expect(vertices(full)).toBeGreaterThan(vertices(empty))
      expect(build(id, { reveal: true })).toBeNull()
      disposeBanquetDetails(full)
      disposeBanquetDetails(empty)
    }
  })

  it('keeps all twelve inspection cameras on clear floor and marks the four reconstructions', () => {
    expect(MANGA_MARAYAM_VIEWS).toHaveLength(12)
    for (const view of MANGA_MARAYAM_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (MARAYAM_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('keeps the legacy grille link and distinguishes physical furniture from the isolated Nen room', () => {
    const grille = MANGA_MARAYAM_VIEWS.find((view) => view.id === 'marayam-living-vent')!
    expect(grille.chapter).toBe(367)
    expect(grille.pages).toContain('19')
    expect(grille.labelFr).toContain('cafard')
    for (const view of MANGA_MARAYAM_VIEWS) {
      expect(view.staging).toEqual([])
      expect(view.beastStaging).toContainEqual({ ownerId: 'prince-marayam', omit: true })
    }
    expect(plan.structures.some((item) => /portal|tunnel|duplicate/.test(item.id))).toBe(false)
  })
})
