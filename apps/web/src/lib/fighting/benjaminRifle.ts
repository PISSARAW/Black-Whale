import type { Group, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import { attackData, attackPhase } from './frameData'
import type { ArcadeFighter } from './types'

type Three = HumanFigureBuild['THREE']
export interface BenjaminRifle {
  held: Group
  support: Object3D
  muzzle: Object3D
}
const RIFLES = new WeakMap<Object3D, BenjaminRifle>()
const SHAPES = new WeakMap<Three, ReturnType<typeof rifleShapes>>()

function rifleShapes(THREE: Three) {
  const shapes = {
    receiver: new THREE.BoxGeometry(0.15, 0.17, 0.45),
    barrel: new THREE.BoxGeometry(0.065, 0.07, 0.43),
    stock: new THREE.BoxGeometry(0.12, 0.14, 0.26),
    grip: new THREE.BoxGeometry(0.065, 0.13, 0.08),
    magazine: new THREE.BoxGeometry(0.1, 0.22, 0.13),
    foreend: new THREE.BoxGeometry(0.14, 0.09, 0.24),
    flash: new THREE.ConeGeometry(0.085, 0.18, 6),
  }
  Object.values(shapes).forEach((shape) => {
    shape.userData.sharedHuman = true
  })
  return shapes
}

/** The trigger grip is the right palm's origin, not a point beside the fighter. */
export function addBenjaminRifle(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const { THREE, glow, model } = options
  const hand = model.root.getObjectByName('hand-right')
  if (!hand) return
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = rifleShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  const held = new THREE.Group()
  held.name = 'benjamin-firearm'
  const metal = glow(0x414b49, 1)
  const dark = glow(0x242b29, 1)
  const parts = [
    [shapes.receiver, metal, 0, 0.14, 0.07],
    [shapes.barrel, metal, 0, 0.16, 0.5],
    [shapes.stock, dark, 0, 0.12, -0.27],
    [shapes.grip, dark, 0, 0, 0],
    [shapes.magazine, dark, 0, -0.025, 0.14],
    [shapes.foreend, dark, 0, 0.105, 0.32],
  ] as const
  for (const [geometry, material, x, y, z] of parts) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    held.add(mesh)
  }
  const trigger = new THREE.Object3D()
  trigger.name = 'benjamin-trigger-grip'
  const support = new THREE.Object3D()
  support.name = 'benjamin-support-grip'
  support.position.set(0, 0.065, 0.32)
  const muzzle = new THREE.Mesh(shapes.flash, glow(0xffdf91, 1))
  muzzle.name = 'benjamin-muzzle-flash'
  muzzle.position.set(0, 0.16, 0.8)
  muzzle.rotation.x = Math.PI / 2
  muzzle.visible = false
  held.visible = false
  held.add(trigger, support, muzzle)
  hand.add(held)
  RIFLES.set(model.turns, { held, support, muzzle })
}

export function benjaminRifleFor(figure: Object3D) {
  return RIFLES.get(figure)
}

export function benjaminGunHeld(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'benjamin' &&
    (fighter.attack?.kind === 'ranged' || fighter.attack?.moveId === 'benjamin:backSpecial')
  )
}

export function benjaminBurstFlash(fighter: ArcadeFighter): boolean {
  if (fighter.attack?.kind !== 'ranged' || attackPhase(fighter) !== 'active') return false
  return (fighter.attack.frame - attackData('ranged', fighter).startup) % 6 < 2
}
