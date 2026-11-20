import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { FightNenZone, FightSide } from './types'

export type PaperCommand = 'plant' | 'serpent' | 'doll'
export interface PlantedPaper {
  paperId?: string
  materialCopyId?: string
  owner: FightSide
  ownerMember?: number
  zone: FightNenZone
  /**
   * Committed to a listening doll: it feeds receivers but no longer guides attack paper.
   * Loose confetti never carry this flag — only a fragment fixed to a person can listen.
   */
  listening?: boolean
}
export interface PaperWords {
  frame: number
  speaker: FightSide
  text: string
}
export interface PaperDoll {
  paperId?: string
  materialCopyId?: string
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
  paperScatterId?: string
  paperBurstId?: string
  paperId?: string
  kallutoPaper?: 'plant' | 'serpent'
  paperOwner?: DolphinBodyRef
  paperTarget?: DolphinBodyRef
}
