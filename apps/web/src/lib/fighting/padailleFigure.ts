import type { Group, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import { padailleNenActive, type PadailleTool } from './padailleWeapon'
import type { ArcadeFighter } from './types'

type Three = HumanFigureBuild['THREE']
interface WeaponFigure {
  hand: Object3D
  tools: Record<PadailleTool, Group>
}
const MODELS = new WeakMap<Object3D, WeaponFigure>()
const SHAPES = new WeakMap<Three, ReturnType<typeof weaponShapes>>()

function weaponShapes(THREE: Three) {
  const blade = new THREE.Shape()
  blade.moveTo(0.01, 0.02)
  blade.lineTo(0.27, 0.08)
  blade.quadraticCurveTo(0.35, -0.12, 0.25, -0.27)
  blade.lineTo(0.01, -0.18)
  blade.closePath()
  const shapes = {
    neck: new THREE.CylinderGeometry(0.045, 0.045, 0.18, 8),
    hammer: new THREE.BoxGeometry(0.4, 0.2, 0.2),
    drill: new THREE.ConeGeometry(0.085, 0.38, 12),
    ring: new THREE.TorusGeometry(0.084, 0.012, 4, 12),
    axe: new THREE.ExtrudeGeometry(blade, { depth: 0.055, bevelEnabled: false }),
  }
  Object.values(shapes).forEach((geometry) => {
    geometry.userData.sharedHuman = true
  })
  return shapes
}

/** The weapon replaces the right hand's mesh; it never appears on a leg or the other arm. */
export function addPadailleWeapon(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const { THREE, glow, model } = options
  const hand = model.root.getObjectByName('hand-right')
  if (!hand?.parent) return
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = weaponShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  const metal = glow(0xa3a7ad, 1)
  const dark = glow(0x4d5058, 1)
  const tools = { hammer: new THREE.Group(), drill: new THREE.Group(), axe: new THREE.Group() }
  for (const [name, tool] of Object.entries(tools)) {
    tool.name = `padaille-${name}-right-hand`
    tool.visible = false
    tool.position.copy(hand.position)
    hand.parent.add(tool)
  }
  const neck = new THREE.Mesh(shapes.neck, dark)
  neck.position.y = -0.05
  tools.hammer.add(neck)
  const head = new THREE.Mesh(shapes.hammer, metal)
  head.position.y = -0.18
  tools.hammer.add(head)
  const drill = new THREE.Mesh(shapes.drill, metal)
  drill.rotation.z = Math.PI
  drill.position.y = -0.16
  tools.drill.add(drill)
  for (let index = 0; index < 6; index++) {
    const ring = new THREE.Mesh(shapes.ring, dark)
    ring.scale.setScalar(1 - index / 7)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -index * 0.05
    tools.drill.add(ring)
  }
  const axe = new THREE.Mesh(shapes.axe, metal)
  axe.position.z = -0.0275
  tools.axe.add(neck.clone(), axe)
  MODELS.set(model.turns, { hand, tools })
}

export function animatePadailleWeapon(
  figure: Object3D,
  fighter: ArcadeFighter,
  seconds: number,
): void {
  const model = MODELS.get(figure)
  if (!model) return
  const active = padailleNenActive(fighter) ? fighter.padailleTool : undefined
  model.hand.visible = !active
  for (const [name, tool] of Object.entries(model.tools)) {
    tool.visible = name === active
    tool.rotation.copy(model.hand.rotation)
  }
  if (active === 'drill') model.tools.drill.rotation.y += seconds * 22
}
