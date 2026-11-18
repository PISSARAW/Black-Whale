import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createBungeeGumScene } from './bungeeGumScene'
import { createHisokaTextureScene } from './hisokaTextureScene'
import { hisokaChest, hisokaHand } from './hisokaEffectAnchors'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { buildFightFigure } from './fighterFigure'
import { defaultFightComfort } from './fightComfort'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function setup() {
  const base = beginFight(createFight('hisoka', 'hisoka', { mode: 'versus-local' }))
  let state = {
    ...base,
    player: { ...base.player, x: 44, aura: 100 },
    opponent: { ...base.opponent, x: 54, aura: 100 },
  }
  const build = (side: FightSide) =>
    buildFightFigure({
      THREE,
      fighter: state[side],
      glow: (color) => new THREE.MeshBasicMaterial({ color }),
    }).root
  const models = { player: build('player'), opponent: build('opponent') }
  models.player.position.set(2, 1, 0)
  models.opponent.position.set(4, 1, 0)
  const scene = new THREE.Scene()
  scene.add(models.player, models.opponent)
  let comfort = defaultFightComfort(),
    viewer: FightSide = 'player'
  const options = {
    THREE,
    scene,
    worldX: (x: number) => x,
    worldY: (y: number) => y,
    figureOf: (side: FightSide) => models[side],
    comfort: () => comfort,
    viewer: () => viewer,
  }
  const gum = createBungeeGumScene(options),
    texture = createHisokaTextureScene(options)
  const sync = () => {
    gum.sync(state, 0)
    texture.sync(state, 0)
  }
  sync()
  return {
    options,
    models,
    scene,
    gum,
    texture,
    sync,
    state: () => state,
    set: (s: FightState) => {
      state = s
      sync()
    },
    settings: (value: typeof comfort) => {
      comfort = value
      sync()
    },
    view: (value: FightSide) => {
      viewer = value
      sync()
    },
    cast(slot = 'neutralSpecial') {
      state = performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        moveId: `hisoka:${slot}`,
        auraCharged: false,
      })
      sync()
    },
    advance(n: number) {
      for (let i = 0; i < n; i++) {
        state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
        sync()
      }
    },
    dispose() {
      gum.dispose()
      texture.dispose()
    },
  }
}
describe('Hisoka accents follow the live scene', () => {
  it('mounts the elastic on the posed hand and chest, freezes with simulation time, and leaves no phantom strand', () => {
    const f = setup()
    f.cast()
    f.advance(22)
    expect(f.state().bungeeGum).toBeTruthy()
    const root = f.scene.getObjectByName('hisoka-bungee-gum')!
    const bounds = new THREE.Box3().setFromObject(root)
    for (const anchor of [
      hisokaHand(f.options, f.state(), 'player'),
      hisokaChest(f.options, f.state(), 'opponent'),
    ])
      expect(bounds.clone().expandByScalar(0.12).containsPoint(anchor)).toBe(true)
    const strand = root.getObjectByName('gum-strand') as THREE.Mesh
    const positions = Array.from(strand.geometry.attributes.position.array)
    f.gum.sync(f.state(), 100)
    expect(Array.from(strand.geometry.attributes.position.array)).toEqual(positions)
    f.set({ ...f.state(), bungeeGum: null })
    expect(root.visible).toBe(false)
    expect(f.scene.getObjectByName('hisoka-gum-accent')!.visible).toBe(false)
    f.dispose()
  })
  it('conceals both the Gum and its accent from the opponent until Gyo', () => {
    const f = setup()
    f.cast()
    f.advance(20)
    f.set({ ...f.state(), bungeeGum: { ...f.state().bungeeGum!, hidden: true } })
    f.view('opponent')
    expect(f.scene.getObjectByName('hisoka-bungee-gum')!.visible).toBe(false)
    expect(f.scene.getObjectByName('hisoka-gum-accent')!.visible).toBe(false)
    f.set({
      ...f.state(),
      opponent: { ...f.state().opponent, nen: { ...f.state().opponent.nen, gyo: true } },
    })
    expect(f.scene.getObjectByName('hisoka-bungee-gum')!.visible).toBe(true)
    f.dispose()
  })
  it('suppresses decorative motion in reduced motion while retaining the real readable tether', () => {
    const f = setup()
    f.settings({ ...defaultFightComfort(), camera: 0, flashes: false })
    f.cast()
    f.advance(20)
    expect(f.scene.getObjectByName('hisoka-bungee-gum')!.visible).toBe(true)
    expect(f.scene.getObjectByName('hisoka-gum-accent')!.visible).toBe(false)
    f.dispose()
  })
  it('follows a rebuilt cloth rig and disposes only its own resources', () => {
    const f = setup()
    const mesh = f.models.player
      .getObjectByName('torso')!
      .children.find((n) => n instanceof THREE.Mesh) as THREE.Mesh
    const release = vi.spyOn(mesh.geometry, 'dispose')
    f.cast('downSpecial')
    f.advance(12)
    expect(f.state().player.textureSurprise).toBeTruthy()
    const panel = f.scene.getObjectByName('hisoka-texture-accent:player')!
    expect(panel.visible).toBe(true)
    f.models.player = f.models.player.clone(true)
    f.models.player.position.x += 2
    f.sync()
    expect(panel.position.x).toBeGreaterThan(3)
    f.settings({ ...defaultFightComfort(), camera: 0, flashes: false })
    expect(panel.visible).toBe(false)
    expect(f.state().player.textureSurprise).toBeTruthy()
    f.dispose()
    expect(release).not.toHaveBeenCalled()
    expect(f.scene.getObjectByName('hisoka-texture-accent:player')).toBeUndefined()
  })
})
