import { Mesh } from 'three'
import type { Material } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'

export function revealFutureEyes(context: VictoryContext, iris: Material) {
  const { head } = context.hero
  const closed = 1 - ease((context.age - 286) / 14)
  for (const side of ['left', 'right']) {
    const eye = head.getObjectByName(`face-eye-${side}`)
    if (!eye) continue
    context.save(eye)
    eye.scale.y *= 1 - closed * 0.96
    const pupil = eye.getObjectByName('eye-pupil')
    if (pupil instanceof Mesh && context.age >= 286) context.material(pupil, iris)
  }
}
