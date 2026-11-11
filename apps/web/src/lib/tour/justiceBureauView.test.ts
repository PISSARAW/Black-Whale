import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { floorOf, theShip, validateBlueprint } from './blueprint'
import {
  buildJusticeBureauDetails,
  hasJusticeBureauModel,
  isJusticeBureauSpace,
  justiceSurfacePlan,
  JUSTICE_DEPUTY_OFFICE,
  JUSTICE_HALL,
  JUSTICE_LOBBY,
  JUSTICE_VISITATION,
} from './justiceBureauView'
import { MANGA_JUSTICE_BUREAU_VIEWS } from './mangaJusticeBureauViews'
import { VISITATION_LAYOUT } from './justiceBureauVisitation'
import {
  justicePoint,
  justiceSpotAnchors,
  JUSTICE_VIEWBOX,
} from '$lib/components/map/projection/justiceBureauPlan'

const ship = theShip()
const plan = ship.plans.get('interior-justice-bureau')!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + (mesh.geometry?.getAttribute('position')?.count ?? 0) / 3,
    0,
  )

describe('the Justice Bureau reconstructed from chapter 400', () => {
  it('satisfies the shared blueprint invariants for interior-justice-bureau', () => {
    expect(
      validateBlueprint().filter((issue) => issue.includes('interior-justice-bureau')),
    ).toEqual([])
  })

  it('identifies the canonical spaces of the Justice Bureau', () => {
    expect(isJusticeBureauSpace(JUSTICE_DEPUTY_OFFICE)).toBe(true)
    expect(isJusticeBureauSpace(JUSTICE_VISITATION)).toBe(true)
    expect(isJusticeBureauSpace(JUSTICE_LOBBY)).toBe(true)
    expect(isJusticeBureauSpace(JUSTICE_HALL)).toBe(true)
    expect(isJusticeBureauSpace('tier-2-bulkhead')).toBe(false)
  })

  it('builds high-fidelity 3D details for room 1010, visitation, lobby and hall', () => {
    const officeGroup = buildJusticeBureauDetails({
      THREE,
      plan,
      spaceId: JUSTICE_DEPUTY_OFFICE,
      reveal: false,
    })!
    expect(officeGroup).toBeDefined()
    expect(officeGroup.name).toBe('justice-office-1010-manga-details')
    expect(triangles(officeGroup)).toBeGreaterThan(200)

    const visitationGroup = buildJusticeBureauDetails({
      THREE,
      plan,
      spaceId: JUSTICE_VISITATION,
      reveal: false,
    })!
    expect(visitationGroup).toBeDefined()
    expect(visitationGroup.name).toBe('justice-visitation-manga-details')
    expect(triangles(visitationGroup)).toBeGreaterThan(200)
    const transparentMeshes = (visitationGroup.children as THREE.Mesh[]).filter((mesh) => {
      const material = mesh.material as THREE.Material
      return material.transparent && material.opacity < 0.3
    })
    expect(transparentMeshes).toHaveLength(1)

    const lobbyGroup = buildJusticeBureauDetails({
      THREE,
      plan,
      spaceId: JUSTICE_LOBBY,
      reveal: false,
    })!
    expect(lobbyGroup).toBeDefined()
    expect(lobbyGroup.name).toBe('justice-lobby-manga-details')
    expect(triangles(lobbyGroup)).toBeGreaterThan(700)

    const lobbyBounds = new THREE.Box3().setFromObject(lobbyGroup)
    const lobby = plan.spaces.find(({ id }) => id === JUSTICE_LOBBY)!
    expect(lobbyBounds.min.x).toBeLessThanOrEqual(-20.5)
    expect(lobbyBounds.max.x).toBeGreaterThanOrEqual(-8.5)
    expect(lobbyBounds.max.y).toBeGreaterThan(floorOf(lobby, plan.tier) + 3.9)
    expect(lobbyBounds.max.y).toBeLessThanOrEqual(floorOf(lobby, plan.tier) + 4)

    const hallGroup = buildJusticeBureauDetails({
      THREE,
      plan,
      spaceId: JUSTICE_HALL,
      reveal: false,
    })!
    expect(hallGroup).toBeDefined()
    expect(hallGroup.name).toBe('justice-hall-manga-details')
  })

  it('matches the sparse chapter 400 visitation layout', () => {
    const fixtures = plan.structures.filter(({ spaceId }) => spaceId === JUSTICE_VISITATION)
    const partition = fixtures.find(({ id }) => id.endsWith('-visitation-partition'))!
    const stools = fixtures.filter(({ id }) => id.includes('-visitor-stool-'))
    const secureChair = fixtures.find(({ id }) => id.endsWith('-secure-chair'))!
    const clerkDesk = fixtures.find(({ id }) => id.endsWith('-clerk-desk'))!

    expect(partition.at).toEqual(VISITATION_LAYOUT.partition.at)
    expect(partition.size).toEqual(VISITATION_LAYOUT.partition.size)
    expect(stools.map(({ at }) => at)).toEqual(VISITATION_LAYOUT.visitorStools)
    expect(secureChair.at).toEqual(VISITATION_LAYOUT.secureChair)
    expect(clerkDesk.at).toEqual(VISITATION_LAYOUT.clerkDesk)
    expect(fixtures).toHaveLength(7)
  })

  it('suppresses coarse blueprint models in normal walk via justiceSurfacePlan', () => {
    const surfaced = justiceSurfacePlan(plan, false)
    expect(surfaced.structures.some(hasJusticeBureauModel)).toBe(false)
    // Retains other structures such as witness protection and secondary interrogation
    expect(surfaced.structures.some((s) => s.spaceId.includes('witness-protection'))).toBe(true)

    // In reveal mode, all blueprint structures are preserved
    const revealed = justiceSurfacePlan(plan, true)
    expect(revealed.structures.some(hasJusticeBureauModel)).toBe(true)
  })

  it('returns null when in reveal mode or for unmanaged spaces', () => {
    expect(
      buildJusticeBureauDetails({
        THREE,
        plan,
        spaceId: JUSTICE_DEPUTY_OFFICE,
        reveal: true,
      }),
    ).toBeNull()

    expect(
      buildJusticeBureauDetails({
        THREE,
        plan,
        spaceId: 'tier-2-bulkhead',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('contains the chapter 400 manga viewpoints', () => {
    expect(MANGA_JUSTICE_BUREAU_VIEWS.length).toBeGreaterThanOrEqual(3)
    const officeView = MANGA_JUSTICE_BUREAU_VIEWS.find(
      (v) => v.id === 'justice-office-1010-interrogation',
    )!
    expect(officeView).toBeDefined()
    expect(officeView.spaceId).toBe(JUSTICE_DEPUTY_OFFICE)
    expect(officeView.chapter).toBe(400)
    expect(officeView.staging?.some((s) => s.characterId === 'melody')).toBe(true)
    expect(officeView.staging?.some((s) => s.characterId === 'kaiser')).toBe(true)

    const visitationView = MANGA_JUSTICE_BUREAU_VIEWS.find(
      (v) => v.id === 'justice-visitation-partition',
    )!
    expect(visitationView).toBeDefined()
    expect(visitationView.spaceId).toBe(JUSTICE_VISITATION)
  })

  it('anchors Melody and Kaiser at the visitor chairs in room 1010', () => {
    expect(justiceSpotAnchors.occupants.melody.x).toBeCloseTo(45.8, 1)
    expect(justiceSpotAnchors.occupants.melody.y).toBeCloseTo(35.6, 1)
    expect(justiceSpotAnchors.occupants.kaiser.x).toBeCloseTo(52.2, 1)
    expect(justiceSpotAnchors.occupants.kaiser.y).toBeCloseTo(35.6, 1)
  })

  it('maps the 2D projection points cleanly into the viewBox', () => {
    const origin = justicePoint([0, 0])
    expect(origin.x).toBe(500)
    expect(origin.y).toBe(365)
    expect(JUSTICE_VIEWBOX.width).toBe(1000)
    expect(JUSTICE_VIEWBOX.height).toBe(700)
  })
})
