import { Vector3 } from 'three'
import type { VictoryActor } from './types'
import { reachCinematicHand } from './arm'
import { localToHead } from './pose'

export function poetHand(actor: VictoryActor, side: 'left' | 'right', target: Vector3) {
  return reachCinematicHand(actor.root, {
    side,
    target,
    pole: localToHead(actor, new Vector3(side === 'left' ? -0.3 : 0.3, -0.75, 0.25)),
  })
}
