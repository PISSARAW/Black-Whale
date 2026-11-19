import { voluntaryNenAvailable } from './nenAccess'
import { nenMasteryProfile } from './nenMastery'
import { shuObject } from './nenAdvanced'
import { blinkyAvailable } from './blinky'
import { hasIllumiNeedles } from './illumiEquipment'
import { hinrighCanThrow } from './hinrighKnives'
import type { ArcadeFighter, FightInput } from './types'

export interface NenApplication {
  id: string
  label: readonly [string, string]
  inputs: readonly (keyof FightInput)[]
  available: boolean
  condition: readonly [string, string]
}

/** The existing ranged action supplies a physical stone; it is never an emitted aura ball. */
export function shuSupportAvailable(fighter: ArcadeFighter): boolean {
  if (fighter.weaponsConfiscated) return false
  if (fighter.id === 'shizuku') return blinkyAvailable(fighter)
  if (fighter.id === 'illumi') return hasIllumiNeedles(fighter)
  if (fighter.id === 'hinrigh') return hinrighCanThrow(fighter)
  return shuObject(fighter) !== 'stone' || fighter.attack?.kind === 'ranged'
}

/** Convenience controls use ordinary held inputs; replay, admission and personal conditions stay authoritative. */
export function nenApplications(fighter: ArcadeFighter): readonly NenApplication[] {
  const basic = voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })
  const personal = voluntaryNenAvailable(fighter, { requireReserve: true })
  const learned = nenMasteryProfile(fighter.nenOwner ?? fighter.id)
  return [
    {
      id: 'strike',
      label: ['Renforcer la frappe', 'Reinforce the strike'],
      inputs: ['aura', 'focusHands'],
      available: basic,
      condition: [
        'Ryu vers les mains ; les autres zones restent moins protégées.',
        'Ryu to the hands leaves other regions less protected.',
      ],
    },
    {
      id: 'body',
      label: ['Protéger le corps', 'Protect the body'],
      inputs: ['aura', 'guard'],
      available: basic,
      condition: [
        'Ken entretient la protection ; la garde reste manuelle.',
        'Ken maintains protection; blocking remains manual.',
      ],
    },
    {
      id: 'weapon',
      label: ['Renforcer le support', 'Reinforce the support'],
      inputs: ['shu'],
      available: basic && shuSupportAvailable(fighter),
      condition: [
        'Shu exige un support disponible ; aucune arme n’est créée.',
        'Shu requires an available support; no weapon is created.',
      ],
    },
    {
      id: 'personal',
      label: ['Application personnelle', 'Personal application'],
      inputs: ['hatsu'],
      available: personal && learned.abilities.length > 0,
      condition: [
        'Capacité apprise uniquement ; préparation, cible et matériel restent nécessaires.',
        'Learned ability only; preparation, target and equipment remain required.',
      ],
    },
  ]
}
