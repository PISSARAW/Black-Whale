import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { defaultFightComfort } from './fightComfort'
import { createFightState } from './fightState'
import { createKurapikaSpeedScene } from './kurapikaSpeedScene'
import type { FightState } from './types'

describe('Kurapika 1999 speed scene', () => {
  it('takes three full-body snapshots and restores the real body', () => {
    const scene = new THREE.Scene()
    const figures = { player: new THREE.Group(), opponent: new THREE.Group() }
    for (const figure of Object.values(figures)) {
      figure.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()))
      scene.add(figure)
    }
    const speed = createKurapikaSpeedScene({
      THREE,
      scene,
      figureOf: (side) => figures[side],
      comfort: defaultFightComfort,
    })
    const state = createFightState('kurapika', 'hisoka') as FightState
    state.phase = 'fighting'
    state.player.motion = {
      velocityX: 0,
      prejumpFrames: 0,
      jumpDirection: 0,
      landingFrames: 0,
      dash: { direction: 1, frame: 1, frames: 15, peak: 106 },
      heldDirection: 0,
      tapDirection: 0,
      tapWindow: 0,
    }
    for (const frame of [1, 4, 8]) {
      state.player.motion.dash!.frame = frame
      speed.sync(state, frame * 16)
    }
    expect(scene.children.filter(({ name }) => name === 'kurapika-afterimage:player')).toHaveLength(
      3,
    )
    state.player.motion.dash!.frame = 2
    speed.sync(state, 150)
    expect(figures.player.visible).toBe(false)
    speed.dispose()
    expect(figures.player.visible).toBe(true)
    expect(scene.children.some(({ name }) => name.startsWith('kurapika-afterimage'))).toBe(false)
  })

  it('does not overwrite another fighter presentation scene visibility', () => {
    const scene = new THREE.Scene()
    const player = new THREE.Group()
    const opponent = new THREE.Group()
    player.visible = false
    const speed = createKurapikaSpeedScene({
      THREE,
      scene,
      figureOf: (side) => (side === 'player' ? player : opponent),
      comfort: defaultFightComfort,
    })
    const state = createFightState('feitan', 'hisoka') as FightState
    state.phase = 'fighting'
    speed.sync(state, 0)
    expect(player.visible).toBe(false)
  })
})
