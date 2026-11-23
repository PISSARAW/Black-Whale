import type { GuardRequirement } from './combatProperties'
import type { AttackKind, AttackVariant, FightNenZone, FighterId, MoveSlot } from './types'
import type { TechniqueCanonContract } from './techniqueContracts'

export type MoveCategory = 'normal' | 'command' | 'special' | 'throw' | 'finisher'

export interface MoveTuning {
  startup: number
  active: number
  recovery: number
  damage: number
  hitstun: number
  blockstun: number
  hitstop: number
  knockback: number
  lunge: number
  reach: number
  bottom: number
  top: number
  targetZone: FightNenZone
  auraZone: FightNenZone
}

export interface FighterMove {
  id: string
  slot: MoveSlot
  category: MoveCategory
  kind: AttackKind
  variant: AttackVariant
  nameFr: string
  nameEn: string
  input: string
  auraCost: number
  canon: TechniqueCanonContract
  tuning: MoveTuning
  guard: GuardRequirement
  cancelOnBlockInto: readonly string[]
  canHitDowned: boolean
  reversalInvulnerableFrames: number
  cancelInto: readonly string[]
  /** Cancel bounds in frames relative to the attack's first active frame. */
  cancelWindow?: { start: number; end: number }
  /** Training hints for recovery links; these never grant a cancel or bypass hitstun. */
  linkInto?: readonly string[]
}

export type MoveFollowUpInput = 'light' | 'heavy' | 'special'
export type MoveFollowUpCondition = 'on-hit' | 'on-block' | 'airborne' | 'crossed' | 'counter'

export interface MoveFollowUp {
  id: string
  sourceMoveId: string
  input: MoveFollowUpInput
  condition: MoveFollowUpCondition
  move: FighterMove
}

export interface FighterMoveset {
  fighterId: FighterId
  mechanicFr: string
  mechanicEn: string
  finisherConditionFr: string
  finisherConditionEn: string
  moves: readonly FighterMove[]
  followUps?: readonly MoveFollowUp[]
  combos: readonly (readonly string[])[]
}
