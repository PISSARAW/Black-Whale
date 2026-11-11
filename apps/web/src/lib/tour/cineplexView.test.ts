import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { spawnFacing, spawnPoint, theShip, validateBlueprint } from './blueprint'
import {
  buildCineplexDetails,
  hasCineplexModel,
  isCineplexSpace,
  cineplexSurfacePlan,
  CINEPLEX_CONCESSION,
  CINEPLEX_ENTRANCE,
  CINEPLEX_SCREEN_CORRIDOR,
  CINEPLEX_TICKET_DESK,
  CINEPLEX_FOYER_PORT,
  CINEPLEX_FOYER_STARBOARD,
  CINEPLEX_SCREENS_HALL,
  CINEPLEX_SCREENS,
} from './cineplexView'
import { MANGA_CINEPLEX_VIEWS } from './mangaCineplexViews'
import { CINEPLEX_HALL_SPACES, isCineplexHallOpening } from './cineplexHallLayout'
import { mangaViewById } from './mangaViews'
import { openingHeights } from './openingHeights'
import { CINEPLEX_FORMATS } from './cineplexFormats'
import { lamplightOf, lampsOf } from './light'
import { SurfaceWalker } from './SurfaceWalker'
import {
  cineplexPoint,
  cineplexSpotAnchors,
  CINEPLEX_VIEWBOX,
} from '$lib/components/map/projection/cineplexPlan'

const ship = theShip()
const plan = ship.plans.get('interior-cineplex')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + (mesh.geometry?.getAttribute('position')?.count ?? 0) / 3,
    0,
  )

describe('the Tier 3 Cineplex concourse reconstructed from chapter 393', () => {
  it('satisfies the shared blueprint invariants for interior-cineplex', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('interior-cineplex'))).toEqual([])
  })

  it('identifies the canonical spaces of the Cineplex concourse', () => {
    expect(isCineplexSpace(CINEPLEX_CONCESSION)).toBe(true)
    expect(isCineplexSpace(CINEPLEX_ENTRANCE)).toBe(true)
    expect(isCineplexSpace(CINEPLEX_SCREEN_CORRIDOR)).toBe(true)
    expect(isCineplexSpace(CINEPLEX_TICKET_DESK)).toBe(true)
    expect(isCineplexSpace(CINEPLEX_FOYER_PORT)).toBe(true)
    expect(isCineplexSpace(CINEPLEX_FOYER_STARBOARD)).toBe(true)
    expect(isCineplexSpace(CINEPLEX_SCREENS_HALL)).toBe(true)
    for (const screenId of CINEPLEX_SCREENS) {
      expect(isCineplexSpace(screenId)).toBe(true)
    }
    expect(isCineplexSpace('tier-3-observation-deck')).toBe(false)
  })

  it('keeps the Chapter 393 concourse open from food counter to ticket desks', () => {
    const openings = plan.doorways.filter(({ a, b }) => isCineplexHallOpening(a, b))
    expect(openings).toHaveLength(10)

    for (const opening of openings) {
      const space = ship.spaces.get(opening.a)!
      const other = ship.spaces.get(opening.b)!
      const heights = openingHeights({ space, other, tier: plan.tier })
      expect(heights.bottom).toBe(heights.top)
    }
  })

  it('builds high-fidelity 3D details for concession, tickets, ramp corridor, screens hall and auditoriums', () => {
    const concessionGroup = buildCineplexDetails({
      THREE,
      plan,
      spaceId: CINEPLEX_CONCESSION,
      reveal: false,
    })!
    expect(concessionGroup).toBeDefined()
    expect(concessionGroup.name).toBe('cineplex-concession-manga-details')
    expect(triangles(concessionGroup)).toBeGreaterThan(150)
    expect(triangles(concessionGroup)).toBeLessThan(8000)

    const ticketsGroup = buildCineplexDetails({
      THREE,
      plan,
      spaceId: CINEPLEX_TICKET_DESK,
      reveal: false,
    })!
    expect(ticketsGroup).toBeDefined()
    expect(ticketsGroup.name).toBe('cineplex-tickets-manga-details')
    expect(triangles(ticketsGroup)).toBeGreaterThan(150)
    expect(triangles(ticketsGroup)).toBeLessThan(8000)

    const corridorGroup = buildCineplexDetails({
      THREE,
      plan,
      spaceId: CINEPLEX_SCREEN_CORRIDOR,
      reveal: false,
    })!
    expect(corridorGroup).toBeDefined()
    expect(corridorGroup.name).toBe('cineplex-screen-corridor-manga-details')
    expect(triangles(corridorGroup)).toBeGreaterThan(150)
    expect(triangles(corridorGroup)).toBeLessThan(8000)

    const foyerGroup = buildCineplexDetails({
      THREE,
      plan,
      spaceId: CINEPLEX_FOYER_PORT,
      reveal: false,
    })!
    expect(foyerGroup).toBeDefined()
    expect(foyerGroup.name).toBe('cineplex-foyer-port-manga-details')
    expect(triangles(foyerGroup)).toBeGreaterThan(20)

    const screensHallGroup = buildCineplexDetails({
      THREE,
      plan,
      spaceId: CINEPLEX_SCREENS_HALL,
      reveal: false,
    })!
    expect(screensHallGroup).toBeDefined()
    expect(screensHallGroup.name).toBe('cineplex-screens-hall-manga-details')
    expect(triangles(screensHallGroup)).toBeGreaterThan(100)

    const auditoriumGroup = buildCineplexDetails({
      THREE,
      plan,
      spaceId: 'tier-3-cineplex-screen-1',
      reveal: false,
    })!
    expect(auditoriumGroup).toBeDefined()
    expect(auditoriumGroup.name).toBe('cineplex-tier-3-cineplex-screen-1-manga-details')
    expect(triangles(auditoriumGroup)).toBeGreaterThan(200)
  })

  it('gives all eight auditoriums a distinct premium programme and physical treatment', () => {
    expect(CINEPLEX_FORMATS).toHaveLength(8)
    expect(new Set(CINEPLEX_FORMATS.map(({ label }) => label)).size).toBe(8)
    const triangleCounts = CINEPLEX_FORMATS.map(({ screenId }) =>
      triangles(buildCineplexDetails({ THREE, plan, spaceId: screenId, reveal: false })!),
    )
    expect(new Set(triangleCounts).size).toBeGreaterThanOrEqual(6)
  })

  it('floods the public hall with fittings while keeping projection rooms controlled', () => {
    const entrance = plan.spaces.find(({ id }) => id === CINEPLEX_ENTRANCE)!
    const projector = plan.spaces.find(({ id }) => id === CINEPLEX_SCREENS[0])!
    const onyx = plan.spaces.find(({ id }) => id === CINEPLEX_SCREENS[7])!
    const hallLight = lamplightOf(entrance, plan.tier)
    const projectorLight = lamplightOf(projector, plan.tier)
    const onyxLight = lamplightOf(onyx, plan.tier)

    expect(lampsOf(entrance.footprint, hallLight).length).toBeGreaterThan(10)
    expect(hallLight.power).toBeGreaterThan(onyxLight.power)
    expect(onyxLight.power).toBeGreaterThan(projectorLight.power)
  })

  it('arrives beside the rear aisle facing the screen instead of inside a chair row', () => {
    const auditorium = plan.spaces.find(({ id }) => id === CINEPLEX_SCREENS[3])!
    const at = spawnPoint(auditorium, plan.structures)
    expect(at[1]).toBeLessThan(20.2)
    expect(spawnFacing(auditorium, at)).toBe(Math.PI)
  })

  it('walks up the central stairs and along every seating tier', () => {
    const auditorium = plan.spaces.find(({ id }) => id === CINEPLEX_SCREENS[3])!
    const walker = new SurfaceWalker()
    let at = spawnPoint(auditorium, plan.structures)
    walker.reset(plan, at)
    const xs = auditorium.footprint.map(([x]) => x)
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
    at = walker.move(plan, { from: at, to: [centerX, at[1]], extras: [], ghost: false })
    for (let z = at[1] + 0.08; z <= 34.4; z += 0.08) {
      at = walker.move(plan, { from: at, to: [at[0], z], extras: [], ghost: false })
    }
    expect(at[1]).toBeGreaterThan(34)
  })

  it('suppresses coarse blueprint models in normal walk via cineplexSurfacePlan', () => {
    const surfaced = cineplexSurfacePlan(plan, false)
    expect(surfaced.structures.some(hasCineplexModel)).toBe(false)
    expect(surfaced.structures.some((s) => s.id.includes('screen-1-seat-row'))).toBe(false)

    // In reveal mode, all blueprint structures are preserved
    const revealed = cineplexSurfacePlan(plan, true)
    expect(revealed.structures.some(hasCineplexModel)).toBe(true)
  })

  it('returns null when in reveal mode or for unmanaged spaces', () => {
    expect(
      buildCineplexDetails({
        THREE,
        plan,
        spaceId: CINEPLEX_CONCESSION,
        reveal: true,
      }),
    ).toBeNull()

    expect(
      buildCineplexDetails({
        THREE,
        plan,
        spaceId: 'tier-3-observation-deck',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('registers canonical Chapter 393 manga camera views', () => {
    expect(MANGA_CINEPLEX_VIEWS).toHaveLength(7)
    for (const view of MANGA_CINEPLEX_VIEWS) {
      expect(view.chapter).toBe(393)
      expect(view.volume).toBe(38)
      expect(view.label).toBeDefined()
      expect(view.labelFr).toBeDefined()
    }
  })

  it('frames every zone visible in the Cineplex establishing panel', () => {
    const establishing = mangaViewById('cineplex-establishing-shot')!
    expect(establishing.spaceId).toBe(CINEPLEX_ENTRANCE)
    expect(establishing.at).toEqual([0, -12.2])
    expect(establishing.cameraDistance).toBe(3)
    expect(establishing.visibleSpaceIds).toEqual([...CINEPLEX_HALL_SPACES])
  })

  it('maps 2D SVG coordinates within the viewBox and anchors key characters', () => {
    const center = cineplexPoint([0, 0])
    expect(center.x).toBe(500)
    expect(center.y).toBe(250)

    const foodPoint = cineplexPoint([-23.2, 0])
    expect(foodPoint.x).toBeGreaterThan(0)
    expect(foodPoint.x).toBeLessThan(500)

    const ticketsPoint = cineplexPoint([23.2, 0])
    expect(ticketsPoint.x).toBeGreaterThan(500)
    expect(ticketsPoint.x).toBeLessThan(CINEPLEX_VIEWBOX.width)

    expect(cineplexSpotAnchors.occupants.hisoka).toBeDefined()
    expect(cineplexSpotAnchors.occupants['bonolenov-ndongo']).toBeDefined()
    expect(cineplexSpotAnchors.concession.x).toBeLessThan(30)
    expect(cineplexSpotAnchors.tickets.x).toBeGreaterThan(70)
  })
})
