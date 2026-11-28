import type { Object3D } from 'three'
import type { EffectSceneOptions } from './fighterEffectScene'
import { attackData } from './frameData'
import { FEITAN_FINAL_REVERSAL, PERSONAL_SIGNATURE_MOVES } from './personalSignatureMoves'
import type { FightSide, FightState } from './types'

/** Aim the in-hand blade through the live strike plane, including after a side switch. */
export function alignPersonalBlade(
  options: EffectSceneOptions,
  blade: Object3D,
  context: { state: FightState; side: FightSide },
): void {
  const { side, state } = context
  const actor = state[side]
  const attack = actor.attack
  const hand = blade.parent
  if (!attack || !hand || PERSONAL_SIGNATURE_MOVES[attack.moveId ?? '']?.material !== 'blade')
    return
  const data = attackData(attack.kind, actor)
  const lead = attack.moveId === FEITAN_FINAL_REVERSAL ? 5 : 2
  if (attack.frame < data.startup - lead || attack.frame >= data.startup + data.active) return

  const { THREE, worldX, worldY } = options
  hand.updateWorldMatrix(true, false)
  const from = blade.getWorldPosition(new THREE.Vector3())
  const hit = bladeContact(state, side, data.box)
  // The cutting edge passes through the contact instead of stopping at the hilt.
  const contact = new THREE.Vector3(worldX(hit.x) + actor.facing * 0.45, worldY(hit.y), from.z)
  const swing = (data.startup - attack.frame) * 0.12
  contact.y += swing
  hand.worldToLocal(contact)
  contact.sub(blade.position).normalize()
  blade.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), contact)
}

function bladeContact(
  state: FightState,
  side: FightSide,
  box: { right: number; top: number; bottom: number },
) {
  const actor = state[side]
  if (actor.attack?.confirmedHit && state.impact?.attacker === side) return state.impact.position
  const target = state[side === 'player' ? 'opponent' : 'player']
  const reach = Math.min(Math.abs(target.x - actor.x), box.right)
  return { x: actor.x + actor.facing * reach, y: actor.y + (box.top + box.bottom) * 0.5 }
}
