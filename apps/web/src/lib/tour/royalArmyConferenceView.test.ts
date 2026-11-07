import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildRoyalArmyConferenceDetails,
  ROYAL_ARMY_CONFERENCE_ROOM,
} from './royalArmyConferenceView'
import { MANGA_ROYAL_ARMY_CONFERENCE_VIEWS } from './mangaRoyalArmyConferenceViews'
import { MANGA_VIEWS } from './mangaViews'
import {
  royalArmyConferencePoint,
  royalArmyConferenceSpotAnchors,
  ROYAL_ARMY_VIEWBOX,
} from '$lib/components/map/projection/royalArmyConferencePlan'
import { spotAnchorFor } from '$lib/components/map/projection/roomAnchors'
import type { MapMarker } from '$lib/components/map/projection/types'

const ship = theShip()
const plan = ship.plans.get('interior-royal-army-conference')!

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

describe('Royal Army Conference Room reconstructed from Chapters 350 and 380', () => {
  it('satisfies the shared blueprint invariants for interior-royal-army-conference', () => {
    expect(
      validateBlueprint().filter((issue) => issue.includes('royal-army-conference')),
    ).toEqual([])
  })

  it('contains the 21 canonical structures defined in blueprint.json', () => {
    const structures = plan.structures.filter(
      (structure) => structure.spaceId === ROYAL_ARMY_CONFERENCE_ROOM,
    )
    expect(structures).toHaveLength(21)

    // 1 screen, 1 chart-board, 1 lectern, 3 tables, 15 chairs
    expect(structures.filter((s) => s.kind === 'painting')).toHaveLength(2)
    expect(structures.filter((s) => s.kind === 'counter')).toHaveLength(1)
    expect(structures.filter((s) => s.kind === 'table')).toHaveLength(3)
    expect(structures.filter((s) => s.kind === 'seat')).toHaveLength(15)

    expect(structures.some((s) => s.id.endsWith('screen'))).toBe(true)
    expect(structures.some((s) => s.id.endsWith('chart-board'))).toBe(true)
    expect(structures.some((s) => s.id.endsWith('lectern'))).toBe(true)
    expect(structures.some((s) => s.id.endsWith('table-head'))).toBe(true)
    expect(structures.some((s) => s.id.endsWith('table-port'))).toBe(true)
    expect(structures.some((s) => s.id.endsWith('table-starboard'))).toBe(true)

    for (let i = 1; i <= 15; i++) {
      const pad = String(i).padStart(2, '0')
      expect(structures.some((s) => s.id.endsWith(`chair-${pad}`))).toBe(true)
    }
  })

  it('builds finite 3D geometry without permanent lights within triangle budget', () => {
    const root = buildRoyalArmyConferenceDetails({
      THREE,
      plan,
      spaceId: ROYAL_ARMY_CONFERENCE_ROOM,
      reveal: false,
    })
    expect(root).not.toBeNull()
    expect(hasInfiniteCoords(root!)).toBe(false)
    expect(root!.children.some((c) => (c as unknown as { isLight?: boolean }).isLight)).toBe(false)
    expect(triangles(root!)).toBeLessThan(150_000)
    expect(root!.children.length).toBeLessThanOrEqual(2)
  })

  it('returns null in reveal mode or for unrelated rooms', () => {
    expect(
      buildRoyalArmyConferenceDetails({
        THREE,
        plan,
        spaceId: ROYAL_ARMY_CONFERENCE_ROOM,
        reveal: true,
      }),
    ).toBeNull()
    expect(
      buildRoyalArmyConferenceDetails({
        THREE,
        plan,
        spaceId: 'tier-4-xi-yu-family-office-meeting-room',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('exposes the 4 canonical manga views with appropriate cast staging', () => {
    expect(MANGA_ROYAL_ARMY_CONFERENCE_VIEWS).toHaveLength(4)
    const [audience, lectern, maps, uTable] = MANGA_ROYAL_ARMY_CONFERENCE_VIEWS

    expect(audience!.id).toBe('royal-army-briefing-audience')
    expect(audience!.spaceId).toBe(ROYAL_ARMY_CONFERENCE_ROOM)
    expect(audience!.chapter).toBe(380)
    expect(audience!.pages).toBe('189')
    expect(audience!.staging?.some((s) => s.characterId === 'mizaistom-nana')).toBe(true)

    expect(lectern!.id).toBe('royal-army-lectern-stage')
    expect(lectern!.spaceId).toBe(ROYAL_ARMY_CONFERENCE_ROOM)
    expect(lectern!.chapter).toBe(380)
    expect(lectern!.staging?.some((s) => s.characterId === 'mizaistom-nana')).toBe(true)

    expect(maps!.id).toBe('royal-army-tactical-maps')
    expect(maps!.spaceId).toBe(ROYAL_ARMY_CONFERENCE_ROOM)
    expect(maps!.chapter).toBe(380)

    expect(uTable!.id).toBe('royal-army-u-table-command')
    expect(uTable!.spaceId).toBe(ROYAL_ARMY_CONFERENCE_ROOM)
    expect(uTable!.chapter).toBe(350)

    for (const view of MANGA_ROYAL_ARMY_CONFERENCE_VIEWS) {
      expect(MANGA_VIEWS.some((v) => v.id === view.id)).toBe(true)
    }
  })

  it('maps 2D room points and anchors occupants accurately', () => {
    const centerPoint = royalArmyConferencePoint([0, 0])
    expect(centerPoint.x).toBeGreaterThan(0)
    expect(centerPoint.x).toBeLessThan(ROYAL_ARMY_VIEWBOX.width)
    expect(centerPoint.y).toBeGreaterThan(0)
    expect(centerPoint.y).toBeLessThan(ROYAL_ARMY_VIEWBOX.height)

    expect(royalArmyConferenceSpotAnchors.occupants['mizaistom-nana']).toBeDefined()
    expect(royalArmyConferenceSpotAnchors.seats['chair-01']).toBeDefined()
    expect(royalArmyConferenceSpotAnchors.seats['chair-15']).toBeDefined()

    const mizaistomAnchor = spotAnchorFor({
      characterSlug: 'mizaistom-nana',
      locationId: ROYAL_ARMY_CONFERENCE_ROOM,
    } as unknown as MapMarker)
    expect(mizaistomAnchor).not.toBeNull()
    expect(mizaistomAnchor?.exact).toBe(true)
  })

  it('disposes all detail geometries and materials cleanly', () => {
    const root = buildRoyalArmyConferenceDetails({
      THREE,
      plan,
      spaceId: ROYAL_ARMY_CONFERENCE_ROOM,
      reveal: false,
    })!
    expect(() => disposeBanquetDetails(root)).not.toThrow()
  })
})
