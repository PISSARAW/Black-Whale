import { CALM_FAMILIES } from './catalogueCalm'
import { COMBAT_FAMILIES } from './catalogueCombat'
import { GESTURE_FAMILIES } from './catalogueGestures'
import { SOCIAL_FAMILIES } from './catalogueSocial'
import { compileExpressionFamily } from './catalogueBuilder'

export const EXPRESSION_FAMILIES = [
  ...CALM_FAMILIES,
  ...COMBAT_FAMILIES,
  ...SOCIAL_FAMILIES,
  ...GESTURE_FAMILIES,
]
export const EXPRESSION_CATALOGUE = EXPRESSION_FAMILIES.flatMap(compileExpressionFamily)
const BY_ID = new Map(EXPRESSION_CATALOGUE.map((entry) => [entry.id, entry]))
export const expressionDefinition = (id: string) => BY_ID.get(id)
