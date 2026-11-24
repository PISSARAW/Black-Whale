import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { ArcadeFighter } from './types'

type Three = HumanFigureBuild['THREE']
const SHAPES = new WeakMap<Three, ReturnType<typeof knifeShapes>>()
function knifeShapes(THREE: Three) {
  const shapes = {
    grip: new THREE.BoxGeometry(0.055, 0.16, 0.045),
    guard: new THREE.BoxGeometry(0.12, 0.025, 0.065),
    blade: new THREE.BoxGeometry(0.035, 0.39, 0.014),
    point: new THREE.ConeGeometry(0.021, 0.1, 4),
  }
  Object.values(shapes).forEach((shape) => {
    shape.userData.sharedHuman = true
  })
  return shapes
}
/** The ordinary physical knife of ch. 378–379, not an ability received with a stolen page. */
export function addLuiniKnife(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
  fighter: ArcadeFighter
}): void {
  const { THREE, glow, model, fighter } = options
  if (fighter.id !== 'luini') return
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = knifeShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  const root = new THREE.Group()
  root.name = 'luini-physical-knife'
  const grip = new THREE.Mesh(shapes.grip, glow(0x292a2e, 1))
  const guard = new THREE.Mesh(shapes.guard, glow(0x626a73, 1))
  guard.position.y = -0.085
  const blade = new THREE.Mesh(shapes.blade, glow(0xc3cbd3, 1))
  blade.position.y = -0.29
  const point = new THREE.Mesh(shapes.point, glow(0xc3cbd3, 1))
  point.name = 'luini-knife-point'
  point.rotation.z = Math.PI
  point.position.y = -0.53
  root.add(grip, guard, blade, point)
  root.position.set(0, -0.01, 0.055)
  root.visible = !fighter.weaponsConfiscated
  model.root.getObjectByName('hand-right')?.add(root)
}
export function luiniKnifeStrike(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (fighter.id !== 'luini' || fighter.weaponsConfiscated || !attack) return false
  if (attack.variant === 'low' || attack.variant === 'throw') return false
  return attack.kind === 'light' || attack.kind === 'heavy'
}
