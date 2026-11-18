import { hasEquipment, personalEquipment } from './preparationWorld'
import type { ArcadeFighter, FightSide, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    biohazardReceiver?: { owner: FightSide; deviceId: string }
  }
}

/** Ch. 398: give the real receiver away; the other body must agree and be within hand reach. */
export function performBiohazardReceiver(state: FightState, side: FightSide): FightState {
  const other = side === 'player' ? 'opponent' : 'player'
  const actor = state[side],
    target = state[other]
  if (!hasEquipment(actor, 'tracker-receiver') || hasEquipment(target, 'tracker-receiver'))
    return state
  if (!target.supportConsent || target.health <= 0 || target.hanzoProjection) return state
  if (Math.hypot(actor.x - target.x, actor.y - target.y) > 6) return state
  const equipment = receiverEquipment(actor)
  return {
    ...state,
    [side]: {
      ...actor,
      equipment: equipment.filter((item) => item !== 'tracker-receiver'),
      biohazardReceiver: undefined,
    },
    [other]: {
      ...target,
      equipment: [...receiverEquipment(target), 'tracker-receiver'],
      biohazardReceiver: actor.biohazardReceiver ?? { owner: side, deviceId: 'kit:transmitter' },
    },
  }
}

function receiverEquipment(fighter: ArcadeFighter) {
  return fighter.equipment ?? personalEquipment(fighter.nenOwner ?? fighter.id)
}
