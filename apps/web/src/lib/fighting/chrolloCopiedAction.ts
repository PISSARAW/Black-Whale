import { chainAbilityGroup } from './chainAbilityGroup'
import { chrolloHasActivePage } from './chrolloBook'
import { chrolloCopiedMove, chrolloRawPageForMove, chrolloPageSource } from './chrolloBook'
import { canAct } from './fightActorState'
import { moveById } from './movesets'
import { performCookie } from './cookie'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** A page carries its actual technique. It never transfers a body or inventory. */
export function performChrolloCopiedAction(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const { state, side } = options
  const owner = state[side]
  if (owner.id !== 'chrollo' || options.kind !== 'special') return null
  const page = chrolloRawPageForMove(owner, options.moveId)
  if (!page?.includes(':')) return null // Legacy pages keep their existing adapters.
  return castCopiedAction(options, perform)
}

function castCopiedAction(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
  selectedMove?: string,
): FightState {
  const { state, side } = options
  const owner = state[side]
  const page = chrolloRawPageForMove(owner, options.moveId)!
  const moveId = selectedMove ?? chrolloCopiedMove(owner, options.moveId)
  const source = chrolloPageSource(page)
  if (!moveId || !source || !copiedBodyFree(owner)) return state
  if (moveId === 'biscuit:cookie') return performCookie(state, side, { action: 'cookie-massage' })
  const move = copiedCombatMove(moveId)
  if (!move) return state
  if (!copiedHandsAvailable(owner, source)) return state
  const actor = { ...owner, id: source, nenOwner: copiedNenOwner(owner) }
  const prepared = { ...state, [side]: actor }
  const cast = perform({
    ...options,
    state: prepared,
    moveId,
    kind: move.kind,
    variant: move.variant,
  })
  if (cast === prepared) return state
  return {
    ...cast,
    [side]: {
      ...cast[side],
      id: owner.id,
      nenOwner: owner.nenOwner,
      attack: cast[side].attack ? { ...cast[side].attack!, copiedPage: page } : null,
    },
  }
}

export function copiedHandsAvailable(
  fighter: import('./types').ArcadeFighter,
  source: string,
): boolean {
  return (
    !['kurapika', 'padaille', 'melody', 'phinks', 'basho'].includes(source) ||
    fighter.chrolloBook?.open === false
  )
}

function copiedNenOwner(fighter: import('./types').ArcadeFighter) {
  return fighter.nenOwner ?? fighter.id
}

/** Execute another application of the same retained Hatsu, through its native handler. */
export function performChrolloSelectedMove(
  options: {
    state: FightState
    side: import('./types').FightSide
    moveId: string
  },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, moveId } = options
  const fighter = state[side]
  if (fighter.id !== 'chrollo') return state
  const page = fighter.chrolloBook?.pages.find(
    (entry) =>
      entry.includes(':') &&
      chainAbilityGroup(entry) === chainAbilityGroup(moveId) &&
      chrolloHasActivePage(fighter, entry),
  )
  if (!page) return state
  const command =
    fighter.chrolloBook?.open && fighter.chrolloBook.pages[fighter.chrolloBook.page] === page
      ? 'chrollo:neutralSpecial'
      : 'chrollo:finisher'
  return castCopiedAction(
    { state, side, moveId: command, kind: 'special', auraCharged: false },
    perform,
    moveId,
  )
}

function copiedBodyFree(fighter: import('./types').ArcadeFighter): boolean {
  return canAct(fighter) && !fighter.attack
}
function copiedCombatMove(id: string) {
  const move = moveById(id)
  return move && ['special', 'finisher'].includes(move.category) ? move : null
}
