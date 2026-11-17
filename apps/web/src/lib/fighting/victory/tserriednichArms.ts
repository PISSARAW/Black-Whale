import { Quaternion, Vector3 } from 'three'
import type { VictoryActor } from './types'
import { reachCinematicHand } from './arm'

/** Relaxed arms follow the shoulder and keep the elbow below the wrist's reach arc. */
export function relaxedFutureHand(actor: VictoryActor, side: 'left' | 'right') {
  actor.root.updateWorldMatrix(true, true)
  const shoulder = actor.root.getObjectByName(`shoulder-${side}`)!.getWorldPosition(new Vector3())
  const elbow = actor.root.getObjectByName(`elbow-${side}`)!.getWorldPosition(new Vector3())
  const hand = actor.root.getObjectByName(`hand-${side}`)!.getWorldPosition(new Vector3())
  const length = shoulder.distanceTo(elbow) + elbow.distanceTo(hand)
  return shoulder.add(new Vector3(0, -length * 0.995, 0.015))
}
export function guideFutureHand(
  actor: VictoryActor,
  side: 'left' | 'right',
  options: { target: Vector3; amount: number },
) {
  const rest = relaxedFutureHand(actor, side)
  const outward = new Vector3(side === 'right' ? 0.22 : -0.22, -0.4, 0.12).applyQuaternion(
    actor.root.getWorldQuaternion(new Quaternion()),
  )
  const shoulder = actor.root.getObjectByName(`shoulder-${side}`)!.getWorldPosition(new Vector3())
  return reachCinematicHand(actor.root, {
    side,
    target: rest.lerp(options.target, options.amount),
    pole: shoulder.add(outward),
  })
}
