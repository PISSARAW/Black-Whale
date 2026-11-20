import type { AttackKind, AttackVariant, FighterId } from './types'
import type { ChrolloPage } from './chrolloBook'
import type { GumSource } from './bungeeSource'
import type { IllumiNeedleMode } from './illumiNeedleFaceTypes'

export interface FightAttack {
  superThrow?: true
  /** Execution channel captured when a supported technique actually starts. */
  nenOrigin?: GumSource
  illumiNeedleMode?: IllumiNeedleMode
  copiedPage?: ChrolloPage
  moveId?: string
  variant?: AttackVariant
  confirmedBlock?: boolean
  /** The AI already rolled its follow-up for this contact (aiComboFollowUp.ts). */
  aiFollowUpRolled?: boolean
  confirmedHit?: boolean
  comboOpening?: import('./comboOpenings').ComboOpening
  comboFollowup?: import('./comboOpenings').ComboOpening
  /** Started by a relance; it may strike a body put down by its predecessor. */
  accel?: true
  directionalChain?: import('./directionalChain').DirectionalChain
  kind: AttackKind
  frame: number
  impacted: boolean
  auraCharged: boolean
  concealed: boolean
  hatsuSource: FighterId | null
  projectileSpawned: boolean
  projectilesSpawned?: number
  /** Blinky already swallowed its one named object during this suction. */
  blinkySwallowed?: true
  /** Charge committed to this one right punch, including a miss. */
  cyclotronTurns?: number
  reversal: boolean
}
