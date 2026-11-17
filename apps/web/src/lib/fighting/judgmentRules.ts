import type { ArcadeFighter, FightSide } from './types'

export type JudgmentClause = 'zetsu' | 'no-troupe-contact'
export type JudgmentPreset = 'nen' | 'contact' | 'nen-contact'
export interface JudgmentSeal {
  owner: FightSide
  rule: JudgmentClause
  clauses?: readonly JudgmentClause[]
}
export const JUDGMENT_PRESETS: Record<JudgmentPreset, readonly JudgmentClause[]> = {
  nen: ['zetsu'],
  contact: ['no-troupe-contact'],
  'nen-contact': ['zetsu', 'no-troupe-contact'],
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
export function createJudgmentSeal(fighter: ArcadeFighter, owner: FightSide): JudgmentSeal {
  const clauses = fighter.judgmentDeclaration?.clauses ?? selectedJudgmentClauses(fighter)
  return clauses.length === 1
    ? { owner, rule: clauses[0] }
    : { owner, rule: clauses[0], clauses: [...clauses] }
}
