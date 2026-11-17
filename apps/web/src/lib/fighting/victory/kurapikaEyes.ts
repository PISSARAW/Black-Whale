import { Mesh } from 'three'
import type { Material } from 'three'
import type { VictoryContext } from './types'

export function scarletEyes(context: VictoryContext, material: Material) {
  for (const side of ['left', 'right']) {
    const iris = context.hero.head.getObjectByName(`face-eye-${side}`)?.getObjectByName('eye-pupil')
    if (iris instanceof Mesh) context.material(iris, material)
  }
}
