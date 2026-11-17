import { Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { reachCinematicHand } from './arm'
import { groundVictoryActor } from './actors'
import { localToHead } from './pose'
import { ease } from './resources'

function knees(actor: VictoryActor, bend: number) {
  for (const side of ['left', 'right']) {
    actor.root.getObjectByName(`hip-${side}`)!.rotation.x = -bend / 2
    const knee = actor.root.getObjectByName(`knee-${side}`)!
    knee.rotation.x = bend
    knee.children[1].rotation.x = -bend / 2
  }
  groundVictoryActor(actor)
}
export function lowerGuardForProp(actor: VictoryActor, y: number) {
  let low = 0,
    high = 2.8
  for (let i = 0; i < 10; i++) {
    knees(actor, (low + high) / 2)
    const shoulder = actor.root.getObjectByName('shoulder-right')!.getWorldPosition(new Vector3())
    if (shoulder.y > y + 0.2) low = (low + high) / 2
    else high = (low + high) / 2
  }
}
export function guardHand(actor: VictoryActor, side: 'left' | 'right', target: Vector3) {
  return reachCinematicHand(actor.root, {
    side,
    target,
    pole: localToHead(actor, new Vector3(side === 'left' ? -0.5 : 0.5, -0.35, 0.35)),
  })
}
/** Place one shared sheet inside the real reach of both writers and its holding hand. */
export function fitGuardProp(
  centre: Vector3,
  grips: readonly { actor: VictoryActor; side: 'left' | 'right'; offset: Vector3 }[],
) {
  for (let pass = 0; pass < 24; pass++)
    for (const { actor, side, offset } of grips) {
      const shoulder = actor.root
        .getObjectByName(`shoulder-${side}`)!
        .getWorldPosition(new Vector3())
      const elbow = actor.root.getObjectByName(`elbow-${side}`)!.getWorldPosition(new Vector3())
      const hand = actor.root.getObjectByName(`hand-${side}`)!.getWorldPosition(new Vector3())
      const length = elbow.distanceTo(shoulder) + hand.distanceTo(elbow) - 0.005
      const delta = centre.clone().add(offset).sub(shoulder),
        distance = delta.length()
      if (distance > length) centre.addScaledVector(delta, (length - distance) / distance)
    }
  return centre
}
export function guardIncoming(context: VictoryContext, target: Vector3, start: number) {
  const punch = ease((context.age - start) / 24) * (1 - ease((context.age - start - 30) / 18))
  const from = localToHead(context.victim, new Vector3(0.18, -0.28, 0.26))
  guardHand(context.victim, 'right', from.lerp(target, punch))
  context.victim.head.rotation.x = -punch * 0.08
  return punch
}
