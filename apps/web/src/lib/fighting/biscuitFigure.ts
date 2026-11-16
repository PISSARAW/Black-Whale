import { mangaBiscuitTrueForm } from '$lib/tour/mangaBiscuitProfile'
import type { Object3D } from 'three'
import type { HumanFigure } from '$lib/tour/humanFigure'
import type { HumanProfile } from '$lib/tour/humanProfiles'

/** The supplied adult appearance is shared with previews, resolved only on transformation. */
export function biscuitTrueFormProfile(compact: HumanProfile): HumanProfile {
  return mangaBiscuitTrueForm(compact)
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
    const hip = model.root.getObjectByName(`hip-${side}`)!
    hip.position.x *= 1.5
    widen(hip.children[0], 1.55)
    widen(model.root.getObjectByName(`knee-${side}`)!.children[0], 1.4)
  }
}

function widen(part: Object3D, amount: number): void {
  part.scale.x *= amount
  part.scale.z *= amount
}
