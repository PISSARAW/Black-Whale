import { gyoSight } from './nenPerception'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

export function fineControlReduced(options: EffectSceneOptions) {
  const comfort = options.comfort?.()
  return comfort?.camera === 0 && comfort.flashes === false
}
export function threadVisible(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const viewer = options.viewer?.() ?? 'player'
  return side === viewer || !state[side].nen.in || gyoSight(state[viewer])
}
export function controlHand(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const hand =
    options.handAnchor?.(side, 'lead') ??
    options.figureOf?.(side)?.getObjectByName(state[side].facing === 1 ? 'hand-right' : 'hand-left')
  return (
    hand?.getWorldPosition(new options.THREE.Vector3()) ??
    new options.THREE.Vector3(
      options.worldX(state[side].x) + state[side].facing * 0.18,
      options.worldY(state[side].y) + 1.1,
      0.32,
    )
  )
}
export function controlChest(options: EffectSceneOptions, state: FightState, side: FightSide) {
  const torso = options.figureOf?.(side)?.getObjectByName('torso')
  return (
    torso?.localToWorld(new options.THREE.Vector3(0, 0, 0.17)) ??
    new options.THREE.Vector3(
      options.worldX(state[side].x),
      options.worldY(state[side].y) + 1.05,
      0.3,
    )
  )
}
export function fineControlEase(t: number) {
  t = Math.min(1, Math.max(0, t))
  return t * t * (3 - 2 * t)
}
