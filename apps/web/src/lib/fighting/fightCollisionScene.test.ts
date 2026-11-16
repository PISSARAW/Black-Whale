import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFightCollisionScene } from './fightCollisionScene'
import { fightCollisionBoxes } from './fightCollisionBoxes'
import { createFightState } from './fightState'
import { activeHitbox, attackData } from './frameData'
import { moveForSlot } from './movesets'
import { FIXED_STEP } from './fightClock'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightState, type FighterId, type FightProjectile } from './types'

function duel(id: FighterId = 'kurapika'): FightState {
  const state = createFightState(id, 'chrollo', { mode: 'training' })
  return {
    ...state,
    phase: 'fighting',
    player: { ...state.player, x: 44 },
    opponent: { ...state.opponent, x: 56 },
  }
}
function active(state: FightState): FightState {
  const started = performTrainingAction({
    state,
    side: 'player',
    action: 'heavy',
    input: EMPTY_INPUT,
  })
  return {
    ...started,
    player: {
      ...started.player,
      attack: { ...started.player.attack!, frame: attackData('heavy', started.player).startup },
    },
  }
}

describe('collision diagnostics in the combat scene', () => {
  it.each(['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)(
    'uses actual %s active bounds in either facing',
    (id) => {
      for (const facing of [1, -1] as const) {
        const state = active({ ...duel(id), player: { ...duel(id).player, facing } })
        const box = fightCollisionBoxes(state).find((entry) => entry.kind === 'hit')!.box
        expect(box).toEqual(activeHitbox(state.player))
        expect(fightCollisionBoxes(duel(id)).some((entry) => entry.kind === 'hit')).toBe(false)
      }
    },
  )
  it('keeps the hurtboxes attached to the same interpolated jump as the body', () => {
    const state = {
      ...duel(),
      frameAccumulator: FIXED_STEP / 2,
      previousPositions: { player: { x: 40, y: 6 }, opponent: { x: 56, y: 0 } },
    }
    state.player = { ...state.player, x: 42, y: 8 }
    const feet = fightCollisionBoxes(state)[0].box
    expect(feet.left).toBeCloseTo(41 - 1.7)
    expect(feet.bottom).toBe(7)
    const crouched = fightCollisionBoxes({
      ...duel(),
      player: { ...duel().player, crouching: true },
    })
    expect(crouched[1].box.top).toBe(8)
  })
  it('does not draw an attack volume for Chrollo’s bookmark utility', () => {
    const state = duel('chrollo')
    const move = moveForSlot('chrollo', 'downSpecial')!
    state.player = {
      ...state.player,
      pose: 'special',
      attack: {
        moveId: move.id,
        kind: 'special',
        variant: 'standing',
        frame: move.tuning.startup,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: 'chrollo',
        projectileSpawned: false,
        reversal: false,
      },
    }
    expect(fightCollisionBoxes(state).filter((entry) => entry.kind === 'hit')).toHaveLength(0)
  })
  it('projects the engine coordinates with the real perspective camera, including zoom and resize', () => {
    const state = duel()
    const scene = new THREE.Scene()
    const diagnostic = createFightCollisionScene({ THREE, scene })
    const original = JSON.stringify(state)
    diagnostic.sync(state)
    const tile = diagnostic.root.children[0]
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    for (const [width, height, x, z] of [
      [1440, 720, 0, 9.2],
      [390, 420, -1, 16],
      [844, 360, 1, 12],
    ]) {
      camera.aspect = width / height
      camera.position.set(x, 2.25, z)
      camera.lookAt(x, 1.18, 0)
      camera.updateProjectionMatrix()
      camera.updateMatrixWorld()
      tile.updateWorldMatrix(true, true)
      // Independent expectation: the standing lower-left hurtbox corner is x=42.3, y=0.
      const expected = new THREE.Vector3((42.3 - 50) * 0.115, 0, 0).project(camera)
      const drawn = tile.localToWorld(new THREE.Vector3(-0.5, -0.5, 0)).project(camera)
      expect(drawn.x * width).toBeCloseTo(expected.x * width, 5)
      expect(drawn.y * height).toBeCloseTo(expected.y * height, 5)
    }
    expect(JSON.stringify(state)).toBe(original)
    diagnostic.dispose()
  })
  it('reuses its geometry, hides surplus attacks and stays out of versus', () => {
    const diagnostic = createFightCollisionScene({ THREE, scene: new THREE.Scene() })
    const state = active(duel())
    diagnostic.sync(state)
    const tile = diagnostic.root.children[0]
    const count = diagnostic.root.children.length
    for (let frame = 0; frame < 50; frame++) diagnostic.sync(state)
    expect(diagnostic.root.children[0]).toBe(tile)
    expect(diagnostic.root.children).toHaveLength(count)
    diagnostic.sync(duel())
    expect(diagnostic.root.children.filter((item) => item.visible)).toHaveLength(4)
    diagnostic.sync({ ...state, mode: 'versus-local' })
    expect(diagnostic.root.visible).toBe(false)
    const dispose = vi.fn()
    const mesh = tile.children[0] as THREE.Mesh
    mesh.geometry.addEventListener('dispose', dispose)
    diagnostic.dispose()
    expect(dispose).toHaveBeenCalledOnce()
    expect(diagnostic.root.parent).toBeNull()
  })
  it('shows visible projectile bounds and respects hidden Nen until Gyo reveals it', () => {
    const shot: FightProjectile = {
      id: 1,
      owner: 'opponent',
      fighterId: 'hisoka',
      x: 50,
      y: 6,
      velocityX: -80,
      width: 0.5,
      height: 0.3,
      damage: 20,
      hitstun: 10,
      blockstun: 5,
      hitstop: 1,
      knockback: 1,
      targetZone: 'torso',
      guard: 'mid',
      canHitDowned: false,
      shape: 'card',
      colour: '#fff',
      age: 0,
      lifetime: 90,
      matter: 'nen',
      concealed: true,
    }
    const state = { ...duel(), projectiles: [shot] }
    expect(fightCollisionBoxes(state).filter((entry) => entry.kind === 'projectile')).toHaveLength(
      0,
    )
    const visible = {
      ...state,
      player: { ...state.player, nen: { ...state.player.nen, gyo: true } },
    }
    expect(fightCollisionBoxes(visible).find((entry) => entry.kind === 'projectile')!.box).toEqual({
      left: 49.5,
      right: 50.5,
      bottom: 5.7,
      top: 6.3,
    })
  })
})
