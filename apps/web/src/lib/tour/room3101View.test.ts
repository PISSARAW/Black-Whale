import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { detailTagRangesOf } from './detailTag'
import { theShip } from './blueprint'
import {
  buildRoom3101Details,
  ROOM_3101_BATHROOM,
  ROOM_3101_LIVING,
  room3101SurfacePlan,
} from './room3101View'

const ship = theShip()
const plan = ship.plans.get('interior-room-3101')!
const roomStructures = plan.structures.filter(({ spaceId }) =>
  [ROOM_3101_LIVING, ROOM_3101_BATHROOM].includes(spaceId),
)

function tagsOf(root: THREE.Group) {
  return root.children.flatMap((child) => detailTagRangesOf(child))
}

function expectCompleteEvidence(root: THREE.Group) {
  for (const child of root.children) {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) continue
    const positions = mesh.geometry.getAttribute('position')
    let nextFace = 0
    for (const range of detailTagRangesOf(mesh)) {
      expect(range.start).toBe(nextFace)
      expect(range.count).toBeGreaterThan(0)
      expect(range.tag.source.length).toBeGreaterThan(20)
      expect(range.tag.sourceFr.length).toBeGreaterThan(20)
      expect(range.tag.reconstructionRole).toBeDefined()
      nextFace += range.count
    }
    expect(nextFace).toBe(positions.count / 3)
  }
}

describe('Room 3101 manga fidelity', () => {
  it('keeps panel furniture separate from inferred bathroom fixtures', () => {
    expect(roomStructures).toHaveLength(7)
    expect(roomStructures.filter(({ provenance }) => provenance === 'panel')).toHaveLength(5)
    expect(roomStructures.filter(({ provenance }) => provenance === 'inferred')).toHaveLength(2)
    expect(
      roomStructures
        .filter(({ provenance }) => provenance === 'inferred')
        .map(({ id }) => id)
        .sort(),
    ).toEqual(['tier-3-residential-room-3101-bathtub', 'tier-3-residential-room-3101-washstand'])
  })

  it('builds the stacked bunk and open storage wall from their panel evidence', () => {
    const root = buildRoom3101Details({
      THREE,
      plan,
      spaceId: ROOM_3101_LIVING,
      reveal: false,
    })!
    const tags = tagsOf(root)
    const ids = new Set(tags.map(({ tag }) => tag.id))
    const triangles = root.children.reduce(
      (sum, child) =>
        sum + ((child as THREE.Mesh).geometry?.getAttribute('position')?.count ?? 0) / 3,
      0,
    )

    expect(root.name).toBe(`room-3101-${ROOM_3101_LIVING}-details`)
    expect(triangles).toBeGreaterThan(350)
    expect([...ids]).toEqual(
      expect.arrayContaining([
        'tier-3-residential-room-3101-bed',
        'tier-3-residential-room-3101-bunk-ladder',
        'tier-3-residential-room-3101-wardrobe',
        'tier-3-residential-room-3101-drawers',
        'tier-3-residential-room-3101-shelves',
        `${ROOM_3101_LIVING}-entrance-trap`,
        `${ROOM_3101_LIVING}-bathroom-bypass`,
      ]),
    )
    const trap = tags.find(({ tag }) => tag.id.endsWith('-entrance-trap'))!.tag
    expect(trap.provenance).toBe('panel')
    expect(trap.source).toContain('entrance into room 3101')
    expect(trap.source).toContain('not the bathroom threshold')
    expectCompleteEvidence(root)
  })

  it('models the bathroom honestly as a tiled reconstruction with inferred fixtures', () => {
    const root = buildRoom3101Details({
      THREE,
      plan,
      spaceId: ROOM_3101_BATHROOM,
      reveal: false,
    })!
    const tags = tagsOf(root).map(({ tag }) => tag)

    expect(tags.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        `${ROOM_3101_BATHROOM}-tile`,
        'tier-3-residential-room-3101-bathtub',
        'tier-3-residential-room-3101-washstand',
      ]),
    )
    expect(
      tags
        .filter(({ id }) => id.endsWith('-bathtub') || id.endsWith('-washstand'))
        .every(({ provenance }) => provenance === 'inferred'),
    ).toBe(true)
    expectCompleteEvidence(root)
  })

  it('replaces coarse furniture only in the normal walk', () => {
    const surfaced = room3101SurfacePlan(plan, false)
    expect(surfaced.structures.filter(({ spaceId }) => spaceId.includes('room-3101'))).toEqual([])
    expect(room3101SurfacePlan(plan, true).structures).toEqual(plan.structures)
    expect(
      buildRoom3101Details({ THREE, plan, spaceId: ROOM_3101_LIVING, reveal: true }),
    ).toBeNull()
    expect(
      buildRoom3101Details({ THREE, plan, spaceId: 'tier-3-bulkhead', reveal: false }),
    ).toBeNull()
  })
})
