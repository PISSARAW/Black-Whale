import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { FightNenZone, FightSide } from './types'

export type PaperCommand = 'plant' | 'serpent' | 'doll'
export interface PlantedPaper {
  owner: FightSide
  ownerMember?: number
  zone: FightNenZone
}
export interface PaperWords {
  frame: number
  speaker: FightSide
  text: string
}
export interface PaperDoll {
  target: FightSide
  targetMember?: number
  createdAt: number
  active?: boolean
  heard?: PaperWords
}
export interface KallutoPaperState {
  zone: FightNenZone
  command?: PaperCommand
  /** Most recently prepared receiver, retained for the native move presentation. */
  doll?: PaperDoll
  dolls?: readonly PaperDoll[]
  heard?: PaperWords
}
export interface PaperProjectileMetadata {
  kallutoPaper?: 'plant' | 'serpent'
  paperOwner?: DolphinBodyRef
  paperTarget?: DolphinBodyRef
}
