import type { AttackKind, AttackVariant, FightNenZone, FighterId, MoveSlot } from './types'

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
  tuning: MoveTuning
  cancelInto: readonly string[]
}

export interface FighterMoveset {
  fighterId: FighterId
  mechanicFr: string
  mechanicEn: string
  finisherConditionFr: string
  finisherConditionEn: string
  moves: readonly FighterMove[]
  combos: readonly (readonly string[])[]
}
