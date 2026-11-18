import type { AttackKind, AttackVariant, FighterId } from './types'
import type { ChrolloPage } from './chrolloBook'
import type { GumSource } from './bungeeSource'

export interface FightAttack {
  /** Execution channel captured when a Hisoka technique actually starts. */
  nenOrigin?: GumSource
  copiedPage?: ChrolloPage
  moveId?: string
  variant?: AttackVariant
  confirmedBlock?: boolean
  /** The AI already rolled its follow-up for this contact (aiComboFollowUp.ts). */
  aiFollowUpRolled?: boolean
  confirmedHit?: boolean
  comboOpening?: import('./comboOpenings').ComboOpening
  comboFollowup?: import('./comboOpenings').ComboOpening
  directionalChain?: import('./directionalChain').DirectionalChain
  kind: AttackKind
  frame: number
  impacted: boolean
  auraCharged: boolean
  concealed: boolean
  hatsuSource: FighterId | null
  projectileSpawned: boolean
  projectilesSpawned?: number
  /** Charge committed to this one right punch, including a miss. */
  cyclotronTurns?: number
  reversal: boolean
}
