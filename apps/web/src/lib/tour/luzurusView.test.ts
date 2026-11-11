import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildLuzurusDetails,
  luzurusSurfacePlan,
  hasLuzurusModel,
  LUZURUS_LIVING,
} from './luzurusView'
import { LUZURUS_PRIVATE_SPACES } from './luzurusView'
import { MANGA_LUZURUS_VIEWS } from './mangaLuzurusViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { luzurusApartmentFixtures } from '$lib/components/map/projection/luzurusApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1007')!
const build = (spaceId: string, changes = {}) =>
  buildLuzurusDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Luzurus’s apartment against the salon panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from seven reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1007'))).toEqual([])
    expect(LUZURUS_PRIVATE_SPACES).toHaveLength(7)
    for (const spaceId of LUZURUS_PRIVATE_SPACES) {
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    expect(plan.structures.some((item) => item.id.endsWith('-smoking-platform'))).toBe(false)
    for (const item of plan.structures.filter(
      (item) => item.id.includes('-cushion-') || item.id.endsWith('-smoking-table'),
    )) {
      expect(item.base).toBe(0)
      expect(item.source).toContain('366')
    }
    expect(plan.structures.filter((item) => item.id.includes('-shelving'))).toHaveLength(2)
    const television = plan.structures.find((item) => item.id.endsWith('-television'))!
    const sofa = plan.structures.find((item) => item.id.endsWith('-deep-sofa'))!
    expect(television.at[0]).toBeLessThan(sofa.at[0])
    expect(sofa.rotation).toBe(90)
    expect(luzurusSurfacePlan(plan, false).structures).toEqual([])
    expect(luzurusSurfacePlan(plan, true)).toBe(plan)
    expect(luzurusApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasLuzurusModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [LUZURUS_LIVING, ...LUZURUS_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(id === LUZURUS_LIVING ? 250_000 : 20_000)
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

  it('keeps all eleven inspection cameras on clear floor and marks the seven reconstructions', () => {
    expect(MANGA_LUZURUS_VIEWS).toHaveLength(11)
    for (const view of MANGA_LUZURUS_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (LUZURUS_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('corrects both old links to the inspected source panels and keeps them free of inferred cast', () => {
    const smoking = MANGA_LUZURUS_VIEWS.find((view) => view.id === 'luzurus-smoking-area')!
    expect(smoking.chapter).toBe(366)
    expect(smoking.pages).toContain('7')
    const salon = MANGA_LUZURUS_VIEWS.find((view) => view.id === 'luzurus-living-sofa')!
    expect(salon.chapter).toBe(386)
    expect(salon.pages).toContain('8')
    for (const view of MANGA_LUZURUS_VIEWS.filter((view) => view.spaceId === LUZURUS_LIVING)) {
      expect(view.staging).toEqual([])
      expect(view.beastStaging).toContainEqual({ ownerId: 'prince-luzurus', omit: true })
    }
  })
})
