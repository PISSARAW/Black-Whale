import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFranklinAccentScene } from './franklinAccentScene'
import { createProjectileScene } from './projectileScene'
import { franklinShotHand } from './franklinPresentation'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { defaultFightComfort } from './fightComfort'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function setup(facing: 1 | -1 = 1) {
  let state = beginFight(createFight('franklin', 'benjamin', { mode: 'versus-local' }))
  state = {
    ...state,
    player: { ...state.player, x: facing === 1 ? 20 : 76, aura: 100, facing },
    opponent: { ...state.opponent, x: facing === 1 ? 76 : 20 },
  }
  const build = () =>
    buildFightFigure({
      THREE,
      fighter: state.player,
      glow: (color) => new THREE.MeshBasicMaterial({ color }),
    })
  let model = build(),
    comfort = defaultFightComfort(),
    viewer: FightSide = 'player'
  const scene = new THREE.Scene()
  scene.add(model.root)
  const effects = createFranklinAccentScene({
    THREE,
    scene,
    worldX: (x) => x,
    worldY: (y) => y,
    figureOf: (side) => (side === 'player' ? model.turns : undefined),
    comfort: () => comfort,
    viewer: () => viewer,
  })
  const sync = () => {
    model.animate(state.frame / 60, 'idle', {
      motion: fightBodyMotion({ fighter: state.player, seconds: state.frame / 60, progress: 0 }),
    })
    effects.sync(state, 0)
  }
  sync()
  const flashes = () => {
    const found: THREE.Object3D[] = []
    model.root.traverse((n) => {
      if (n.name === 'franklin-muzzle-flash' && n.visible) found.push(n)
    })
    return found
  }
  return {
    scene,
    effects,
    sync,
    flashes,
    model: () => model,
    state: () => state,
    cast() {
      state = performAttack(state, 'player', 'ranged')
      sync()
    },
    step() {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      sync()
    },
    set(s: FightState) {
      state = s
      sync()
    },
    settings(value: typeof comfort) {
      comfort = value
      sync()
    },
    view(value: FightSide) {
      viewer = value
      sync()
    },
    rebuild() {
      model.root.removeFromParent()
      model = build()
      scene.add(model.root)
      sync()
    },
  }
}
describe('Franklin type 1 effects follow his actual fingertips', () => {
  it('aligns Franklin’s actual Nen bullets with flight and caches their geometry separately from other projectiles', () => {
    const f = setup()
    f.cast()
    for (let i = 0; i < 12; i++) f.step()
    const shot = f.state().projectiles[0]
    expect(shot.fighterId).toBe('franklin')
    const scene = new THREE.Scene()
    const projectiles = createProjectileScene({
      THREE,
      scene,
      glow: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity }),
      geometry: (made) => made,
      worldX: (x) => x,
      worldY: (y) => y,
    })
    projectiles.sync([shot, { ...shot, id: 999, fighterId: 'hisoka' }], 1)
    const bullet = scene.getObjectByName(`fight-projectile:${shot.id}`) as THREE.Mesh
    const other = scene.getObjectByName('fight-projectile:999') as THREE.Mesh
    expect(bullet.rotation.z).toBe(-Math.PI / 2)
    expect(bullet.geometry).not.toBe(other.geometry)
    bullet.geometry.computeBoundingBox()
    other.geometry.computeBoundingBox()
    expect(bullet.geometry.boundingBox!.getSize(new THREE.Vector3()).x).toBeLessThan(
      other.geometry.boundingBox!.getSize(new THREE.Vector3()).x,
    )
    projectiles.sync([{ ...shot, velocityX: -shot.velocityX }], 40)
    expect(bullet.rotation.z).toBe(-Math.PI / 2)
    projectiles.dispose()
    f.effects.dispose()
  })
  it.each([1, -1] as const)(
    'flashes only the emitted finger facing %s and stops with interruption',
    (facing) => {
      const f = setup(facing)
      f.cast()
      expect(f.flashes()).toHaveLength(0)
      let oldCount = 0,
        last = 0
      for (let i = 0; i < 18; i++) {
        f.step()
        const count = f.state().player.attack?.projectilesSpawned ?? 0
        if (count === oldCount) continue
        last = count - 1
        const flashed = f.flashes()
        expect(flashed).toHaveLength(1)
        expect(flashed[0].parent?.name).toBe(
          `franklin-finger-${franklinShotHand(facing, last)}-${Math.floor(last / 2) % 5}`,
        )
        const root = f.scene.getObjectByName('franklin-accents:player')!
        const recent = root.children.filter((n) => n.visible).slice(2)
        expect(recent.length).toBeGreaterThan(0)
        oldCount = count
      }
      expect(last).toBeGreaterThan(2)
      const bullets = f.state().projectiles
      f.set({ ...f.state(), player: { ...f.state().player, attack: null, hitStun: 15 } })
      expect(f.flashes()).toHaveLength(0)
      expect(
        f.scene.getObjectByName('franklin-accents:player')!.children.every((n) => !n.visible),
      ).toBe(true)
      expect(f.state().projectiles).toBe(bullets)
      f.effects.dispose()
    },
  )
  it('suppresses both new accents and the legacy flashes under In and reduced motion, preserving the shots', () => {
    const f = setup()
    f.set({
      ...f.state(),
      player: { ...f.state().player, nen: { ...f.state().player.nen, in: true } },
    })
    f.cast()
    for (let i = 0; i < 20; i++) f.step()
    f.view('opponent')
    expect(f.flashes()).toHaveLength(0)
    expect(f.scene.getObjectByName('franklin-accents:player')!.visible).toBe(false)
    f.set({
      ...f.state(),
      opponent: { ...f.state().opponent, nen: { ...f.state().opponent.nen, gyo: true } },
    })
    expect(f.scene.getObjectByName('franklin-accents:player')!.visible).toBe(true)
    f.settings({ ...defaultFightComfort(), camera: 0, flashes: false })
    expect(f.flashes()).toHaveLength(0)
    expect(f.scene.getObjectByName('franklin-accents:player')!.visible).toBe(false)
    expect(f.state().nextProjectileId).toBeGreaterThan(1)
    f.effects.dispose()
  })
  it('follows a rebuilt rig and disposes only the accent resources', () => {
    const f = setup()
    const mesh = f
      .model()
      .root.getObjectByName('torso')!
      .children.find((n) => n instanceof THREE.Mesh) as THREE.Mesh
    const dispose = vi.spyOn(mesh.geometry, 'dispose')
    f.cast()
    for (let i = 0; i < 12; i++) f.step()
    f.rebuild()
    f.step()
    f.step()
    expect(f.flashes()).toHaveLength(1)
    const snapshot = JSON.stringify(f.state())
    f.effects.sync(f.state(), 100)
    expect(JSON.stringify(f.state())).toBe(snapshot)
    f.effects.dispose()
    expect(dispose).not.toHaveBeenCalled()
    expect(f.scene.getObjectByName('franklin-accents:player')).toBeUndefined()
  })
})
