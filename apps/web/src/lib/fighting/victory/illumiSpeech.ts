import { Mesh } from 'three'
import type { VictoryContext } from './types'

/** Quiet orders use the native mouth, preserving the face's proportions. */
export function illumiVictorySpeech(context: VictoryContext) {
  const source = context.hero.head.getObjectByName('face-mouth')
  if (!(source instanceof Mesh) || !source.morphTargetInfluences) return
  const weights = source.morphTargetInfluences.slice()
  const speaking = [
    [127, 162],
    [216, 258],
    [417, 453],
    [516, 588],
  ].some(([a, b]) => context.age >= a && context.age < b)
  source.morphTargetInfluences[0] = speaking
    ? 0.08 + Math.abs(Math.sin(context.age * 0.36)) * 0.16
    : 0
  context.defer(() =>
    weights.forEach((weight, i) => {
      source.morphTargetInfluences![i] = weight
    }),
  )
}
