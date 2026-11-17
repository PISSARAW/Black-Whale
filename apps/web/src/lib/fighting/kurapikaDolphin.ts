import {
  equippedDolphin,
  loanCarrier,
  restoreLoanCarrier,
  reconcileLoanLinks,
} from './dolphinBorrowing'
import { changeDolphinBody } from './dolphinBodies'
import { stolenAuraActor, restoreStolenAura } from './dolphinSupply'
import { ownsBungeeGum } from './hisokaArsenal'
import { cookieCanStart } from './cookie'
import { luiniAnchor } from './luiniSpatial'
import { doorNetworkBusy } from './voconteDoorState'
import { ownsNeedlePuppet } from './illumiFrame'
import { machiThreadForOwner } from './machiThread'
import { outsideDuelAbility } from './outsideDuelAbility'
import { preparedActionReady, controlledEntities } from './preparationActions'
import { hatsuFor } from './hatsu/registry'
import { cyclotronBusy } from './phinksCyclotron'
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
  if (!held?.loaded || held.used) return false
  // Preserve the actual technique's conditions; its reserve and quality belong to the donor.
  const actor: ArcadeFighter = stolenAuraActor({
    ...fighter,
    id: held.source,
    nenOwner: fighter.nenOwner ?? fighter.id,
    stolenChainAbility: undefined,
  })
  const prepared = { ...state, [side]: actor }
  if (held.moveId === 'biscuit:cookie') return cookieCanStart(prepared, side, side)
  if (outsideDuelAbility(held.moveId)) return preparedActionReady(prepared, side, held.moveId)
  return Boolean(move && canUseMovesetMove(prepared, side, move))
}

/** Run the borrowed Hatsu's own hooks with its execution identity, then restore the body. */
export function withDolphinIdentity(
  state: FightState,
  run: (state: FightState) => FightState,
  source?: ArcadeFighter['id'],
): FightState {
  const borrowed = (fighter: ArcadeFighter) => {
    const held = equippedDolphin(fighter)
    return held?.used && (!source || held.source === source)
      ? stolenAuraActor({
          ...loanCarrier(fighter),
          id: held.source,
          nenOwner: fighter.nenOwner ?? fighter.id,
        })
      : fighter
  }
  const player = borrowed(state.player)
  const opponent = borrowed(state.opponent)
  if (player === state.player && opponent === state.opponent) return run(state)
  const next = run({ ...state, player, opponent })
  return reconcileLoanLinks({
    ...next,
    player: player === state.player ? next.player : restoreBorrowedBody(state.player, next.player),
    opponent:
      opponent === state.opponent
        ? next.opponent
        : restoreBorrowedBody(state.opponent, next.opponent),
  })
}
function restoreBorrowedBody(original: ArcadeFighter, after: ArcadeFighter): ArcadeFighter {
  return restoreLoanCarrier(original, {
    ...restoreStolenAura(original, after),
    id: original.id,
    nenOwner: original.nenOwner,
  })
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
  if (controlledEntities(after, side).length) keys.add('prepared')
  for (const key of changedDolphinCounters(before, after)) keys.add(key)
  for (const key of dolphinEffectFlags(before, after, side)) keys.add(key)
  return {
    ...after,
    [side]: {
      ...after[side],
      kurapika: {
        ...after[side].kurapika!,
        held: { ...held, sustainedKeys: [...keys] },
      },
    },
  }
}

export function dolphinIsBusy(
  state: FightState,
  side: FightSide,
  held: StolenChainAbility,
): boolean {
  if (machiThreadForOwner(state, side)) return true
  if (state[side].attack?.moveId === held.moveId) return true
  return held.sustainedKeys.some((entry) => dolphinEffectActive(state, side, entry))
}

export function returnChainAbility(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const held = fighter.kurapika?.held
  if (!held) return state
  const restored = {
    ...state,
    [side]: { ...fighter, kurapika: { ...fighter.kurapika!, held: null } },
  }
  const member = held.victimMember ?? state.teamMatch?.seats[held.victim].active ?? 0
  return changeDolphinBody(restored, { owner: held.victim, member }, (body) => ({
    ...body,
    stolenChainAbility: undefined,
  }))
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
      if (
        key !== 'witnessedAt' &&
        typeof next[key] === 'number' &&
        Number(next[key]) > Number(old[key])
      )
        keys.add(`${target}:${key}`)
  }
  return [...keys]
}

function dolphinEffectFlags(before: FightState, after: FightState, side: FightSide): string[] {
  const keys = new Set<string>()
  if (after.bungeeGum?.owner === side && before.bungeeGum !== after.bungeeGum) keys.add('gum')
  for (const [key, active] of Object.entries(dolphinFlags(after, side)))
    if (key !== 'gum' && active) keys.add(key)
  return [...keys]
}

function predatorBusy(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.predator?.watching || fighter.predator?.hunt)
}

function dolphinEffectActive(state: FightState, side: FightSide, entry: string): boolean {
  const flags = dolphinFlags(state, side)
  if (entry in flags) return flags[entry]
  const [target, key] = entry.split(':') as [FightSide, keyof ArcadeFighter['hatsuEffects']]
  return Number(state[target].hatsuEffects[key]) > 0
}

function dolphinFlags(state: FightState, side: FightSide): Record<string, boolean> {
  const fighter = state[side]
  return {
    'gum-support': gumUseBusy(fighter),
    cookie: Boolean(fighter.cookie),
    'biohazard-device': Boolean(
      state.battlefield?.entities.some(
        (entry) => entry.device?.form?.owner === side || entry.device?.transforming?.owner === side,
      ),
    ),
    prepared: controlledEntities(state, side).length > 0,
    'luini-anchor': Boolean(luiniAnchor(state, side)),
    'cross-game': state[side === 'player' ? 'opponent' : 'player'].crossGame?.owner === side,
    'padaille-weapon': Boolean(fighter.padailleTool),
    predator: predatorBusy(fighter),
    'needle-puppet': ownsNeedlePuppet(state, side),
    'secret-window': Boolean(fighter.secretWindow),
    'paper-doll': Boolean(fighter.kallutoPaper?.doll),
    'paper-stream': state.projectiles.some(
      (shot) => shot.owner === side && Boolean(shot.kallutoPaper),
    ),
    cyclotron: cyclotronBusy(fighter),
    door: doorNetworkBusy(state, side),
    'bloody-mary': Boolean(fighter.bloodyMary?.tendril || fighter.bloodyMary?.drops.length),
    'body-and-soul': Boolean(fighter.lynchQuestion),
    poem: poemUseBusy(state, side),
    gum: state.bungeeGum?.owner === side,
    projection: Boolean(fighter.hanzoProjection),
    texture: Boolean(fighter.textureSurprise),
    lsdf: Boolean(state.lsdf?.[side]),
  }
}

function gumUseBusy(fighter: ArcadeFighter): boolean {
  if (!ownsBungeeGum(fighter)) return false
  if (fighter.gumWoundSeals) return true
  return (
    !fighter.gumCatch?.released && Boolean(fighter.gumCatch?.frames || fighter.gumCatch?.projectile)
  )
}

function poemUseBusy(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  const loan = actor.dolphinLoan?.held.source === 'basho'
  const papers = [actor.bashoPoem, ...(actor.bashoArchive ?? [])]
  return (
    papers.some((poem) => poem && (!loan || poem.loan)) ||
    (['player', 'opponent'] as const).some((target) => {
      const ward = state[target].bashoWard
      return Boolean(
        ward && ward.owner === side && ward.remainingFrames > 0 && (!loan || ward.loan),
      )
    })
  )
}
