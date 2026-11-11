import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildHeillyHideoutDetails, HEILLY_LAUNDRY } from './heillyHideoutView'
import { MANGA_HEILLY_VIEWS } from './mangaHeillyViews'

const plan = theShip().plans.get('interior-heilly-hideout')!

describe('the chapter 394 Heil-Ly disposal room', () => {
  it('uses the supplied panel composition instead of invented laundry machines', () => {
    const structures = plan.structures.filter(({ spaceId }) => spaceId === HEILLY_LAUNDRY)
    const names = structures.map(({ name }) => name.toLowerCase()).join(' ')

    expect(names).toContain('body tray')
    expect(names).toContain('processing tank')
    expect(names).toContain('disposal bag')
    expect(names).not.toContain('washer')
    expect(names).not.toContain('dryer')
  })

  it('frames Bille, Tassi’s tray and the rear control wall from the entrance', () => {
    const view = MANGA_HEILLY_VIEWS.find(({ id }) => id === 'heilly-laundry-disposal')!

    expect(view.chapter).toBe(394)
    expect(view.staging?.map(({ characterId }) => characterId)).toEqual(['bille'])
    expect(view.at[1]).toBeLessThan(1)
    expect(Math.abs(view.heading)).toBe(Math.PI)
  })

  it('builds a dense but batched room model within the geometry budget', () => {
    const root = buildHeillyHideoutDetails({
      THREE,
      plan,
      spaceId: HEILLY_LAUNDRY,
      reveal: false,
    })!
    const triangles = (root.children as THREE.Mesh[]).reduce(
      (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
      0,
    )

    expect(root.children.length).toBeLessThanOrEqual(2)
    expect(triangles).toBeGreaterThan(2_000)
    expect(triangles).toBeLessThan(150_000)
    const bounds = new THREE.Box3().setFromObject(root)
    expect(bounds.min.x).toBeGreaterThanOrEqual(-18.4)
    expect(bounds.max.x).toBeLessThanOrEqual(-7.88)
    expect(bounds.min.z).toBeGreaterThanOrEqual(-0.35)
    expect(bounds.max.z).toBeLessThanOrEqual(7.7)
    disposeBanquetDetails(root)
  })
})
