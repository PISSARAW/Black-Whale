import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { floorOf, ceilingOf, theShip, validateBlueprint } from './blueprint'
import { disposeBanquetDetails, BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  buildCamillaRoomDetails,
  camillaSurfacePlan,
  hasCamillaModel,
  CAMILLA_DINING,
  CAMILLA_ENTRANCE,
  CAMILLA_LIVING,
} from './camillaView'
import { CamillaSurface } from './camillaDetailSurface'
import { dressCamillaFurniture } from './camillaFurniture'
import { dressCamillaPicture } from './camillaPictures'
import { MANGA_CAMILLA_VIEWS } from './mangaCamillaViews'
import { pointInPolygon, structureFootprint, polygonsOverlap } from './geometry'
import {
  camillaFixtures,
  camillaPoint,
  camillaSpotAnchors,
  CAMILLA_VIEWBOX,
  camillaLivingSpotAnchors,
} from '$lib/components/map/projection/camillaPlan'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1002')!
const spaces = [CAMILLA_LIVING, CAMILLA_DINING, CAMILLA_ENTRANCE]
const build = (spaceId = CAMILLA_LIVING, overrides = {}) =>
  buildCamillaRoomDetails({ THREE, plan, spaceId, reveal: false, ...overrides })!
const vertices = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce((n, m) => n + m.geometry.attributes.position.count, 0)

function fixtureGeometry(structure: (typeof plan.structures)[number]): THREE.Group {
  const into = new BanquetDetailBuilder(THREE)
  const surface = new CamillaSurface(into, THREE, { structure, floor: 0 })
  if (structure.kind === 'painting') dressCamillaPicture(surface)
  else dressCamillaFurniture(surface)
  return into.finish()
}

describe('Camilla’s actual apartment, distinct from her VVIP detention room', () => {
  it('satisfies the shared plan and keeps the floor furniture clear of each other', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1002'))).toEqual([])
    const solids = plan.structures.filter((s) => hasCamillaModel(s) && s.base === 0)
    for (const s of solids) {
      for (const other of solids.filter((o) => o.spaceId === s.spaceId && o.id > s.id)) {
        expect(
          polygonsOverlap(structureFootprint(s), structureFootprint(other)),
          `${s.id}/${other.id}`,
        ).toBe(false)
      }
    }
  })

  it('fits each complete furniture model within its collision volume, including turned chairs', () => {
    for (const s of plan.structures.filter(
      (item) => hasCamillaModel(item) && spaces.includes(item.spaceId),
    )) {
      const root = fixtureGeometry(s)
      const footprint = structureFootprint(s)
      for (const mesh of root.children as THREE.Mesh[]) {
        const p = mesh.geometry.attributes.position
        for (let i = 0; i < p.count; i++) {
          expect(pointInPolygon([p.getX(i), p.getZ(i)], footprint), s.id).toBe(true)
          expect(p.getY(i), s.id).toBeGreaterThanOrEqual(s.base - 0.001)
          expect(p.getY(i), s.id).toBeLessThanOrEqual(s.base + s.height + 0.001)
        }
      }
      disposeBanquetDetails(root)
    }
  })

  it('keeps each room finite, inside its floor and ceiling, without extra lights or draw calls', () => {
    let total = 0
    for (const id of spaces) {
      const root = build(id),
        room = ship.spaces.get(id)!
      expect(root.children.length).toBeLessThanOrEqual(2)
      total += vertices(root) / 3
      root.traverse((o) => expect(o instanceof THREE.Light).toBe(false))
      for (const child of root.children as THREE.Mesh[]) {
        expect(Array.from(child.geometry.attributes.position.array).every(Number.isFinite)).toBe(
          true,
        )
      }
      const bounds = new THREE.Box3().setFromObject(root),
        floor = floorOf(room, plan.tier)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.001)
      expect(bounds.max.y).toBeLessThanOrEqual(floor + ceilingOf(room, plan.tier) + 0.001)
      disposeBanquetDetails(root)
    }
    expect(total).toBeLessThan(150_000)
  })

  it('replaces the coarse surface only in normal rendering and keeps the walked plan intact', () => {
    const surface = camillaSurfacePlan(plan, false)
    expect(surface.structures.some(hasCamillaModel)).toBe(false)
    expect(plan.structures.some(hasCamillaModel)).toBe(true)
    expect(surface.walls).toBe(plan.walls)
    expect(camillaSurfacePlan(plan, true)).toBe(plan)
    expect(build(CAMILLA_LIVING, { reveal: true })).toBeNull()
    expect(build('tier-1-royal-residential-sector-room-1003-bedroom')).toBeNull()
  })

  it('removes furniture decorations with their solid instead of leaving phantom seats or desks', () => {
    for (const id of spaces) {
      const full = build(id),
        empty = build(id, { plan: { ...plan, structures: [] } })
      expect(vertices(full)).toBeGreaterThan(vertices(empty))
      disposeBanquetDetails(full)
      disposeBanquetDetails(empty)
    }
  })

  it('moves and rotates the entire desk with a Hatsu-modified structure', () => {
    const desk = plan.structures.find((s) => s.id.endsWith('-living-guard-desk'))!
    const root = fixtureGeometry({ ...desk, at: [30, 20], rotation: 90 })
    const bounds = new THREE.Box3().setFromObject(root)
    expect(bounds.min.x).toBeGreaterThan(29)
    expect(bounds.max.x).toBeLessThan(31)
    expect(bounds.min.z).toBeGreaterThan(19)
    expect(bounds.max.z).toBeLessThan(21)
    disposeBanquetDetails(root)
  })

  it('stages standing guards in 389, and Camilla with Duazul only at their chapter 366 meal', () => {
    for (const view of MANGA_CAMILLA_VIEWS.filter((v) => v.chapter === 389)) {
      expect(view.staging?.some((s) => s.characterId === 'prince-camilla') ?? false).toBe(false)
      expect(view.staging?.every((s) => s.pose === 'idle') ?? true).toBe(true)
    }
    const meal = MANGA_CAMILLA_VIEWS.find((v) => v.id === 'camilla-duazul-dining')!
    expect(meal).toMatchObject({ chapter: 366, volume: 35, eventSequence: 3 })
    for (const s of meal.staging!) {
      const chair = plan.structures.find(
        (o) => o.kind === 'seat' && o.at[0] === s.at[0] && o.at[1] === s.at[1],
      )
      expect(chair, s.characterId).toBeDefined()
    }
    expect(MANGA_CAMILLA_VIEWS.some((v) => v.id === 'camilla-massage-couch')).toBe(false)
  })

  it('keeps manga camera anchors in their room and outside all furniture footprints', () => {
    for (const view of MANGA_CAMILLA_VIEWS) {
      const room = ship.spaces.get(view.spaceId)!
      expect(pointInPolygon(view.at, room.footprint), view.id).toBe(true)
      for (const s of plan.structures.filter((s) => s.spaceId === view.spaceId && s.base === 0)) {
        expect(pointInPolygon(view.at, structureFootprint(s)), `${view.id}/${s.id}`).toBe(false)
      }
    }
  })

  it('projects the current walked furniture and scene positions into the 2D plan', () => {
    expect(camillaFixtures.map((s) => s.id)).toEqual(
      plan.structures.filter(hasCamillaModel).map((s) => s.id),
    )
    const at = camillaPoint([3.6, -4.42])
    expect(camillaSpotAnchors.occupants['prince-camilla']).toEqual({
      x: Number(((at.x / CAMILLA_VIEWBOX.width) * 100).toFixed(2)),
      y: Number(((at.y / CAMILLA_VIEWBOX.height) * 100).toFixed(2)),
    })
    expect(camillaLivingSpotAnchors.occupants['prince-camilla']).toBeUndefined()
  })

  it('disposes the detail buffers and materials with the room', () => {
    const root = build()
    const disposals = (root.children as THREE.Mesh[]).flatMap((m) => [
      vi.spyOn(m.geometry, 'dispose'),
      vi.spyOn(m.material as THREE.Material, 'dispose'),
    ])
    disposeBanquetDetails(root)
    for (const dispose of disposals) expect(dispose).toHaveBeenCalledOnce()
  })
})
