import type { AttackKind } from './types'

export interface ArenaTechnique {
  name: readonly [string, string]
  effect: readonly [string, string]
  /** Extra condition or limitation, visible before choosing a fighter. */
  condition: readonly [string, string]
  kind: AttackKind
  move?: string
  utility?: 'gum' | 'thread' | 'vacuum' | 'marks'
}

export const technique = (
  name: ArenaTechnique['name'],
  effect: ArenaTechnique['effect'],
  options: Pick<ArenaTechnique, 'condition'> &
    Partial<Pick<ArenaTechnique, 'kind' | 'move' | 'utility'>>,
): ArenaTechnique => ({ name, effect, kind: 'special', ...options })
