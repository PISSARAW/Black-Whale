import { canAct } from './fightActorState'
import { chrolloKnifeContact } from './chrolloWeapon'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'

export type HistoricalWeapon = 'switchblade' | 'wristblade' | 'ben-knife' | 'bokken'
const WEAPONS: Partial<Record<FighterId, HistoricalWeapon>> = {
  leorio: 'switchblade',
  hanzo: 'wristblade',
  chrollo: 'ben-knife',
  kurapika: 'bokken',
}
const NAMES: Record<HistoricalWeapon, readonly [string, string]> = {
  switchblade: ['Couteau de Leorio', 'Leorio’s knife'],
  wristblade: ['Lame de poignet', 'Wrist blade'],
  'ben-knife': ['Couteau de Ben empoisonné', 'Poisoned Ben’s knife'],
  bokken: ['Armes de l’examen', 'Exam weapons'],
}
declare module './types' {
  interface ArcadeFighter {
    historicalWeapon?: HistoricalWeapon
    historicalWeaponSpent?: boolean
    historicalWeaponThrow?: HistoricalWeapon
    paralyticPoison?: { owner: FightSide; age: number; frames: number; contained: boolean }
  }
  interface FightProjectile {
    physicalBlade?: { weapon: HistoricalWeapon }
  }
}

export function historicalWeaponReady(fighter: ArcadeFighter): boolean {
  return !fighter.weaponsConfiscated && !fighter.historicalWeaponSpent && !fighter.hanzoProjection
}
export function historicalBladeStrike(fighter: ArcadeFighter): boolean {
  if (!historicalWeaponReady(fighter) || !fighter.attack || fighter.historicalWeaponThrow)
    return false
  if (fighter.id === 'feitan')
    return ['light', 'heavy'].includes(fighter.attack.kind) && fighter.attack.variant !== 'throw'
  return ordinaryBladeStrike(fighter)
}
function ordinaryBladeStrike(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'chrollo' && !chrolloKnifeContact(fighter)) return false
  const attack = fighter.attack!
  return Boolean(
    fighter.historicalWeapon &&
    fighter.historicalWeapon !== 'bokken' &&
    ['light', 'heavy'].includes(attack.kind) &&
    attack.variant !== 'throw',
  )
}
export function performHistoricalWeapon(
  options: ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options,
    actor = state[side]
  if (!weaponActionReady(state, side)) return state
  if (command.action === 'weapon-contain') return containPoison(state, side)
  const weapon = WEAPONS[actor.id]
  if (!weapon || !canHoldHistoricalWeapon(actor)) return state
  if (command.action === 'weapon-ready')
    return {
      ...state,
      [side]: {
        ...actor,
        historicalWeapon: actor.historicalWeapon ? undefined : weapon,
        arenaRecovery: 12,
      },
    }
  if (!canThrowHistoricalWeapon(command.action, weapon)) return state
  const cast = perform({
    state,
    side,
    kind: 'heavy',
    moveId: `${actor.id}:standingHeavy`,
    auraCharged: false,
  })
  return cast[side].attack && cast[side].attack !== actor.attack
    ? { ...cast, [side]: { ...cast[side], historicalWeaponThrow: weapon } }
    : cast
}
function canThrowHistoricalWeapon(action: string, weapon: HistoricalWeapon): boolean {
  return action === 'weapon-throw' && ['switchblade', 'ben-knife'].includes(weapon)
}
function canHoldHistoricalWeapon(actor: ArcadeFighter): boolean {
  return historicalWeaponReady(actor) && weaponHandFree(actor)
}
function weaponActionReady(state: FightState, side: FightSide): boolean {
  return state.phase === 'fighting' && !state.catsName && canAct(state[side]) && !state[side].attack
}
function weaponHandFree(actor: ArcadeFighter): boolean {
  return actor.id !== 'chrollo' || !(actor.chrolloBook?.open && actor.chrolloHistorical?.phone)
}
function containPoison(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    poison = actor.paralyticPoison
  if (!poison || poison.contained || poison.age >= 30) return state
  return {
    ...state,
    [side]: { ...actor, arenaRecovery: 18, paralyticPoison: { ...poison, contained: true } },
  }
}
export function historicalWeaponOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side],
    weapon = WEAPONS[actor.id]
  const entries: {
    action: ArsenalInvocation['command']['action']
    names: readonly [string, string]
  }[] = []
  if (weapon) {
    entries.push({ action: 'weapon-ready', names: NAMES[weapon] })
    if (['switchblade', 'ben-knife'].includes(weapon))
      entries.push({
        action: 'weapon-throw',
        names: ['Lancer le couteau réel', 'Throw the real knife'],
      })
  }
  if (actor.paralyticPoison)
    entries.push({
      action: 'weapon-contain',
      names: ['Contenir le poison au point de blessure', 'Contain poison at the wound'],
    })
  return entries.map(({ action, names }) => ({
    command: { action },
    labelFr: names[0],
    labelEn: names[1],
    ready:
      action === 'weapon-contain'
        ? Boolean(
            actor.paralyticPoison &&
            !actor.paralyticPoison.contained &&
            actor.paralyticPoison.age < 30 &&
            canAct(actor),
          )
        : canAct(actor) && !actor.attack && historicalWeaponReady(actor) && weaponHandFree(actor),
    conditionFr:
      'Équipement historique matériel du corps, mains disponibles et préparation vulnérable. Un couteau lancé est dépensé à sa libération. Le poison et sa contention sont des réglages de combat ; ni Hatsu copié ni soin.',
    conditionEn:
      'The body’s physical historical equipment, available hands and vulnerable preparation. A thrown knife is spent at release. Poison and containment use combat tuning; no copied Hatsu or healing.',
  }))
}
