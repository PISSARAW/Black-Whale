import { Vector3, type Object3D } from 'three'
import { bodySurfaceBox } from './fightBodySeparation'
import type { ArcadeFighter } from './types'

/** Hold a body-local contact during the active beat, independent of the attacker's changing shoulder height. */
export function createFightContactLatch() {
  let key = '',
    frame = -1,
    local: Vector3 | undefined
  return (
    fighter: ArcadeFighter,
    part: Object3D,
    input: { position: Vector3; active: boolean; identity: string },
  ) => {
    const attack = fighter.attack!
    const next = `${input.identity}:${attack.moveId}:${fighter.facing}`
    if (next !== key || attack.frame < frame || !input.active) local = undefined
    key = next
    frame = attack.frame
    if (!input.active) return input.position
    if (!local) local = part.worldToLocal(input.position.clone())
    const skin = bodySurfaceBox(part)
    const held = skin.clampPoint(part.localToWorld(local.clone()), new Vector3())
    held.x = fighter.facing === 1 ? skin.min.x - 0.015 : skin.max.x + 0.015
    return held
  }
}
