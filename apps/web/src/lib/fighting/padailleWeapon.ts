import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import type { ArcadeFighter, FightSide, FightState } from './types'

export type PadailleTool = 'hammer' | 'drill' | 'axe'
export const PADAILLE_RELEASE = 'padaille:backSpecial'
export const PADAILLE_TOOLS: Readonly<Record<string, PadailleTool>> = {
  'padaille:neutralSpecial': 'hammer',
  'padaille:forwardSpecial': 'drill',
  'padaille:downSpecial': 'axe',
}

export function padailleIntent(fighter: ArcadeFighter, moveId?: string): boolean {
  return fighter.id === 'padaille' || chrolloPageForMove(fighter, moveId) === 'padaille'
}

export function padailleNenActive(fighter: ArcadeFighter): boolean {
  return (
    voluntaryNenAvailable(fighter) && !fighter.stolenChainAbility && ownsPadailleWeapon(fighter)
  )
}

function ownsPadailleWeapon(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'chrollo')
    return chrolloHasActivePage(fighter, 'padaille') && !fighter.chrolloBook?.open
  const held = fighter.kurapika?.held
  return fighter.id === 'padaille' || Boolean(held?.used && held.source === 'padaille')
}

/** Three demonstrated tools, selected directly. No roulette or global damage multiplier. */
export function padailleMoveAvailable(fighter: ArcadeFighter, moveId?: string): boolean {
  if (!padailleIntent(fighter, moveId)) return true
  if (!padailleNenActive(fighter)) return false
  if (fighter.id !== 'padaille') return true
  const selected = moveId ?? 'padaille:neutralSpecial'
  if (selected === PADAILLE_RELEASE) return Boolean(fighter.padailleTool)
  return selected in PADAILLE_TOOLS
}

/** Applied only when the actual attack starts, never while its input is buffered. */
export function startPadailleTool(state: FightState, side: FightSide, moveId?: string): FightState {
  const fighter = state[side]
  const padailleTool =
    moveId === PADAILLE_RELEASE ? undefined : (PADAILLE_TOOLS[moveId ?? ''] ?? 'hammer')
  return { ...state, [side]: { ...fighter, padailleTool } }
}

export function advancePadailleWeapon(state: FightState): FightState {
  const clean = (fighter: ArcadeFighter): ArcadeFighter =>
    fighter.padailleTool && !padailleNenActive(fighter)
      ? { ...fighter, padailleTool: undefined }
      : fighter
  return { ...state, player: clean(state.player), opponent: clean(state.opponent) }
}

export function padailleUtilityAttack(fighter: ArcadeFighter): boolean {
  return fighter.attack?.moveId === PADAILLE_RELEASE
}

export function releasePadailleWeapon(state: FightState, side: FightSide): FightState | null {
  return state[side].padailleTool
    ? { ...state, [side]: { ...state[side], padailleTool: undefined } }
    : null
}
