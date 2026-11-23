import type { AttackKind, FightInput, MoveAction } from '$lib/fighting/types'

/**
 * 8-button keyboard layout:
 * P1: ZQSD (or WASD/Arrows) + Shift (Guard), Space (Aura), J (Light), K (Heavy),
 *     L (Hatsu), U (Kameo), O (Burst), H (Context).
 * P2: Arrows + Enter (Guard), Alt (Aura), N (Light), M (Heavy),
 *     , (Hatsu), . (Kameo), / (Burst), B (Context).
 */
export const movementKeys: Record<string, keyof FightInput> = {
  u: 'kameo',
  o: 'burst',
  h: 'context',
  ArrowLeft: 'left',
  q: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
  ArrowUp: 'jump',
  z: 'jump',
  w: 'jump',
  ArrowDown: 'down',
  s: 'down',
  Shift: 'guard',
  ' ': 'aura',
}

export const attackKeys: Record<string, Extract<AttackKind, 'light' | 'heavy' | 'special'>> = {
  j: 'light',
  k: 'heavy',
  l: 'special',
}

export const opponentMovementKeys: Record<string, keyof FightInput> = {
  '.': 'kameo',
  '/': 'burst',
  b: 'context',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
  ArrowDown: 'down',
  Enter: 'guard',
  Alt: 'aura',
}

export const opponentAttackKeys: Record<string, Extract<MoveAction, 'light' | 'heavy' | 'special'>> = {
  n: 'light',
  m: 'heavy',
  ',': 'special',
}
