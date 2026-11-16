import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'

type Three = HumanFigureBuild['THREE']
const SHAPES = new WeakMap<Three, ReturnType<typeof handgunShapes>>()

function handgunShapes(THREE: Three) {
  const shapes = {
    slide: new THREE.BoxGeometry(0.085, 0.075, 0.25),
    grip: new THREE.BoxGeometry(0.07, 0.15, 0.07),
    muzzle: new THREE.BoxGeometry(0.06, 0.055, 0.02),
  }
  Object.values(shapes).forEach((shape) => (shape.userData.sharedHuman = true))
  return shapes
}

/** A generic physical handgun; no unconfirmed model, calibre or Nen effect. */
export function addThetaHandgun(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const { THREE, glow, model } = options
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = handgunShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  const gun = new THREE.Group()
  gun.name = 'theta-physical-handgun'
  gun.rotation.x = Math.PI / 2
  const slide = new THREE.Mesh(shapes.slide, glow(0x353b43, 1))
  slide.position.set(0, 0, 0.09)
  const grip = new THREE.Mesh(shapes.grip, glow(0x20242a, 1))
  grip.position.set(0, -0.09, 0)
  grip.rotation.x = -0.15
  const muzzle = new THREE.Mesh(shapes.muzzle, glow(0x111318, 1))
  muzzle.position.set(0, 0, 0.225)
  gun.add(slide, grip, muzzle)
  gun.position.set(0, -0.015, 0.065)
  model.root.getObjectByName('hand-right')?.add(gun)
}
