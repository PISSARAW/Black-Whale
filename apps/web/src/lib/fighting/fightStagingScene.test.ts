import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { contactShadow, CONTACT_LIFT } from '$lib/tour/contactShadow'
import { createFightState } from './fightState'
import { defaultFightComfort } from './fightComfort'
import { createFightStagingScene } from './fightStagingScene'

function setup() {
  const scene = new THREE.Scene()
  const figures = { player: new THREE.Group(), opponent: new THREE.Group() }
  figures.player.add(contactShadow(THREE, { radius: 0.46 }))
  figures.opponent.add(contactShadow(THREE, { radius: 0.46 }))
  figures.player.position.set(-2, 0, 0)
  figures.opponent.position.set(2, 0, 0)
  scene.add(figures.player, figures.opponent)
  let comfort = defaultFightComfort()
  const staging = createFightStagingScene({
    THREE,
    scene,
    figureOf: (side) => figures[side],
    comfort: () => comfort,
  })
  return {
    scene,
    figures,
    staging,
    state: createFightState('kurapika', 'hisoka'),
    comfort: (next = comfort) => (comfort = next),
  }
}

describe('P15 fight staging', () => {
  it('adds one bounded lane pool and two identity halos', () => {
    const f = setup()
    f.staging.sync(f.state)
    expect(f.scene.getObjectByName('fight-staging')).toBe(f.staging.root)
    expect(f.staging.root.children.map((child) => child.name)).toEqual([
      'fight-stage-floor-pool',
      'fight-stage-halo-player',
      'fight-stage-halo-opponent',
    ])
    const player = f.scene.getObjectByName('fight-stage-halo-player') as THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.ShaderMaterial
    >
    const opponent = f.scene.getObjectByName('fight-stage-halo-opponent') as THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.ShaderMaterial
    >
    expect(player.material.uniforms.uColour.value.getHex()).not.toBe(
      opponent.material.uniforms.uColour.value.getHex(),
    )
  })

  it('keeps airborne contact shadows on the deck and broadens their falloff', () => {
    const f = setup()
    const shadow = f.figures.player.getObjectByName('contact-shadow')!
    const width = shadow.scale.x
    f.figures.player.position.y = 2.4
    f.staging.sync(f.state)
    shadow.updateWorldMatrix(true, false)
    expect(shadow.getWorldPosition(new THREE.Vector3()).y).toBeCloseTo(CONTACT_LIFT + 0.002)
    expect(shadow.scale.x).toBeGreaterThan(width)
    expect(shadow.scale.y / shadow.scale.x).toBeCloseTo(0.5)
  })

  it('frames the rendered pair without mutating deterministic fight state', () => {
    const f = setup()
    const before = JSON.stringify(f.state)
    f.figures.player.position.x = -4
    f.figures.opponent.position.x = 2
    f.staging.sync(f.state)
    const pool = f.scene.getObjectByName('fight-stage-floor-pool')!
    expect(pool.position.x).toBe(-1)
    expect(pool.scale.x).toBeGreaterThan(2.2)
    expect(JSON.stringify(f.state)).toBe(before)
  })

  it('raises stable separation in high contrast and restores owned state on disposal', () => {
    const f = setup()
    const shadow = f.figures.player.getObjectByName('contact-shadow')!
    const y = shadow.position.y
    f.figures.player.position.y = 2
    f.comfort({ ...defaultFightComfort(), highContrast: true })
    f.staging.sync(f.state)
    const halo = f.scene.getObjectByName('fight-stage-halo-player') as THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.ShaderMaterial
    >
    expect(halo.material.uniforms.uOpacity.value).toBeGreaterThan(0.07)
    f.staging.dispose()
    expect(shadow.position.y).toBe(y)
    expect(f.scene.getObjectByName('fight-staging')).toBeUndefined()
  })
})
