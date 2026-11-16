import type { Object3D } from 'three'
import type { HumanFigure } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'

/** Ch. 154: adult proportions and a massive frame, retaining Biscuit's costume and hair. */
export function biscuitTrueFormProfile(compact: HumanProfile): HumanProfile {
  return {
    ...compact,
    frame: 'adult',
    build: 'broad',
    height: 1.2,
    shoulders: 1.5,
    face: 'square',
    expression: 'severe',
  }
}

/** Thicken the masses, never the joint groups: elbows, wrists and feet keep their reach. */
export function shapeBiscuitTrueForm(model: HumanFigure): void {
  model.root.name = 'biscuit-true-form'
  for (const side of ['left', 'right']) {
    const shoulder = model.root.getObjectByName(`shoulder-${side}`)!
    const elbow = model.root.getObjectByName(`elbow-${side}`)!
    widen(shoulder.children[0], 1.85)
    widen(shoulder.children[2], 1.8)
    widen(elbow.children[0], 1.65)
    model.root.getObjectByName(`hand-${side}`)!.scale.multiplyScalar(1.25)
    widen(model.root.getObjectByName(`hip-${side}`)!.children[0], 1.55)
    widen(model.root.getObjectByName(`knee-${side}`)!.children[0], 1.4)
  }
}

function widen(part: Object3D, amount: number): void {
  part.scale.x *= amount
  part.scale.z *= amount
}
