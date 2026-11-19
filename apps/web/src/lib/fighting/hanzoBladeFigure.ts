import { attackData } from './frameData'
import { hanzoBladeMove } from './hanzoBlade'
import { CANON } from '$lib/tour/humanProportions'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { Object3D } from 'three'
import type { ArcadeFighter } from './types'
import { hanzoBladeAvailable } from './hanzoBlade'

type Three = HumanFigureBuild['THREE']
const BLADE_LENGTH = 0.32
const SHAPES = new WeakMap<Three, ReturnType<typeof bladeShapes>>()

function bladeShapes(THREE: Three) {
  const result = {
    housing: new THREE.BoxGeometry(0.072, 0.37, 0.034),
    bandage: new THREE.CylinderGeometry(0.057, 0.057, 0.026, 10),
    edge: new THREE.BoxGeometry(0.06, 0.25, 0.012),
    tip: new THREE.ConeGeometry(0.03, 0.07, 4).scale(1, 1, 0.2),
  }
  Object.values(result).forEach((shape) => {
    shape.userData.sharedHuman = true
  })
  return result
}

/** Fixed-length steel slides inside an opaque sleeve; neither the arm nor the blade stretches. */
export function addHanzoBlade(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
  fighter: ArcadeFighter
}): void {
  const { THREE, glow, model, fighter } = options
  if (fighter.id !== 'hanzo') return
  const forearm = model.root.getObjectByName('elbow-right')
  if (!forearm) return
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = bladeShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  const root = new THREE.Group()
  root.name = 'hanzo-hidden-blade'
  const housing = new THREE.Mesh(shapes.housing, glow(0x232730, 1))
  housing.position.set(0, -0.125, 0.065)
  root.add(housing)
  for (const y of [-0.04, -0.11, -0.18, -0.25]) {
    const wrap = new THREE.Mesh(shapes.bandage, glow(0xb9bcc1, 1))
    wrap.position.y = y
    root.add(wrap)
  }
  const slide = new THREE.Group()
  slide.name = 'hanzo-blade-slide'
  slide.position.z = 0.065
  const edge = new THREE.Mesh(shapes.edge, glow(0xdce5ed, 1))
  edge.position.y = -0.125
  const tip = new THREE.Mesh(shapes.tip, glow(0xeef4f7, 1))
  tip.position.y = -0.285
  tip.rotation.z = Math.PI
  slide.add(edge, tip)
  const point = new THREE.Object3D()
  point.name = 'hanzo-blade-tip'
  point.position.y = -BLADE_LENGTH
  slide.add(point)
  root.add(slide)
  forearm.add(root)
  animateHanzoBlade(model.turns, fighter)
}

export function animateHanzoBlade(figure: Object3D, fighter: ArcadeFighter): void {
  if (fighter.id !== 'hanzo') return
  const root = figure.getObjectByName('hanzo-hidden-blade')
  if (!root) return
  const extension = hanzoBladeExtension(fighter)
  root.visible = hanzoBladeAvailable(fighter)
  root.userData.extension = extension
  const slide = root.getObjectByName('hanzo-blade-slide')!
  slide.visible = extension > 0
  slide.position.y = -CANON.forearm + (1 - extension) * BLADE_LENGTH
}

/** The sleeve opens during startup, the point is fully out at contact, then it slides back. */
export function hanzoBladeExtension(fighter: ArcadeFighter): number {
  const attack = fighter.attack
  if (!hanzoBladeAvailable(fighter) || !attack || !hanzoBladeMove(attack.moveId)) return 0
  const frames = attackData(attack.kind, fighter)
  if (attack.frame < frames.startup)
    return smooth((attack.frame / Math.max(1, frames.startup) - 0.45) / 0.55)
  if (attack.frame < frames.startup + frames.active) return 1
  return (
    1 -
    smooth((attack.frame - frames.startup - frames.active) / Math.max(1, frames.recovery * 0.55))
  )
}

function smooth(value: number): number {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}
