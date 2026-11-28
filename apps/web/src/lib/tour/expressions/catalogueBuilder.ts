import { EXPRESSION_REST, type ExpressionDefinition, type ExpressionPose } from './types'

export interface ExpressionFamily {
  id: string
  label: string
  base: Partial<ExpressionPose>
  entries: readonly [label: string, intensity: number, variation?: Partial<ExpressionPose>][]
  rhythm?: ExpressionDefinition['rhythm']
  blink?: number
}
export function expressionSlug(label: string): string {
  return label
    .replaceAll('œ', 'oe')
    .replaceAll('Œ', 'OE')
    .replaceAll('æ', 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
export function compileExpressionFamily(family: ExpressionFamily): ExpressionDefinition[] {
  return family.entries.map(([label, intensity, variation]) => {
    const pose = { ...EXPRESSION_REST }
    for (const key of Object.keys(family.base) as (keyof ExpressionPose)[]) {
      const rest = EXPRESSION_REST[key]
      pose[key] = rest + (family.base[key]! - rest) * intensity
    }
    Object.assign(pose, variation)
    return {
      id: `${family.id}/${expressionSlug(label)}`,
      label,
      family: family.label,
      pose,
      rhythm: family.rhythm ?? 'still',
      blink: family.blink ?? 1,
    }
  })
}
