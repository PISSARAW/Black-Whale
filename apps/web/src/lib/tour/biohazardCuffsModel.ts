import { modelKit } from './nenModelPrimitives'
import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'

/** The retained physical object in the visit's handcuff-pigeons, also used after reversion. */
export function buildBiohazardCuffs(seen: Apparition, context: BasicApparitionContext) {
  const k = modelKit(context, seen.size)
  for (const side of [-1, 1]) {
    const cuff = k.add({
      geometry: new context.THREE.TorusGeometry(0.19 * seen.size, 0.03 * seen.size, 8, 20),
      colour: 0xaaaeb3, at: [side * 0.5, 0.09, 0], name: `retained-cuff-${side}`,
    })
    cuff.rotation.x = Math.PI / 2
  }
  k.tube({ name: 'handcuff-link', points: [[-0.4, 0.09, 0], [0, 0.03, 0], [0.4, 0.09, 0]],
    radius: 0.025, colour: 0xaaaeb3 })
  return context.root
}
