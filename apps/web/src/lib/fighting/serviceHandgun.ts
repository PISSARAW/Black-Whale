import type { Group, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import { attackData } from './frameData'
import { bodyguardPistolStrike } from './bodyguardFirearms'
import { animateThetaHandgun } from './thetaFigure'
import type { ArcadeFighter, FighterId } from './types'

type Three = HumanFigureBuild['THREE']
const PISTOLS = new WeakMap<Object3D, { held: Group; stowed: Group; flash: Object3D }>()
const SHAPES = new WeakMap<Three, ReturnType<typeof pistolShapes>>()

function pistolShapes(THREE: Three) {
  const shapes = {
    slide: new THREE.BoxGeometry(0.065, 0.06, 0.22),
    grip: new THREE.BoxGeometry(0.055, 0.105, 0.065),
    guard: new THREE.TorusGeometry(0.027, 0.005, 4, 8),
    flash: new THREE.ConeGeometry(0.035, 0.1, 5),
  }
  Object.values(shapes).forEach((shape) => {
    shape.userData.sharedHuman = true
  })
  return shapes
}

/** A physical service weapon drawn for shots and dedicated close strikes. */
export function addServiceHandgun(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
  owner: FighterId
  hand?: 'left' | 'right'
}): void {
  const { THREE, glow, model, owner, hand = 'right' } = options
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = pistolShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  const held = new THREE.Group()
  held.name = `${owner}-handgun`
  const slide = new THREE.Mesh(shapes.slide, glow(0x333a40, 1))
  slide.position.set(0, 0.035, 0.1)
  const grip = new THREE.Mesh(shapes.grip, glow(0x1e2427, 1))
  grip.position.set(0, -0.035, 0.04)
  grip.rotation.x = -0.2
  const guard = new THREE.Mesh(shapes.guard, glow(0x333a40, 1))
  guard.position.set(0, -0.015, 0.1)
  guard.rotation.y = Math.PI / 2
  const butt = new THREE.Object3D()
  butt.name = `${owner}-pistol-butt`
  butt.position.set(0, -0.082, 0.038)
  held.add(slide, grip, guard, butt)
  const stowed = held.clone()
  stowed.name = `${owner}-holstered-handgun`
  stowed.position.set(hand === 'left' ? -0.22 : 0.22, 0.75, 0.05)
  stowed.rotation.x = Math.PI / 2
  model.turns.add(stowed)
  const flash = new THREE.Mesh(shapes.flash, glow(0xffd47b, 0.95))
  flash.name = `${owner}-muzzle-flash`
  flash.position.set(0, 0.035, 0.26)
  flash.rotation.x = Math.PI / 2
  held.add(flash)
  held.position.set(0, -0.01, 0.035)
  held.rotation.x = Math.PI / 2
  model.root.getObjectByName(`hand-${hand}`)?.add(held)
  held.visible = false
  flash.visible = false
  PISTOLS.set(model.turns, { held, stowed, flash })
}

function handgunFlashFrame(fighter: ArcadeFighter): boolean {
  const frame = fighter.attack?.frame ?? 0
  const startup = attackData('ranged', fighter).startup
  return frame >= startup && frame < startup + 2
}

export function animateServiceHandgun(figure: Object3D, fighter: ArcadeFighter): void {
  if (fighter.id === 'theta') return animateThetaHandgun(figure, fighter)
  const pistol = PISTOLS.get(figure)
  if (!pistol) return
  if (fighter.weaponsConfiscated) {
    pistol.held.visible = pistol.stowed.visible = pistol.flash.visible = false
    return
  }
  const firing = fighter.attack?.kind === 'ranged'
  const striking = bodyguardPistolStrike(fighter)
  pistol.held.visible = firing || striking
  pistol.stowed.visible = !pistol.held.visible && !fighter.hanzoProjection
  pistol.held.rotation.z = striking ? Math.PI / 2 : 0
  pistol.flash.visible = firing && handgunFlashFrame(fighter)
}
