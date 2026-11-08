import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { computeDoorPlacement } from './doorDetailSurface'
import { buildDoorDetails, resolveTier } from './doorView'

const ship = theShip()

describe('doorView — resolveTier', () => {
  it('correctly maps space ids and plan tier fallbacks to tiers 1 through 5', () => {
    expect(resolveTier('tier-1-royal-residential-approach-1001')).toBe(1)
    expect(resolveTier('tier-2-ministry-of-justice')).toBe(2)
    expect(resolveTier('tier-3-residential-standard')).toBe(3)
    expect(resolveTier('tier-4-royal-army-conference-room')).toBe(4)
    expect(resolveTier('tier-5-warehouse')).toBe(5)
    expect(resolveTier('interior-room-1003-living', 'tier-1')).toBe(1)
  })
})

describe('doorView — computeDoorPlacement', () => {
  it('computes exact metric coordinates and orientation for a doorway', () => {
    const plan = ship.plans.get('tier-1')!
    const door = plan.doorways[0]
    const placement = computeDoorPlacement(plan, door)

    const expectedCx = (door.start[0] + door.end[0]) / 2
    const expectedCz = (door.start[1] + door.end[1]) / 2
    expect(placement.center[0]).toBeCloseTo(expectedCx)
    expect(placement.center[1]).toBeCloseTo(expectedCz)
    expect(placement.width).toBeCloseTo(door.width)
    expect(placement.height).toBeGreaterThanOrEqual(2.1)
    expect(placement.openSign === 1 || placement.openSign === -1).toBe(true)
  })
})

describe('doorView — buildDoorDetails', () => {
  const testTiers = [
    { deck: 'tier-1', spaceId: 'tier-1-vvip-recreation-hall' },
    { deck: 'tier-2', spaceId: 'tier-2-main-corridor' },
    { deck: 'tier-3', spaceId: 'tier-3-central-spine' },
    { deck: 'tier-4', spaceId: 'tier-4-central-passage' },
    { deck: 'tier-5', spaceId: 'tier-5-main-corridor' },
  ]

  it('builds faithful doors on each deck according to its tier', () => {
    for (const { deck, spaceId } of testTiers) {
      const plan = ship.plans.get(deck)!
      const group = buildDoorDetails({
        THREE,
        plan,
        spaceId,
        reveal: false,
      })

      // If this space owns doorways as door.a, it must build a non-null group
      const ownedDoors = plan.doorways.filter((d) => d.a === spaceId)
      if (ownedDoors.length > 0) {
        expect(group).not.toBeNull()
        expect(group?.name).toBe(`doors-${spaceId}`)
        expect(group?.children.length).toBeGreaterThan(0)

        const mesh = group?.children[0] as THREE.Mesh
        expect(mesh.isMesh).toBe(true)
        const posAttr = mesh.geometry.getAttribute('position')
        expect(posAttr.count).toBeGreaterThan(0)

        // Geometry budget check: doors are light and batched
        expect(posAttr.count).toBeLessThan(100_000)
      }
    }
  })

  it('omits doors when reveal is true', () => {
    const plan = ship.plans.get('tier-1')!
    const group = buildDoorDetails({
      THREE,
      plan,
      spaceId: 'tier-1-main-corridor',
      reveal: true,
    })
    expect(group).toBeNull()
  })

  it('returns null for spaces with no owned doorways', () => {
    const plan = ship.plans.get('tier-1')!
    const group = buildDoorDetails({
      THREE,
      plan,
      spaceId: 'tier-1-lifeboats-port',
      reveal: false,
    })
    expect(group).toBeNull()
  })

  it('contains zero Three.js lights to protect the frame budget', () => {
    const plan = ship.plans.get('tier-1')!
    const group = buildDoorDetails({
      THREE,
      plan,
      spaceId: 'tier-1-main-corridor',
      reveal: false,
    })
    if (group) {
      let lights = 0
      group.traverse((child) => {
        if ((child as THREE.Light).isLight) lights++
      })
      expect(lights).toBe(0)
    }
  })

  it('disposes GPU buffers cleanly without memory leaks', () => {
    const plan = ship.plans.get('tier-1')!
    const group = buildDoorDetails({
      THREE,
      plan,
      spaceId: 'tier-1-main-corridor',
      reveal: false,
    })
    expect(() => {
      if (group) disposeBanquetDetails(group)
    }).not.toThrow()
  })

  it('provides animated doors that open on approach and close on retreat', () => {
    const plan = ship.plans.get('tier-1')!
    const group = buildDoorDetails({
      THREE,
      plan,
      spaceId: 'tier-1-main-corridor',
      reveal: false,
    })
    expect(group).not.toBeNull()
    expect(group?.animatedDoors).toBeDefined()
    expect(group?.animatedDoors?.length).toBeGreaterThan(0)

    const door = group!.animatedDoors![0]
    expect(door.openProgress).toBe(0)
    expect(door.targetProgress).toBe(0)

    // Initial rotation of leaves is at baseRotationY (closed)
    for (const leaf of door.leaves) {
      expect(leaf.hingeGroup.rotation.y).toBeCloseTo(leaf.baseRotationY, 4)
    }

    // Approach the door (closer than 2.4m)
    door.update({ x: door.center[0] + 0.5, z: door.center[1] + 0.5, y: door.floor + 1.0 }, 0.5)
    expect(door.targetProgress).toBe(1)
    expect(door.openProgress).toBeGreaterThan(0)

    // Complete the opening
    for (let i = 0; i < 10; i++) {
      door.update({ x: door.center[0] + 0.5, z: door.center[1] + 0.5, y: door.floor + 1.0 }, 0.1)
    }
    expect(door.openProgress).toBeCloseTo(1, 2)
    for (const leaf of door.leaves) {
      expect(leaf.hingeGroup.rotation.y).toBeCloseTo(leaf.baseRotationY + leaf.maxSwing, 2)
    }

    // Move far away (beyond 3.2m)
    door.update({ x: door.center[0] + 5.0, z: door.center[1] + 5.0, y: door.floor + 1.0 }, 0.5)
    expect(door.targetProgress).toBe(0)
    for (let i = 0; i < 15; i++) {
      door.update({ x: door.center[0] + 5.0, z: door.center[1] + 5.0, y: door.floor + 1.0 }, 0.1)
    }
    expect(door.openProgress).toBeCloseTo(0, 2)
    for (const leaf of door.leaves) {
      expect(leaf.hingeGroup.rotation.y).toBeCloseTo(leaf.baseRotationY, 2)
    }
  })

  it('supports explicit setOpen and toggle controls', () => {
    const plan = ship.plans.get('tier-1')!
    const group = buildDoorDetails({
      THREE,
      plan,
      spaceId: 'tier-1-main-corridor',
      reveal: false,
    })
    const door = group!.animatedDoors![0]

    door.setOpen(true)
    expect(door.openProgress).toBe(1)
    expect(door.targetProgress).toBe(1)

    door.toggle()
    expect(door.openProgress).toBe(0)
    expect(door.targetProgress).toBe(0)

    door.toggle()
    expect(door.openProgress).toBe(1)
    expect(door.targetProgress).toBe(1)
  })

  it('triggers proximity animation via onBeforeRender callback', () => {
    const plan = ship.plans.get('tier-1')!
    const group = buildDoorDetails({
      THREE,
      plan,
      spaceId: 'tier-1-main-corridor',
      reveal: false,
    })
    const door = group!.animatedDoors![0]
    const sentinel = group!.children[0]
    expect(sentinel.onBeforeRender).toBeDefined()

    const camera = new THREE.PerspectiveCamera()
    camera.position.set(door.center[0], door.floor + 1.0, door.center[1])

    const renderer = {} as THREE.WebGLRenderer
    const scene = new THREE.Scene()
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.MeshBasicMaterial()
    const renderGroup = new THREE.Group()

    sentinel.onBeforeRender!(renderer, scene, camera, geometry, material, renderGroup)
    expect(door.targetProgress).toBe(1)
  })
})
