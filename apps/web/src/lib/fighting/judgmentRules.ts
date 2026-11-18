import type { ArcadeFighter, FightSide } from './types'

export type JudgmentClause =
  'zetsu' | 'no-troupe-contact' | 'truthful-answers' | 'no-disclosure' | 'return-hostage'
export type JudgmentPreset =
  'nen' | 'contact' | 'nen-contact' | 'answers' | 'secret' | 'hostage-secret'
export interface JudgmentSeal {
  hostageId?: string
  deadlineFrame?: number
  owner: FightSide
  ownerMember?: number
  rule: JudgmentClause
  clauses?: readonly JudgmentClause[]
  inquiry?: import('./judgmentInquiryTypes').JudgmentInquiry
  lastInquiryAt?: number
}
export const JUDGMENT_PRESETS: Record<JudgmentPreset, readonly JudgmentClause[]> = {
  secret: ['no-disclosure'],
  'hostage-secret': ['return-hostage', 'no-disclosure'],
  nen: ['zetsu'],
  contact: ['no-troupe-contact'],
  'nen-contact': ['zetsu', 'no-troupe-contact'],
  answers: ['truthful-answers'],
}
export function judgmentClauses(fighter: ArcadeFighter): readonly JudgmentClause[] {
  const seal = fighter.judgmentChain
  return seal?.clauses ?? (seal ? [seal.rule] : [])
}
export function judgmentForbidsNen(fighter: ArcadeFighter): boolean {
  return judgmentClauses(fighter).includes('zetsu')
}
export function selectedJudgmentClauses(fighter: ArcadeFighter): readonly JudgmentClause[] {
  return JUDGMENT_PRESETS[fighter.judgmentPreset ?? 'nen']
}
export function createJudgmentSeal(
  fighter: ArcadeFighter,
  owner: FightSide,
  member = 0,
): JudgmentSeal {
  const clauses = fighter.judgmentDeclaration?.clauses ?? selectedJudgmentClauses(fighter)
  return clauses.length === 1
    ? { owner, ownerMember: member, rule: clauses[0] }
    : { owner, ownerMember: member, rule: clauses[0], clauses: [...clauses] }
}
