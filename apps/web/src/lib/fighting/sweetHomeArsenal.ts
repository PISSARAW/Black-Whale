import { canAct } from './fightActorState'
import { chrolloHasActivePage } from './chrolloBook'
import { sweetHomeAvailable, SWEET_HOME_HAND_REACH } from './sweetHomeContacts'
import { liveEntity } from './preparationWorld'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

function ownsSweetHome(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return (
    fighter.id === 'terebellum' ||
    chrolloHasActivePage(fighter, 'terebellum') ||
    Boolean(fighter.kurapika?.held?.used && fighter.kurapika.held.source === 'terebellum')
  )
}

export function sweetHomeObjects(state: FightState, side: FightSide) {
  const fighter = state[side]
  return (state.battlefield?.entities ?? []).filter(
    (entry) =>
      entry.kind === 'crate' &&
      entry.material === 'real' &&
      liveEntity(entry) &&
      fighter.y <= 4 &&
      (entry.x - fighter.x) * fighter.facing >= 0 &&
      Math.abs(entry.x - fighter.x) <= SWEET_HOME_HAND_REACH,
  )
}

export function performSweetHomeCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const fighter = state[side]
  if (
    command.action !== 'sweet-home-object' ||
    !ownsSweetHome(state, side) ||
    !canAct(fighter) ||
    fighter.attack ||
    !sweetHomeAvailable(state, side)
  )
    return state
  if (command.target === 'release')
    return fighter.sweetHomeObject
      ? { ...state, [side]: { ...fighter, sweetHomeObject: undefined } }
      : state
  if (!sweetHomeObjects(state, side).some((object) => object.id === command.target)) return state
  return { ...state, [side]: { ...fighter, sweetHomeObject: command.target } }
}

export function sweetHomeOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!ownsSweetHome(state, side)) return []
  const targets = [...sweetHomeObjects(state, side).map((entry) => entry.id), 'release']
  return targets.map((target) => ({
    command: { action: 'sweet-home-object', target },
    labelFr:
      target === 'release'
        ? 'Sweet Home · Libérer la main gauche'
        : `Sweet Home · Main gauche sur ${target}`,
    labelEn:
      target === 'release'
        ? 'Sweet Home · Release left hand'
        : `Sweet Home · Left hand on ${target}`,
    ready: performSweetHomeCommand(state, side, { action: 'sweet-home-object', target }) !== state,
    conditionFr:
      'Préparer un objet réel, puis activer Sweet Home. Le contact gauche est revérifié à l’impact ; absorber autrui exige aussi le contact droit. Une caisse détruite ne peut plus recevoir de blessure.',
    conditionEn:
      'Select a real object, then activate Sweet Home. Left contact is rechecked at impact; absorbing another body also requires right contact. A destroyed crate cannot receive another wound.',
  }))
}
