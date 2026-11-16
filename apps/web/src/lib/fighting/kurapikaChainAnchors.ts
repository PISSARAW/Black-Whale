import type { Vector3 } from 'three'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { ChainStage } from './kurapikaChainMotion'
import type { FightSide, FightState } from './types'

/** Ring, index, middle, thumb, little: positions on the shared right-hand rig. */
const FINGERS = [
  [-0.01, -0.07, 0],
  [0.022, -0.06, 0],
  [0.006, -0.074, 0],
  [0, -0.005, 0.04],
  [-0.027, -0.055, 0],
] as const

export function chainFinger(
  options: EffectSceneOptions,
  context: { state: FightState; side: FightSide; stage: ChainStage },
): Vector3 {
  const { state, side, stage } = context
  const hand = options.figureOf?.(side)?.getObjectByName('hand-right')
  if (hand) return hand.localToWorld(new options.THREE.Vector3(...FINGERS[stage]))
  return new options.THREE.Vector3(
    options.worldX(state[side].x),
    options.worldY(state[side].y) + 1.1,
    0.3,
  )
}

export function chainChest(
  options: EffectSceneOptions,
  context: { state: FightState; side: FightSide },
): Vector3 {
  const figure = options.figureOf?.(context.side)
  const torso = figure?.getObjectByName('torso')
  if (torso) return torso.localToWorld(new options.THREE.Vector3(0, 0, 0.1))
  const chest = figure?.getObjectByName('fight-chest')
  if (chest) return chest.localToWorld(new options.THREE.Vector3(0, 1.12, 0.1))
  if (figure) return figure.localToWorld(new options.THREE.Vector3(0, 1.12, 0.1))
  return new options.THREE.Vector3(
    options.worldX(context.state[context.side].x),
    options.worldY(context.state[context.side].y) + 1.1,
    0.3,
  )
}

export function hideLegacyChain(options: EffectSceneOptions, side: FightSide): void {
  options
    .figureOf?.(side)
    ?.getObjectByName('hand-right')
    ?.traverse((node) => {
      if (node.name.startsWith('signature-chain')) node.visible = false
    })
}
