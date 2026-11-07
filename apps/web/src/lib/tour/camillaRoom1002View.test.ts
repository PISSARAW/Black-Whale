import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildCamillaRoomDetails,
  CAMILLA_DINING,
  CAMILLA_ENTRANCE,
  CAMILLA_LIVING,
  CAMILLA_ROOM_1002,
} from './camillaView'
import { MANGA_CAMILLA_VIEWS } from './mangaCamillaViews'
import { MANGA_VIEWS } from './mangaViews'
import {
  camillaDiningSpotAnchors,
  camillaEntranceSpotAnchors,
  camillaLivingSpotAnchors,
  camillaPoint,
  camillaSpotAnchors,
  CAMILLA_VIEWBOX,
} from '$lib/components/map/projection/camillaPlan'
import { spotAnchorFor } from '$lib/components/map/projection/roomAnchors'
import type { MapMarker } from '$lib/components/map/projection/types'

const ship = theShip()
const plan = ship.plans.get('interior-room-1002')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

function hasInfiniteCoords(root: THREE.Group): boolean {
  for (const child of root.children as THREE.Mesh[]) {
    const pos = child.geometry.getAttribute('position')
    for (let i = 0; i < pos.count * 3; i++) {
      if (!Number.isFinite(pos.array[i])) return true
    }
  }
  return false
}

describe('Princess Camilla Room 1002 reconstructed from chapters 366, 389 and 413', () => {
  it('satisfies the shared blueprint invariants for Room 1002', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('1002'))).toEqual([])
  })

  it('contains the 8 interior spaces of apartment 1002 in the blueprint', () => {
    const spaces = plan.spaces.filter(({ id }) => id.startsWith(CAMILLA_ROOM_1002))
    expect(spaces.length).toBe(8)
    expect(spaces.some(({ id }) => id === CAMILLA_LIVING)).toBe(true)
    expect(spaces.some(({ id }) => id === CAMILLA_DINING)).toBe(true)
    expect(spaces.some(({ id }) => id === CAMILLA_ENTRANCE)).toBe(true)
  })

  it('builds finite 3D geometry without lights for the living room', () => {
    const root = buildCamillaRoomDetails({
      THREE,
      plan,
      spaceId: CAMILLA_LIVING,
      reveal: false,
    })
    expect(root).not.toBeNull()
    expect(hasInfiniteCoords(root!)).toBe(false)
    expect(root!.children.some((c) => (c as unknown as { isLight?: boolean }).isLight)).toBe(false)
    expect(triangles(root!)).toBeLessThan(80_000)
    expect(root!.children.length).toBeLessThanOrEqual(2)
  })

  it('builds finite 3D geometry without lights for the dining room', () => {
    const root = buildCamillaRoomDetails({
      THREE,
      plan,
      spaceId: CAMILLA_DINING,
      reveal: false,
    })
    expect(root).not.toBeNull()
    expect(hasInfiniteCoords(root!)).toBe(false)
    expect(root!.children.some((c) => (c as unknown as { isLight?: boolean }).isLight)).toBe(false)
    expect(triangles(root!)).toBeLessThan(50_000)
    expect(root!.children.length).toBeLessThanOrEqual(2)
  })

  it('builds finite 3D geometry without lights for the entrance surveillance post', () => {
    const root = buildCamillaRoomDetails({
      THREE,
      plan,
      spaceId: CAMILLA_ENTRANCE,
      reveal: false,
    })
    expect(root).not.toBeNull()
    expect(hasInfiniteCoords(root!)).toBe(false)
    expect(root!.children.some((c) => (c as unknown as { isLight?: boolean }).isLight)).toBe(false)
    expect(triangles(root!)).toBeLessThan(30_000)
    expect(root!.children.length).toBeLessThanOrEqual(2)
  })

  it('fits the entire suite within the Three.js rendering budget (<150k triangles)', () => {
    const living = buildCamillaRoomDetails({ THREE, plan, spaceId: CAMILLA_LIVING, reveal: false })!
    const dining = buildCamillaRoomDetails({ THREE, plan, spaceId: CAMILLA_DINING, reveal: false })!
    const entrance = buildCamillaRoomDetails({
      THREE,
      plan,
      spaceId: CAMILLA_ENTRANCE,
      reveal: false,
    })!

    const totalTriangles = triangles(living) + triangles(dining) + triangles(entrance)
    expect(totalTriangles).toBeLessThan(150_000)
  })

  it('returns null in reveal mode or for unrelated rooms', () => {
    expect(
      buildCamillaRoomDetails({ THREE, plan, spaceId: CAMILLA_LIVING, reveal: true }),
    ).toBeNull()
    expect(
      buildCamillaRoomDetails({
        THREE,
        plan,
        spaceId: 'tier-1-royal-residential-sector-room-1004',
        reveal: false,
      }),
    ).toBeNull()
    expect(
      buildCamillaRoomDetails({
        THREE,
        plan,
        spaceId: 'tier-1-royal-residential-sector-room-1002-bedroom',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('exposes the 4 canonical manga views with appropriate cast staging', () => {
    expect(MANGA_CAMILLA_VIEWS).toHaveLength(4)
    const [circle, couch, dining, musse] = MANGA_CAMILLA_VIEWS

    expect(circle!.id).toBe('camilla-untouchables-circle')
    expect(circle!.spaceId).toBe(CAMILLA_LIVING)
    expect(circle!.chapter).toBe(389)
    expect(circle!.staging?.some((s) => s.characterId === 'prince-camilla')).toBe(true)
    expect(circle!.staging?.some((s) => s.characterId === 'lisamsetta')).toBe(true)
    expect(circle!.staging?.some((s) => s.characterId === 'mozbe')).toBe(true)

    expect(couch!.id).toBe('camilla-massage-couch')
    expect(couch!.spaceId).toBe(CAMILLA_LIVING)
    expect(couch!.staging?.some((s) => s.characterId === 'prince-camilla')).toBe(true)

    expect(dining!.id).toBe('camilla-duazul-dining')
    expect(dining!.spaceId).toBe(CAMILLA_DINING)
    expect(dining!.chapter).toBe(366)
    expect(dining!.staging?.some((s) => s.characterId === 'duazul-hui-guo-rou')).toBe(true)
    expect(dining!.staging?.some((s) => s.characterId === 'prince-camilla')).toBe(true)

    expect(musse!.id).toBe('musse-surveillance-post')
    expect(musse!.spaceId).toBe(CAMILLA_ENTRANCE)
    expect(musse!.chapter).toBe(366)
    expect(musse!.staging?.some((s) => s.characterId === 'musse')).toBe(true)

    for (const view of MANGA_CAMILLA_VIEWS) {
      expect(MANGA_VIEWS.some((v) => v.id === view.id)).toBe(true)
    }
  })

  it('maps 2D room points and anchors occupants accurately', () => {
    const centerPoint = camillaPoint([0, 0])
    expect(centerPoint.x).toBeGreaterThan(0)
    expect(centerPoint.x).toBeLessThan(CAMILLA_VIEWBOX.width)
    expect(centerPoint.y).toBeGreaterThan(0)
    expect(centerPoint.y).toBeLessThan(CAMILLA_VIEWBOX.height)

    expect(camillaSpotAnchors.occupants['prince-camilla']).toBeDefined()
    expect(camillaSpotAnchors.occupants['duazul-hui-guo-rou']).toBeDefined()
    expect(camillaSpotAnchors.occupants['musse']).toBeDefined()
    expect(camillaSpotAnchors.occupants['lisamsetta']).toBeDefined()

    expect(camillaLivingSpotAnchors.occupants['prince-camilla']).toBeDefined()
    expect(camillaDiningSpotAnchors.occupants['duazul-hui-guo-rou']).toBeDefined()
    expect(camillaEntranceSpotAnchors.occupants['musse']).toBeDefined()

    const camillaAnchor = spotAnchorFor({
      characterSlug: 'prince-camilla',
      locationId: CAMILLA_ROOM_1002,
    } as unknown as MapMarker)
    expect(camillaAnchor).not.toBeNull()
    expect(camillaAnchor?.exact).toBe(true)

    const duazulAnchor = spotAnchorFor({
      characterSlug: 'duazul-hui-guo-rou',
      locationId: CAMILLA_DINING,
    } as unknown as MapMarker)
    expect(duazulAnchor).not.toBeNull()

    const musseAnchor = spotAnchorFor({
      characterSlug: 'musse',
      locationId: CAMILLA_ENTRANCE,
    } as unknown as MapMarker)
    expect(musseAnchor).not.toBeNull()
  })

  it('disposes all detail geometries and materials cleanly', () => {
    const root = buildCamillaRoomDetails({
      THREE,
      plan,
      spaceId: CAMILLA_LIVING,
      reveal: false,
    })!
    expect(() => disposeBanquetDetails(root)).not.toThrow()
  })
})
