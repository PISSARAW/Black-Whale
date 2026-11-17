import { Quaternion, Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { reachCinematicHand } from './arm'
import { ease } from './resources'
import { groundVictoryActor } from './actors'

export function localToHead(actor: VictoryActor, point: Vector3) {
  return point
    .applyQuaternion(actor.head.getWorldQuaternion(new Quaternion()))
    .add(actor.head.getWorldPosition(new Vector3()))
}
export function reachVictoryHand(
  context: VictoryContext,
  options: { side: 'left' | 'right'; target: Vector3; pole?: Vector3 },
) {
  const pole =
    options.pole ??
    localToHead(context.hero, new Vector3(options.side === 'right' ? 0.4 : -0.4, -0.35, 0.15))
  return reachCinematicHand(context.hero.root, { side: options.side, target: options.target, pole })
}
export function victimTorso(context: VictoryContext) {
  return (context.victim.root.getObjectByName('torso') ?? context.victim.head).getWorldPosition(
    new Vector3(),
  )
}
export function fallVictoryVictim(
  context: VictoryContext,
  options: { start: number; duration: number; lift?: number },
) {
  const fall = ease((context.age - options.start) / options.duration)
  context.victim.root.position.y += fall * 0.17 + (options.lift ?? 0) * (1 - fall)
  context.victim.root.rotation.z = -fall * 1.5
  context.victim.head.rotation.x = fall * 0.16
  context.victim.root.updateWorldMatrix(true, true)
  return fall
}
export function turnVictoryHero(context: VictoryContext, start = 350) {
  context.hero.root.rotation.y *= 1 - ease((context.age - start) / (420 - start))
  context.hero.root.updateWorldMatrix(true, true)
}
export function crouchToVictoryTarget(context: VictoryContext, progress: number) {
  const depth =
    Math.max(
      0,
      Math.min(
        0.9,
        ((context.hero.height - context.victim.height - 0.3) / context.hero.height) * 1.6,
      ),
    ) * progress
  for (const side of ['left', 'right']) {
    context.hero.root.getObjectByName(`hip-${side}`)!.rotation.x = -depth * 0.9
    context.hero.root.getObjectByName(`knee-${side}`)!.rotation.x = depth * 1.8
  }
  groundVictoryActor(context.hero)
}
