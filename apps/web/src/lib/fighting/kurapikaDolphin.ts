import { hatsuFor } from './hatsu/registry'
import { canUseMovesetMove, moveById, movesetFor } from './movesets'
import type { StolenChainAbility } from './kurapika'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** One actual technique, not the victim's entire moveset. No prior witnessing condition. */
export function stealableChainMove(fighter: ArcadeFighter): string | null {
  if (fighter.stolenChainAbility || fighter.hatsuEffects.hatsuStolen > 0) return null
  const hatsu = hatsuFor(fighter.id)
  if (hatsu.stealableOutsideDuel) return hatsu.stealableOutsideDuel.id
  if (hatsu.martialOnly) return null
  return combatChainMove(fighter)
}

function combatChainMove(fighter: ArcadeFighter): string | null {
  const moves =
    movesetFor(fighter.id)?.moves.filter(
      (move) => move.category === 'special' && move.id !== 'biscuit:neutralSpecial',
    ) ?? []
  return moves.find((move) => move.id === fighter.attack?.moveId)?.id ?? moves[0]?.id ?? null
}

export function dolphinCanUse(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  const held = fighter.kurapika?.held
  const move = moveById(held?.moveId)
  if (!held?.loaded || held.used || !move) return false
  // Preserve the actual technique's conditions and cost at the borrower's attained state.
  const actor: ArcadeFighter = {
    ...fighter,
    id: held.source,
    nenOwner: fighter.nenOwner ?? fighter.id,
    stolenChainAbility: undefined,
  }
  return canUseMovesetMove({ ...state, [side]: actor }, side, move)
}

/** Run the borrowed Hatsu's own hooks with its execution identity, then restore the body. */
export function withDolphinIdentity(
  state: FightState,
  run: (state: FightState) => FightState,
  source?: ArcadeFighter['id'],
): FightState {
  const borrowed = (fighter: ArcadeFighter) => {
    const held = fighter.kurapika?.held
    return held?.used && (!source || held.source === source)
      ? { ...fighter, id: held.source, nenOwner: fighter.nenOwner ?? fighter.id }
      : fighter
  }
  const player = borrowed(state.player)
  const opponent = borrowed(state.opponent)
  if (player === state.player && opponent === state.opponent) return run(state)
  const next = run({ ...state, player, opponent })
  return {
    ...next,
    player: { ...next.player, id: state.player.id, nenOwner: state.player.nenOwner },
    opponent: { ...next.opponent, id: state.opponent.id, nenOwner: state.opponent.nenOwner },
  }
}

/** Track effects created by this use, so Dolphin cannot stop an unrelated Hatsu. */
export function recordDolphinEffects(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  const held = after[side].kurapika?.held
  if (!held?.used) return after
  const keys = new Set(held.sustainedKeys)
  for (const key of changedDolphinCounters(before, after)) keys.add(key)
  for (const key of dolphinEffectFlags(before, after, side)) keys.add(key)
  return {
    ...after,
    [side]: {
      ...after[side],
      kurapika: { ...after[side].kurapika!, held: { ...held, sustainedKeys: [...keys] } },
    },
  }
}

export function dolphinIsBusy(
  state: FightState,
  side: FightSide,
  held: StolenChainAbility,
): boolean {
  if (state[side].attack?.moveId === held.moveId) return true
  return held.sustainedKeys.some((entry) => {
    if (entry === 'secret-window') return Boolean(state[side].secretWindow)
    if (entry === 'poem') return Boolean(state[side].bashoPoem)
    if (entry === 'gum') return state.bungeeGum?.owner === side
    if (entry === 'projection') return Boolean(state[side].hanzoProjection)
    if (entry === 'texture') return Boolean(state[side].textureSurprise)
    if (entry === 'lsdf') return Boolean(state.lsdf?.[side])
    const [target, key] = entry.split(':') as [FightSide, keyof ArcadeFighter['hatsuEffects']]
    return Number(state[target].hatsuEffects[key]) > 0
  })
}

export function returnChainAbility(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const held = fighter.kurapika?.held
  if (!held) return state
  return {
    ...state,
    [side]: { ...fighter, kurapika: { ...fighter.kurapika!, held: null } },
    [held.victim]: { ...state[held.victim], stolenChainAbility: undefined },
  }
}

/** Gum may be detached voluntarily; a curse or timed effect must run its course. */
export function dismissDolphinGum(state: FightState, side: FightSide): FightState {
  return state.bungeeGum?.owner === side ? { ...state, bungeeGum: null } : state
}

function changedDolphinCounters(before: FightState, after: FightState): string[] {
  const keys = new Set<string>()
  for (const target of ['player', 'opponent'] as const) {
    const old = before[target].hatsuEffects
    const next = after[target].hatsuEffects
    for (const key of Object.keys(next) as (keyof typeof next)[])
      if (typeof next[key] === 'number' && Number(next[key]) > Number(old[key]))
        keys.add(`${target}:${key}`)
  }
  return [...keys]
}

function dolphinEffectFlags(before: FightState, after: FightState, side: FightSide): string[] {
  const keys = new Set<string>()
  if (after.bungeeGum?.owner === side && before.bungeeGum !== after.bungeeGum) keys.add('gum')
  if (after[side].bashoPoem) keys.add('poem')
  if (after[side].hanzoProjection) keys.add('projection')
  if (after[side].secretWindow) keys.add('secret-window')
  if (after[side].textureSurprise) keys.add('texture')
  if (after.lsdf?.[side]) keys.add('lsdf')
  return [...keys]
}
