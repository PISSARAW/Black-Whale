import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { detailTagAt, detailTagRangesOf } from './detailTag'
import {
  buildHeillyHideoutDetails,
  HEILLY_COMMUNAL,
  HEILLY_PROCESSING,
  HEILLY_OFFICE,
  HEILLY_SPACES,
  heillySurfacePlan,
} from './heillyHideoutView'
import { MANGA_HEILLY_VIEWS } from './mangaHeillyViews'
import { pointInPolygon } from './geometry'
import { HEILLY_PROCESSING_DETAIL_TAGS } from './heillyProcessingArchitecture'
import { heillyOfficeLayout } from './heillyOfficeFurniture'

const ship = theShip()
const plan = ship.plans.get('interior-heilly-hideout')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the Heil-Ly secret hideout reconstructed from chapters 394, 398, 399 and 407', () => {
  it('satisfies blueprint invariants for all rooms of the hideout', () => {
    const issues = validateBlueprint().filter((issue) =>
      Array.from(HEILLY_SPACES).some((id) => issue.includes(id)),
    )
    expect(issues).toEqual([])
  })

  it('builds finite, budgeted 3D manga details for each room of the hideout', () => {
    for (const spaceId of HEILLY_SPACES) {
      const root = buildHeillyHideoutDetails({
        THREE,
        plan,
        spaceId,
        reveal: false,
      })
      expect(root).not.toBeNull()
      expect(root!.children.length).toBeGreaterThan(0)
      expect(root!.children.length).toBeLessThanOrEqual(2)
      expect(triangles(root!)).toBeLessThan(150_000)

      for (const mesh of root!.children as THREE.Mesh[]) {
        const positions = Array.from(mesh.geometry.getAttribute('position').array)
        expect(positions.every(Number.isFinite)).toBe(true)
      }

      const space = plan.spaces.find((s) => s.id === spaceId)!
      const bounds = new THREE.Box3().setFromObject(root!)
      const floor = floorOf(space, plan.tier)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
      expect(bounds.max.y).toBeLessThanOrEqual(floor + space.ceiling! + 0.1)

      disposeBanquetDetails(root!)
    }
  })

  it('omits the reconstructed details in evidence mode and in non-hideout rooms', () => {
    expect(
      buildHeillyHideoutDetails({
        THREE,
        plan,
        spaceId: HEILLY_PROCESSING,
        reveal: true,
      }),
    ).toBeNull()

    expect(
      buildHeillyHideoutDetails({
        THREE,
        plan,
        spaceId: 'tier-1-king-living-quarters-living',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('filters coarse blueprint structures via heillySurfacePlan in walking mode', () => {
    const normalPlan = heillySurfacePlan(plan, false)
    expect(normalPlan.structures.some((s) => HEILLY_SPACES.has(s.spaceId))).toBe(false)

    const revealPlan = heillySurfacePlan(plan, true)
    expect(revealPlan.structures.some((s) => HEILLY_SPACES.has(s.spaceId))).toBe(true)
  })

  it('leaves unaffected any plans outside the Heil-Ly hideout', () => {
    const kingPlan = ship.plans.get('interior-king-quarters')!
    const filtered = heillySurfacePlan(kingPlan, false)
    expect(filtered.structures.length).toBe(kingPlan.structures.length)
  })

  it('positions all canonical manga camera views inside the appropriate rooms', () => {
    for (const view of MANGA_HEILLY_VIEWS) {
      const space = ship.spaces.get(view.spaceId)!
      expect(space).toBeDefined()
      expect(pointInPolygon(view.at, space.footprint)).toBe(true)
    }
  })

  it('stages Morena and Borksen at the negotiation table in the office view', () => {
    const view = MANGA_HEILLY_VIEWS.find((v) => v.id === 'morena-office-negotiation-game')!
    expect(view).toBeDefined()
    expect(view.chapter).toBe(407)
    expect(view.staging?.map((s) => s.characterId)).toEqual(['morena-prudo', 'borksen'])
  })

  it('matches the supplied sparse audience layout in Morena’s office', () => {
    const fixtures = plan.structures.filter(({ spaceId }) => spaceId === HEILLY_OFFICE)
    const desk = fixtures.find(({ id }) => id.endsWith('-card-table'))!
    const sofa = fixtures.find(({ id }) => id.endsWith('-office-couch'))!
    const bench = fixtures.find(({ id }) => id.endsWith('-office-wall-bench'))!

    expect(desk.size).toEqual([3.85, 1.47])
    expect(sofa.at).toEqual([12.08, 4.45])
    expect(sofa.size).toEqual([3.1, 1.35])
    expect(bench.at).toEqual([14.7, 6.15])
    expect(fixtures.some(({ id }) => id.endsWith('-guest-chair'))).toBe(false)
    expect(fixtures.some(({ id }) => id.endsWith('-hideout-desk'))).toBe(false)
  })

  it('keeps the ordinary office and the negotiation game as separate published states', () => {
    expect(heillyOfficeLayout('default')).toEqual({
      deskItems: true,
      audienceSeat: 'sofa',
    })
    expect(heillyOfficeLayout('morena-game')).toEqual({
      deskItems: false,
      audienceSeat: 'guest-chair',
    })

    const game = buildHeillyHideoutDetails({
      THREE,
      plan,
      spaceId: HEILLY_OFFICE,
      reveal: false,
      detailMode: 'morena-game',
    })
    expect(game).not.toBeNull()
    disposeBanquetDetails(game!)
  })

  it('includes camera viewpoints for processing, laundry, and communal rooms', () => {
    const ids = MANGA_HEILLY_VIEWS.map((v) => v.id)
    expect(ids).toContain('heilly-processing-room')
    expect(ids).toContain('heilly-laundry-disposal')
    expect(ids).toContain('heilly-communal-table')
  })

  it('builds the chapter 399 communal room as a dense lived-in space', () => {
    const root = buildHeillyHideoutDetails({
      THREE,
      plan,
      spaceId: HEILLY_COMMUNAL,
      reveal: false,
    })!
    expect(root).toBeDefined()
    expect(triangles(root)).toBeGreaterThan(2_000)

    const view = MANGA_HEILLY_VIEWS.find((candidate) => candidate.id === 'heilly-communal-table')!
    expect(view.chapter).toBe(399)
    expect(view.pages).toBe('170–175')
    expect(view.label).not.toContain('surveillance')
  })

  it('recreates the chapter 398 processing-room composition with Tassi facing the four-door wall', () => {
    const view = MANGA_HEILLY_VIEWS.find((v) => v.id === 'heilly-processing-room')!
    const room = ship.spaces.get(HEILLY_PROCESSING)!
    const width = room.footprint[1][0] - room.footprint[0][0]
    const depth = room.footprint[2][1] - room.footprint[1][1]

    expect(view.chapter).toBe(398)
    expect(view.staging?.map((actor) => actor.characterId)).toEqual(['tassi'])
    expect(view.staging?.[0].heading).toBe(0)
    expect(width / depth).toBeGreaterThan(1.9)
  })

  it('tags every processing-room triangle, including walls, dirt and the inferred seventh door', () => {
    const root = buildHeillyHideoutDetails({
      THREE,
      plan,
      spaceId: HEILLY_PROCESSING,
      reveal: false,
    })!
    const found = new Set<string>()

    for (const mesh of root.children as THREE.Mesh[]) {
      const ranges = detailTagRangesOf(mesh)
      let nextFace = 0
      for (const range of ranges) {
        expect(range.start).toBe(nextFace)
        expect(range.count).toBeGreaterThan(0)
        nextFace += range.count
        found.add(range.tag.id)
      }
      expect(nextFace).toBe(mesh.geometry.getAttribute('position').count / 3)
    }

    expect(found).toEqual(new Set(HEILLY_PROCESSING_DETAIL_TAGS.map(({ id }) => id)))
    expect(
      HEILLY_PROCESSING_DETAIL_TAGS.filter(({ provenance }) => provenance === 'inferred').map(
        ({ id }) => id,
      ),
    ).toEqual([`${HEILLY_PROCESSING}-camera-door`])

    root.updateMatrixWorld(true)
    const [hit] = new THREE.Raycaster(
      new THREE.Vector3(-13.14, 97.65, -11.55),
      new THREE.Vector3(0, 0, 1),
      0,
      10,
    ).intersectObject(root, true)
    expect(hit && detailTagAt(hit)?.spaceId).toBe(HEILLY_PROCESSING)
    disposeBanquetDetails(root)
  })

  it('releases all Three.js geometries and materials on disposal', () => {
    const root = buildHeillyHideoutDetails({
      THREE,
      plan,
      spaceId: HEILLY_PROCESSING,
      reveal: false,
    })!
    const parent = new THREE.Group()
    parent.add(root)

    const meshes = root.children as THREE.Mesh[]
    const disposables = meshes.flatMap((mesh) => [mesh.geometry, mesh.material as THREE.Material])
    const spies = disposables.map((res) => vi.spyOn(res, 'dispose'))

    disposeBanquetDetails(root)
    expect(root.parent).toBeNull()
    for (const spy of spies) {
      expect(spy).toHaveBeenCalledOnce()
    }
  })
})
