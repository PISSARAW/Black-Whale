import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

export function hisokaHand(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const hand =
    options.handAnchor?.(side, 'lead') ??
    options.figureOf?.(side)?.getObjectByName(state[side].facing === 1 ? 'hand-right' : 'hand-left')
  return (
    hand?.localToWorld(new options.THREE.Vector3(0, -0.035, 0.025)) ??
    new options.THREE.Vector3(
      options.worldX(state[side].x),
      options.worldY(state[side].y) + 1.15,
      0.28,
    )
  )
}
export function hisokaChest(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const torso = options.figureOf?.(side)?.getObjectByName('torso')
  return (
    torso?.localToWorld(new options.THREE.Vector3(0, 0.02, 0.17)) ??
    new options.THREE.Vector3(
      options.worldX(state[side].x),
      options.worldY(state[side].y) + 1.15,
      0.28,
    )
  )
}
export function hisokaReduced(options: EffectSceneOptions) {
  const comfort = options.comfort?.()
  return comfort?.camera === 0 && comfort.flashes === false
}
