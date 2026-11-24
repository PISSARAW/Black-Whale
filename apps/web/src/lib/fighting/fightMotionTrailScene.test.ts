import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { createFightMotionTrailScene } from './fightMotionTrailScene'
import { defaultFightComfort } from './fightComfort'
import type { FightState } from './types'

function fixture() {
  const scene = new THREE.Scene()
  const figures = { player: new THREE.Group(), opponent: new THREE.Group() }
  for (const figure of Object.values(figures)) {
    for (const name of ['hand-left', 'hand-right', 'knee-left', 'knee-right']) {
      const anchor = new THREE.Object3D()
      anchor.name = name
      figure.add(anchor)
    }
    scene.add(figure)
  }
  let comfort = defaultFightComfort()
  const trails = createFightMotionTrailScene({
    THREE,
    scene,
    figureOf: (side) => figures[side],
    comfort: () => comfort,
  })
  const state = createFightState('hisoka', 'kurapika') as FightState
  state.phase = 'fighting'
  state.player.attack = {
    kind: 'heavy',
    variant: 'standing',
    frame: 4,
    impacted: false,
    auraCharged: false,
    concealed: false,
    hatsuSource: null,
    projectileSpawned: false,
    reversal: false,
  }
  return { scene, figures, trails, state, setComfort: (next: typeof comfort) => (comfort = next) }
}

describe('fight motion trails', () => {
  it('draws only the fastest attacking limbs and fades its fixed pool', () => {
    const { scene, figures, trails, state } = fixture()
    trails.sync(state, 0)
    figures.player.getObjectByName('hand-right')!.position.x = 0.4
    figures.player.getObjectByName('knee-right')!.position.y = 0.22
    figures.player.getObjectByName('hand-left')!.position.x = 0.02
    trails.sync({ ...state, frame: 1 }, 16)
    const visible = scene.children.filter(
      ({ name, visible }) => name === 'fight-motion-trail' && visible,
    )
    expect(visible).toHaveLength(2)
    expect(visible.every(({ scale }) => scale.y > 0.2)).toBe(true)
    trails.animate(200)
    expect(visible.every(({ visible }) => !visible)).toBe(true)
  })

  it('freezes during hitstop and respects disabled flashes immediately', () => {
    const { scene, figures, trails, state, setComfort } = fixture()
    trails.sync(state, 0)
    figures.player.getObjectByName('hand-right')!.position.x = 0.4
    trails.sync({ ...state, frame: 1, hitstop: 4 }, 16)
    expect(
      scene.children.some(({ name, visible }) => name === 'fight-motion-trail' && visible),
    ).toBe(false)
    figures.player.getObjectByName('hand-right')!.position.x = 0.8
    trails.sync({ ...state, frame: 2 }, 32)
    expect(
      scene.children.some(({ name, visible }) => name === 'fight-motion-trail' && visible),
    ).toBe(true)
    setComfort({ ...defaultFightComfort(), flashes: false })
    trails.animate(33)
    expect(
      scene.children.some(({ name, visible }) => name === 'fight-motion-trail' && visible),
    ).toBe(false)
  })

  it('draws four short speed echoes during Kurapika’s ordinary dash', () => {
    const { scene, figures, trails, state } = fixture()
    state.player.id = 'kurapika'
    state.player.attack = null
    state.player.motion = {
      velocityX: 0,
      prejumpFrames: 0,
      jumpDirection: 0,
      landingFrames: 0,
      dash: { direction: 1, frame: 3, frames: 12, peak: 54 },
      heldDirection: 0,
      tapDirection: 0,
      tapWindow: 0,
    }
    trails.sync(state, 0)
    for (const [index, name] of ['hand-left', 'hand-right', 'knee-left', 'knee-right'].entries())
      figures.player.getObjectByName(name)!.position.x = 0.12 + index * 0.04
    trails.sync({ ...state, frame: 1 }, 16)
    expect(
      scene.children.filter(({ name, visible }) => name === 'fight-motion-trail' && visible),
    ).toHaveLength(4)
  })

  it('clears on rewind and disposes all pooled resources', () => {
    const { scene, figures, trails, state } = fixture()
    trails.sync(state, 0)
    figures.player.getObjectByName('hand-right')!.position.x = 0.4
    trails.sync({ ...state, frame: 2 }, 16)
    trails.sync({ ...state, frame: 0 }, 20)
    expect(
      scene.children.some(({ name, visible }) => name === 'fight-motion-trail' && visible),
    ).toBe(false)
    trails.dispose()
    expect(scene.children.some(({ name }) => name === 'fight-motion-trail')).toBe(false)
  })
})
