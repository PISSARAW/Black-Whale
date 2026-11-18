import { judgmentClauses, selectedJudgmentClauses } from './judgmentRules'
import type { JudgmentClause } from './judgmentRules'
import type { ArcadeFighter } from './types'

const LABELS: Record<JudgmentClause, [string, string]> = {
  'truthful-answers': ['Réponses sincères obligatoires', 'Truthful answers required'],
  zetsu: ['Nen interdit', 'Nen prohibited'],
  'no-troupe-contact': [
    'Communication avec la Brigade interdite',
    'Troupe communication prohibited',
  ],
}
export function judgmentClauseLabel(
  clauses: readonly JudgmentClause[],
  language: 'fr' | 'en',
): string {
  return clauses.map((clause) => LABELS[clause][language === 'fr' ? 0 : 1]).join(' + ')
}
export function implantedJudgmentLabel(fighter: ArcadeFighter, language: 'fr' | 'en'): string {
  return judgmentClauseLabel(judgmentClauses(fighter), language)
}
export function preparedJudgmentLabel(fighter: ArcadeFighter, language: 'fr' | 'en'): string {
  return judgmentClauseLabel(selectedJudgmentClauses(fighter), language)
}
