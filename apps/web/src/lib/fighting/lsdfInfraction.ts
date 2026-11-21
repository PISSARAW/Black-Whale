import type { FightEquipment } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/**
 * The infraction Yokotani must qualify before LSDF answers it. Each one is a fact
 * the duel can actually observe at the moment of the introduction; nothing is
 * presumed beyond the scenario's premise that the intruder entered unlawfully.
 */
export type LsdfInfraction = 'trespass' | 'armed-trespass' | 'assault'

/** Intervention level opened by each infraction; aggression may still raise it. */
export const LSDF_GRAVITY: Record<LsdfInfraction, number> = {
  trespass: 1,
  'armed-trespass': 2,
  assault: 3,
}

/** Portable weapons the guards may confiscate. Bodies and Nen constructs are never seized. */
export const LSDF_PORTABLE_WEAPONS: readonly FightEquipment[] = ['needles']

export function carriesPortableWeapon(fighter: ArcadeFighter): boolean {
  if (fighter.weaponsConfiscated) return false
  return (fighter.equipment ?? []).some((item) => LSDF_PORTABLE_WEAPONS.includes(item))
}

export function withoutPortableWeapons(fighter: ArcadeFighter): ArcadeFighter['equipment'] {
  return fighter.equipment?.filter((item) => !LSDF_PORTABLE_WEAPONS.includes(item))
}

/** The gravest infraction actually committed by the intruder facing `side`, or none. */
export function qualifyLsdfInfraction(state: FightState, side: FightSide): LsdfInfraction | null {
  const target: FightSide = side === 'player' ? 'opponent' : 'player'
  if (!state.environment.unlawfulIntruders[target]) return null
  // In the hideout duel, only the intruder can have wounded the jurisdiction's defender.
  if (state[side].health < state[side].maxHealth) return 'assault'
  return carriesPortableWeapon(state[target]) ? 'armed-trespass' : 'trespass'
}

const CHARGE: Record<LsdfInfraction, { fr: string; en: string }> = {
  trespass: {
    fr: 'Vous êtes entré sans droit dans la planque Heil-Ly : violation de domicile',
    en: 'You entered the Heil-Ly hideout without right: trespass',
  },
  'armed-trespass': {
    fr: 'Vous êtes entré armé dans la planque Heil-Ly : intrusion armée',
    en: 'You entered the Heil-Ly hideout armed: armed trespass',
  },
  assault: {
    fr: 'Vous avez frappé dans la planque Heil-Ly : violences',
    en: 'You struck inside the Heil-Ly hideout: assault',
  },
}

export function lsdfCharge(infraction: LsdfInfraction, language: 'fr' | 'en'): string {
  return CHARGE[infraction][language]
}

export const LSDF_INFRACTION_LABEL: Record<LsdfInfraction, { fr: string; en: string }> = {
  trespass: { fr: 'violation de domicile', en: 'trespass' },
  'armed-trespass': { fr: 'intrusion armée', en: 'armed trespass' },
  assault: { fr: 'violences', en: 'assault' },
}
