import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf } from './blueprint'
import { buildGangwayView, PRINCE_VIEW_SPACE } from './gangwayView'
import { mangaViewById, viewsForSpace } from './mangaViews'
import { distanceToBoundary, pointInPolygon } from './geometry'

const ship = theShip()

describe('royal liner exterior', () => {
  it('joins every retractable crossing to its real endpoints and retracts at the quay', () => {
    const view = buildGangwayView(THREE, ship)!
    view.root.updateMatrixWorld(true)
    for (const link of ship.links.filter((candidate) => candidate.retractable)) {
      const bridge = view.root.getObjectByName(`retractable-gangway:${link.from}`)!
      const source = ship.spaces.get(link.from)!
      const target = ship.spaces.get(link.to)!
      const sourceY = floorOf(
        source,
        ship.tiers.find((tier) => tier.id === source.tierId)!,
      )
      const targetY = floorOf(
        target,
        ship.tiers.find((tier) => tier.id === target.tierId)!,
      )
      const start = new THREE.Vector3(link.at[0], sourceY, link.at[1])
      const to = link.atTo ?? link.at
      const finish = new THREE.Vector3(to[0], targetY, to[1])
      expect(bridge.getWorldPosition(new THREE.Vector3()).distanceTo(start)).toBeLessThan(1e-6)
      const length = start.distanceTo(finish)
      const span = bridge.children[0]
      expect(span.localToWorld(new THREE.Vector3(0, 0, length)).distanceTo(finish)).toBeLessThan(
        1e-6,
      )
      view.setExtended(false)
      view.root.updateMatrixWorld(true)
      expect(span.localToWorld(new THREE.Vector3()).distanceTo(start)).toBeLessThan(1e-6)
      expect(span.localToWorld(new THREE.Vector3(0, 0, length)).distanceTo(start)).toBeCloseTo(
        length * 0.08,
      )
      view.setExtended(true)
      view.root.updateMatrixWorld(true)
      expect(span.localToWorld(new THREE.Vector3(0, 0, length)).distanceTo(finish)).toBeLessThan(
        1e-6,
      )
    }
    view.dispose()
  })

  it('keeps exterior scenery out of sealed rooms and other decks', () => {
    const view = buildGangwayView(THREE, ship)!
    view.setLocation('tier-2-tier-1-access', false)
    expect(view.root.visible).toBe(true)
    view.setLocation('tier-2-vip-quarters', false)
    expect(view.root.visible).toBe(false)
    view.setLocation(PRINCE_VIEW_SPACE, false)
    expect(view.isOutside(PRINCE_VIEW_SPACE, false)).toBe(false)
    expect(view.root.getObjectByName('prince-view-lookout')?.visible).toBe(false)
    view.setLocation('tier-2-forward-corridor', false)
    expect(view.root.visible).toBe(true)
    expect(view.isOutside('tier-2-forward-corridor', false)).toBe(false)
    view.setLocation(PRINCE_VIEW_SPACE, true)
    expect(view.root.visible).toBe(true)
    view.setLocation(null, true)
    expect(view.root.visible).toBe(false)
    view.dispose()
  })

  it('keeps the upper facades supported by the curved royal hull', () => {
    const view = buildGangwayView(THREE, ship)!
    const hull = ship.tiers.find((tier) => tier.id === 'tier-1')!.hull
    for (const name of Array.from({ length: 5 }, (_, index) => `royal-liner-terrace-${index}`)) {
      const mesh = view.root.getObjectByName(name) as THREE.Mesh
      const vertices = mesh.geometry.getAttribute('position')
      for (let index = 0; index < vertices.count; index++) {
        const point: [number, number] = [vertices.getX(index), vertices.getZ(index)]
        expect(pointInPolygon(point, hull) || distanceToBoundary(point, hull) < 1e-4, name).toBe(
          true,
        )
      }
    }
    view.dispose()
  })

  it('batches the detailed facade and releases every GPU resource once', () => {
    const view = buildGangwayView(THREE, ship)!
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    let drawables = 0
    view.root.traverse((object) => {
      const drawable = object as THREE.Mesh
      if (!drawable.geometry) return
      drawables++
      geometries.add(drawable.geometry)
      for (const material of Array.isArray(drawable.material)
        ? drawable.material
        : [drawable.material]) {
        materials.add(material)
      }
      const position = drawable.geometry.getAttribute('position')
      expect(Array.from(position.array).every(Number.isFinite), object.name).toBe(true)
    })
    expect(drawables).toBeLessThan(25)
    const releases = [...geometries, ...materials].map((resource) => vi.spyOn(resource, 'dispose'))
    const scene = new THREE.Scene()
    scene.add(view.root)
    view.dispose()
    expect(view.root.parent).toBeNull()
    for (const release of releases) expect(release).toHaveBeenCalledTimes(1)
  })

  it('offers the reconstructed prince panorama from all three Tier 2 crossings', () => {
    const panorama = mangaViewById('royal-liner-prince-view')!
    expect(panorama.spaceId).toBe(PRINCE_VIEW_SPACE)
    expect(panorama.chapter).toBe(419)
    expect(panorama.volume).toBeUndefined()
    expect(panorama.visibleSpaceIds).toEqual([])
    expect(panorama.labelFr).toContain('cadrage reconstitué')
    for (const link of ship.links.filter((candidate) => candidate.retractable)) {
      expect(viewsForSpace(link.from)).toContain(panorama)
    }
  })

  it('frames the hull and upper decks together on desktop and portrait screens', () => {
    const view = buildGangwayView(THREE, ship)!
    const shot = mangaViewById('royal-liner-prince-view')!
    const tier = ship.tiers.find((candidate) => candidate.id === 'tier-2')!
    view.root.updateMatrixWorld(true)
    for (const aspect of [1.4, 0.6]) {
      const pullback = shot.cameraDistance! * Math.max(1, 1.4 / aspect)
      const camera = new THREE.PerspectiveCamera(64, aspect, 0.05, pullback + 440)
      camera.position.set(
        shot.at[0] + Math.sin(shot.heading) * pullback,
        tier.elevation + shot.eyeHeight!,
        shot.at[1] + Math.cos(shot.heading) * pullback,
      )
      camera.rotateY(shot.heading)
      camera.rotateX(shot.pitch)
      camera.updateMatrixWorld(true)
      for (const name of [
        'royal-liner-hull',
        ...Array.from({ length: 5 }, (_, index) => `royal-liner-terrace-${index}`),
      ]) {
        const mesh = view.root.getObjectByName(name) as THREE.Mesh
        const vertices = mesh.geometry.getAttribute('position')
        for (let index = 0; index < vertices.count; index++) {
          const pixel = new THREE.Vector3()
            .fromBufferAttribute(vertices, index)
            .applyMatrix4(mesh.matrixWorld)
            .project(camera)
          expect(Math.abs(pixel.x), `${aspect}: ${name} horizontal`).toBeLessThan(1)
          expect(Math.abs(pixel.y), `${aspect}: ${name} vertical`).toBeLessThan(1)
          expect(pixel.z, `${aspect}: ${name} far plane`).toBeLessThan(1)
          expect(pixel.z, `${aspect}: ${name} near plane`).toBeGreaterThan(-1)
        }
      }
    }
    view.dispose()
  })
})
