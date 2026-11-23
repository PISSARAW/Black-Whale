import type { AttackKind, FightInput, MoveAction } from '$lib/fighting/types'

/**
 * 8-button keyboard layout:
 * P1: ZQSD (or WASD; Arrows in solo play) + Shift (Guard), Space (Aura), J (Light), K (Heavy),
 *     L (Hatsu), U (Kameo), O (Burst), H (Context).
 * P2: Arrows + Enter (Guard), V (Aura), N (Light), M (Heavy),
 *     , (Hatsu), . (Kameo), / (Burst), B (Context).
 */
export const movementKeys: Record<string, keyof FightInput> = {
  u: 'kameo',
  o: 'burst',
  h: 'context',
  r: 'en',
  f: 'shu',
  x: 'conceal',
  g: 'gyo',
  '1': 'focusHead',
  '2': 'focusTorso',
  '3': 'focusHands',
  '4': 'focusFeet',
  q: 'left',
  a: 'left',
  d: 'right',
  z: 'jump',
  w: 'jump',
  s: 'down',
  Shift: 'guard',
  ' ': 'aura',
}

/** Arrows belong to P2 locally and become optional P1 aliases only against the AI. */
export const soloMovementKeys: Record<string, keyof FightInput> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
  ArrowDown: 'down',
}

export function playerMovementKey(key: string, solo: boolean): keyof FightInput | undefined {
  const shared = movementKeys[key]
  if (shared || !solo) return shared
  return soloMovementKeys[key]
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
  '[': 'en',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
  ArrowDown: 'down',
  Enter: 'guard',
  v: 'aura',
}

export const opponentAttackKeys: Record<
  string,
  Extract<MoveAction, 'light' | 'heavy' | 'special'>
> = {
  n: 'light',
  m: 'heavy',
  ',': 'special',
}
