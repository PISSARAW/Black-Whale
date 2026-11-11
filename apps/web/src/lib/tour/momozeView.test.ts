import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildMomozeDetails,
  momozeSurfacePlan,
  hasMomozeModel,
  MOMOZE_BEDROOM,
  MOMOZE_LIVING,
} from './momozeView'
import { MOMOZE_PRIVATE_SPACES } from './momozeView'
import { MANGA_MOMOZE_VIEWS } from './mangaMomozeViews'
import { pointInPolygon, structureFootprint } from './geometry'
import { momozeApartmentFixtures } from '$lib/components/map/projection/momozeApartmentPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1012')!
const build = (spaceId: string, changes = {}) =>
  buildMomozeDetails({ THREE, plan, spaceId, reveal: false, ...changes })!
const vertices = (group: THREE.Group) =>
  (group.children as THREE.Mesh[]).reduce(
    (n, mesh) => n + mesh.geometry.attributes.position.count,
    0,
  )

describe('Momoze’s apartment against the reception and bedroom panels', () => {
  it('keeps a valid walked plan and distinguishes panel props from six reconstructed rooms', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1012'))).toEqual([])
    expect(MOMOZE_PRIVATE_SPACES).toHaveLength(6)
    for (const spaceId of MOMOZE_PRIVATE_SPACES) {
      expect(ship.spaces.get(spaceId)!.provenance).toBe('map')
      for (const item of plan.structures.filter((item) => item.spaceId === spaceId)) {
        expect(item.provenance).toBe('map')
        expect(item.sourceFr).toContain('Reconstitution')
      }
    }
    const bed = plan.structures.find(
      (item) => item.kind === 'bed' && item.spaceId === MOMOZE_BEDROOM,
    )!
    expect(bed.size[0]).toBeGreaterThanOrEqual(3)
    expect(bed.rotation).toBe(180)
    const props = plan.structures.filter((item) => item.spaceId === MOMOZE_BEDROOM)
    expect(props).toHaveLength(4)
    expect(
      props.some((item) => item.id.endsWith('-telephone') || item.id.endsWith('-canopy-headboard')),
    ).toBe(false)
    const grille = props.find((item) => item.kind === 'vent')!
    expect(grille.base).toBeGreaterThan(2.5)
    expect(grille.rotation).toBe(180)
    expect(grille.sourceFr).toContain('lames horizontales')
    const living = plan.structures.filter((item) => item.spaceId === MOMOZE_LIVING)
    expect(living.filter((item) => item.kind === 'seat')).toHaveLength(3)
    expect(living.find((item) => item.id.endsWith('-table-05'))!.sourceFr).toContain('361')
    expect(momozeSurfacePlan(plan, false).structures).toEqual([])
    expect(momozeSurfacePlan(plan, true)).toBe(plan)
    expect(momozeApartmentFixtures.map((item) => item.id)).toEqual(
      plan.structures.filter(hasMomozeModel).map((item) => item.id),
    )
  })

  it('builds finite, bounded details for every room without extra lights or ghost furniture', () => {
    for (const id of [MOMOZE_BEDROOM, MOMOZE_LIVING, ...MOMOZE_PRIVATE_SPACES]) {
      const room = ship.spaces.get(id)!,
        full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(full.children.length).toBeGreaterThan(0)
      expect(full.children.length).toBeLessThanOrEqual(2)
      expect(vertices(full) / 3).toBeLessThan(
        [MOMOZE_BEDROOM, MOMOZE_LIVING].includes(id) ? 250_000 : 20_000,
      )
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

  it('keeps all eleven inspection cameras on clear floor and marks the six reconstructions', () => {
    expect(MANGA_MOMOZE_VIEWS).toHaveLength(11)
    for (const view of MANGA_MOMOZE_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const item of plan.structures.filter((item) => item.spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), `${view.id}/${item.id}`).toBe(
          false,
        )
      if (MOMOZE_PRIVATE_SPACES.includes(view.spaceId)) {
        expect(view.staging).toEqual([])
        expect(view.labelFr).toContain('reconstitution')
      }
    }
  })

  it('keeps the legacy grille link and corrects its attribution without staging the crime', () => {
    const grille = MANGA_MOMOZE_VIEWS.find((view) => view.id === 'momoze-bedroom-vent')!
    expect(grille.chapter).toBe(368)
    expect(grille.pages).toContain('3')
    expect(grille.labelFr).toContain('cafard')
    expect(grille.labelFr).toContain('pas une entrée attestée')
    for (const view of MANGA_MOMOZE_VIEWS) {
      expect(view.staging).toEqual([])
      expect(view.beastStaging).toContainEqual({ ownerId: 'prince-momoze', omit: true })
    }
    expect(plan.structures.some((item) => /telephone|canopy-headboard/.test(item.id))).toBe(false)
  })
})
