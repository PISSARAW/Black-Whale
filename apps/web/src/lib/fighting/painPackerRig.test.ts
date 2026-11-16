import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFeitanScene } from './feitanScene'
import { createFightState } from './fightState'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createPainPacker } from './feitanPain'
import { createVisitHatsuModel } from './visitHatsuModel'
import { buildPainPackerModel } from '../tour/painPackerModel'
import type { Apparition } from '../tour/apparitions'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const worldX = (x: number) => x * 0.1
const worldY = (y: number) => y * 0.1

function worn(id: 'feitan' | 'chrollo' = 'feitan') {
  const state = createFightState(id, 'hisoka')
  state.phase = 'fighting'
  state.player.hatsuEffects.painPacker = { ...createPainPacker(), armour: true }
  const model = buildFightFigure({ THREE, glow, fighter: state.player })
  const figures = { player: model.turns, opponent: new THREE.Group() }
  const scene = new THREE.Scene()
  scene.add(model.root)
  const effects = createFeitanScene({
    THREE,
    scene,
    figureOf: (side) => figures[side],
    worldX,
    worldY,
  })
  return { state, model, figures, scene, effects }
}

function mesh(root: THREE.Object3D, name: string) {
  return root.getObjectByName(name) as THREE.Mesh
}

describe('reference Pain Packer outfit', () => {
  it('shares its actual hood, grille, coat and gloves across the visit and Fighting', () => {
    const root = new THREE.Group()
    buildPainPackerModel({ size: 1 } as Apparition, { THREE, root, glow, skin: glow(0xffffff, 1) })
    const adapted = createVisitHatsuModel(THREE, { model: 'pain-packer' })
    for (const name of [
      'pain-packer-pointed-hood',
      'pain-packer-white-hood-markings',
      'pain-packer-dentate-grille',
      'pain-packer-coat-arrow-patterns',
      'pain-packer-burgundy-glove',
    ]) {
      expect(mesh(root, name).geometry).toBe(mesh(adapted.root, name).geometry)
      expect((mesh(root, name).material as THREE.MeshBasicMaterial).color.getHex()).toBe(
        (mesh(adapted.root, name).material as THREE.MeshBasicMaterial).color.getHex(),
      )
    }
    adapted.dispose()
  })
  it('follows both arm joints while keeping the skirt at the hips during torso twists', () => {
    const { state, model, scene, effects } = worn()
    for (const facing of [-1, 1] as const) {
      state.player.facing = facing
      model.animate(1, 'idle', {
        motion: fightBodyMotion({ fighter: state.player, seconds: 1, progress: 0 }),
      })
      model.root.getObjectByName('fight-chest')!.rotation.y = 0.45
      model.root.getObjectByName('elbow-right')!.rotation.x += 0.6
      effects.sync(state, 1)
      model.root.updateMatrixWorld(true)
      const armour = scene.getObjectByName('pain-packer:player')!
      for (const side of ['left', 'right'])
        for (const [piece, anchor] of [
          ['arm', 'shoulder'],
          ['elbow', 'elbow'],
        ]) {
          const joint = armour.getObjectByName(`pain-packer-${piece}-${side}:combat-joint`)!
          const target = model.root.getObjectByName(`${anchor}-${side}`)!
          expect(
            joint
              .getWorldPosition(new THREE.Vector3())
              .distanceTo(target.getWorldPosition(new THREE.Vector3())),
          ).toBeLessThan(1e-6)
          expect(
            Math.abs(
              joint
                .getWorldQuaternion(new THREE.Quaternion())
                .dot(target.getWorldQuaternion(new THREE.Quaternion())),
            ),
          ).toBeCloseTo(1)
        }
      const coat = armour.getObjectByName('pain-packer-coat:combat-joint')!
      const hips = model.root.getObjectByName('hip-left')!.parent!
      expect(
        Math.abs(
          coat
            .getWorldQuaternion(new THREE.Quaternion())
            .dot(hips.getWorldQuaternion(new THREE.Quaternion())),
        ),
      ).toBeCloseTo(1)
      expect(model.root.getObjectByName('manga-head:feitan-portor')!.visible).toBe(false)
    }
    state.player.hatsuEffects.painPacker!.armour = false
    effects.sync(state, 2)
    expect(model.root.getObjectByName('manga-head:feitan-portor')!.visible).toBe(true)
    expect(model.root.getObjectByName('manga-long-coat')!.visible).toBe(true)
    effects.dispose()
  })
  it('restores the old wearer on figure replacement and leaves borrowed equipment visible', () => {
    const { state, model, figures, effects } = worn('chrollo')
    effects.sync(state, 0)
    expect(model.root.getObjectByName('hand-left')!.visible).toBe(true)
    const replacement = buildFightFigure({ THREE, glow, fighter: state.player })
    figures.player = replacement.turns
    effects.sync(state, 1)
    expect(model.root.getObjectByName('manga-head:chrollo-lucilfer')!.visible).toBe(true)
    expect(replacement.root.getObjectByName('manga-head:chrollo-lucilfer')!.visible).toBe(false)
    effects.dispose()
    expect(replacement.root.getObjectByName('manga-head:chrollo-lucilfer')!.visible).toBe(true)
  })
})
