import type { AttackKind, FightInput, MoveAction } from '$lib/fighting/types'

/** Keyboard layout of the duel: P1 on letters, P2 on arrows in local versus. */
export const movementKeys: Record<string, keyof FightInput> = {
  r: 'en', f: 'shu', x: 'conceal', g: 'gyo',
  '1': 'focusHead', '2': 'focusTorso', '3': 'focusHands', '4': 'focusFeet',
  e: 'coverEars',
  t: 'call',
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
  i: 'guard',
  ' ': 'aura',
}

export const attackKeys: Record<string, AttackKind> = {
  j: 'light',
  k: 'heavy',
  u: 'ranged',
}

export const opponentMovementKeys: Record<string, keyof FightInput> = {
  '[': 'en', ']': 'shu', '\\': 'conceal', ';': 'gyo',
  '7': 'focusHead', '8': 'focusTorso', '9': 'focusHands', '0': 'focusFeet',
  c: 'coverEars',
  v: 'call',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
  ArrowDown: 'down',
  Enter: 'guard',
  Alt: 'aura',
}

export const opponentAttackKeys: Record<string, MoveAction | 'ranged'> = {
  n: 'light',
  m: 'heavy',
  ',': 'special',
  '.': 'ranged',
  '/': 'throw',
  b: 'finisher',
}
