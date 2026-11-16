import type { Mesh, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'

type Three = HumanFigureBuild['THREE']
const SHAPES = new WeakMap<Three, ReturnType<typeof makeShapes>>()

function makeShapes(THREE: Three) {
  const shapes = {
    jaw: new THREE.BoxGeometry(0.28, 0.16, 0.25),
    lobe: new THREE.SphereGeometry(0.03, 7, 5),
    ring: new THREE.TorusGeometry(0.025, 0.006, 4, 10),
  }
  Object.values(shapes).forEach((shape) => {
    shape.userData.sharedHuman = true
  })
  return shapes
}

/** Preserve the archive's palette; make the sewn colossus readable in the duel camera. */
export function franklinFightProfile(profile: HumanProfile): HumanProfile {
  return { ...profile, shoulders: 1.5 }
}

export function shapeFranklinFigure(options: {
  THREE: HumanFigureBuild['THREE']
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const { THREE, glow, model } = options
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = makeShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  model.root.name = 'franklin-colossus'
  for (const side of ['left', 'right']) {
    const shoulder = model.root.getObjectByName(`shoulder-${side}`)!
    const elbow = model.root.getObjectByName(`elbow-${side}`)!
    thicken(shoulder.children[0], 1.6)
    thicken(shoulder.children[2], 1.55)
    thicken(elbow.children[0], 1.5)
    thicken(model.root.getObjectByName(`hip-${side}`)!.children[0], 1.25)
    thicken(model.root.getObjectByName(`knee-${side}`)!.children[0], 1.2)
  }
  if (model.root.getObjectByName('manga-head:franklin-bordeau')) return
  const head = model.root.getObjectByName('face-mouth')!.parent!
  head.scale.x = 1.12
  const skin = (model.root.getObjectByName('hand-left') as Mesh).material
  const jaw = new THREE.Mesh(shapes.jaw, skin)
  jaw.name = 'franklin-square-jaw'
  jaw.position.set(0, -0.1, 0.01)
  head.add(jaw)
  for (const side of [-1, 1]) {
    const lobe = new THREE.Mesh(shapes.lobe, skin)
    lobe.scale.set(0.8, 2.7, 0.7)
    lobe.position.set(side * 0.19, -0.08, 0)
    lobe.name = 'franklin-long-earlobe'
    const ring = new THREE.Mesh(shapes.ring, glow(0xa89b72, 1))
    ring.position.set(side * 0.19, -0.17, 0.008)
    head.add(lobe, ring)
  }
}

function thicken(part: Object3D, amount: number): void {
  part.scale.x *= amount
  part.scale.z *= amount
}
