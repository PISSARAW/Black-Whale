import { Vector3, type Object3D } from 'three'
import { fightPhysicalProfile } from './fightPhysicalProfile'
import type { ArcadeFighter, FightNenZone } from './types'

interface SurfaceContact {
  frame: number
  sequence: number
  zone: FightNenZone
  position: Vector3
}
const CONTACTS = new WeakMap<Object3D, SurfaceContact>()

/** A grounded short fighter strikes the reachable trunk; the engine's Nen defence zone stays authoritative. */
export function anatomicalContactZone(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
  zone: FightNenZone,
): FightNenZone {
  if (zone !== 'head' || attacker.y > 0 || defender.y > 0) return zone
  const own = fightPhysicalProfile(attacker),
    rival = fightPhysicalProfile(defender)
  // Reserve horizontal reach: the arm cannot spend its full length only on the height difference.
  return rival.chinHeight - own.shoulderHeight > own.armReach * 0.65 ? 'torso' : zone
}

export function rememberSurfaceContact(figure: Object3D, contact: SurfaceContact): void {
  CONTACTS.set(figure, { ...contact, position: contact.position.clone() })
}

export function surfaceContactAt(
  figure: Object3D,
  frame: number,
  sequence: number,
): Vector3 | undefined {
  const contact = CONTACTS.get(figure)
  return contact?.frame === frame && contact.sequence === sequence
    ? contact.position.clone()
    : undefined
}
