import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { attackData } from './frameData'
import { createSecretWindowScene } from './secretWindowScene'
import { projectHanzo } from './hanzoProjection'
import { EMPTY_INPUT, type FightState } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
function marked(): FightState {
  const base = beginFight(createFight('musse', 'hanzo', { mode: 'versus-local' }))
  let state = performAttack(
    {
      ...base,
      player: { ...base.player, x: 42, aura: 100 },
      opponent: { ...base.opponent, x: 48 },
    },
    'player',
    'special',
  )
  for (let i = 0; i < 35; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Musse’s physical weapon and private owl', () => {
  it.each([1, -1] as const)(
    'holds the handgun in the right hand and aims downrange facing %s',
    (facing) => {
      const state = beginFight(createFight('musse', 'hisoka'))
      const started = performAttack(state, 'player', 'ranged').player
      const frame = attackData('ranged', started).startup
      const fighter = { ...started, facing, attack: { ...started.attack!, frame } }
      const model = buildFightFigure({ THREE, glow, fighter })
      model.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
      const gun = model.root.getObjectByName('musse-handgun')!
      const flash = model.root.getObjectByName('musse-muzzle-flash')!
      expect(gun.parent?.name).toBe('hand-right')
      expect(gun.visible).toBe(true)
      expect(flash.visible).toBe(true)
      expect(model.root.getObjectByName('musse-holstered-handgun')?.visible).toBe(false)
      model.root.updateMatrixWorld(true)
      const barrel = new THREE.Vector3(0, 0, 1).transformDirection(gun.matrixWorld)
      const forward = new THREE.Vector3(0, 0, 1).transformDirection(model.turns.matrixWorld)
      expect(barrel.dot(forward)).toBeGreaterThan(0.85)
      const done = { ...fighter, attack: null, pose: 'idle' as const }
      model.animate(2, 'idle', {
        motion: fightBodyMotion({ fighter: done, seconds: 2, progress: 0 }),
      })
      expect(gun.visible).toBe(false)
      expect(flash.visible).toBe(false)
      expect(model.root.getObjectByName('musse-holstered-handgun')?.visible).toBe(true)
    },
  )

  it('follows the marked physical body, remains private, and disposes its resources', () => {
    const scene = new THREE.Scene()
    const effects = createSecretWindowScene({
      THREE,
      scene,
      worldX: (x) => x / 5,
      worldY: (y) => y / 5,
    })
    const state = marked()
    effects.sync(state, 0)
    const owl = scene.getObjectByName('secret-window-player')!
    expect(owl.visible).toBe(true)
    expect(owl.position.x).toBeCloseTo(48 / 5 - 0.2)
    const projected = projectHanzo(state.opponent)
    effects.sync({ ...state, opponent: { ...projected, x: 80 } }, 0)
    expect(owl.position.x).toBeCloseTo(48 / 5 - 0.2)
    expect(owl.position.y).toBeCloseTo(1)
    const mirrored = {
      ...state,
      player: { ...state.opponent },
      opponent: {
        ...state.player,
        secretWindow: { ...state.player.secretWindow!, target: 'player' as const },
      },
    }
    effects.sync(mirrored, 0)
    expect(owl.visible).toBe(false)
    expect(scene.getObjectByName('secret-window-opponent')?.visible).toBe(false)
    const geometry = (owl.children[0] as THREE.Mesh).geometry
    const dispose = vi.spyOn(geometry, 'dispose')
    effects.dispose()
    expect(dispose).toHaveBeenCalledOnce()
    expect(scene.children).toHaveLength(0)
  })
})
