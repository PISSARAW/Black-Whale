import { littleEyeShotBusy } from './littleEyeCapture'
import { paperDolls } from './kallutoSurveillance'
import { paperControlBusy } from './kallutoScatter'
import { chainAbilityGroup } from './chainAbilityGroup'
import {
  equippedDolphin,
  loanCarrier,
  restoreLoanCarrier,
  reconcileLoanLinks,
} from './dolphinBorrowing'
import { restoreDolphinDonor } from './dolphinReturn'
import { stolenAuraActor, restoreStolenAura } from './dolphinSupply'
import { borrowedGumSupport, clearBorrowedGumSupport } from './hisokaSupportOrigin'
import { borrowedPaperTextureBusy } from './paperTexture'
import { gumObjectAnchors } from './gumObjectAnchors'
import { gumSourceBusy, clearGumSource } from './bungeeScoped'
import { cookieCanStart } from './cookie'
import { luiniAnchor } from './luiniSpatial'
import { doorNetworkBusy } from './voconteDoorState'
import { ownsNeedlePuppet } from './illumiFrame'
import { borrowedIllumiFaceBusy } from './illumiDisguiseClock'
import { borrowedNeedleFaceBusy } from './illumiNeedleFaceClock'
import { machiThreadForOwner } from './machiThread'
import { outsideDuelAbility } from './outsideDuelAbility'
import { preparedActionReady, controlledEntities } from './preparationActions'
import { hatsuFor } from './hatsu/registry'
import { cyclotronBusy } from './phinksCyclotron'
import { canUseMovesetMove, moveById, movesetFor } from './movesets'
import type { StolenChainAbility } from './kurapika'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** One actual technique, not the victim's entire moveset. No prior witnessing condition. */
export function stealableChainMove(
  fighter: ArcadeFighter,
  activeMoveId = fighter.attack?.moveId,
): string | null {
  if (fighter.stolenChainAbility || fighter.hatsuEffects.hatsuStolen > 0) return null
  const hatsu = hatsuFor(fighter.id)
  if (hatsu.stealableOutsideDuel) return hatsu.stealableOutsideDuel.id
  if (hatsu.martialOnly) return null
  return combatChainMove(fighter, activeMoveId)
}

function combatChainMove(fighter: ArcadeFighter, activeMoveId?: string): string | null {
  const moves =
    movesetFor(fighter.id)?.moves.filter(
      (move) => move.category === 'special' && move.id !== 'biscuit:neutralSpecial',
    ) ?? []
  return moves.find((move) => move.id === activeMoveId)?.id ?? moves[0]?.id ?? null
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
    return held?.used && !held.returned && (!source || held.source === source)
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
  const prepared = { ...state, player, opponent }
  let next = run(prepared)
  if (player !== state.player) next = recordDolphinFlags(prepared, next, 'player')
  if (opponent !== state.opponent) next = recordDolphinFlags(prepared, next, 'opponent')
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
  const held = equippedDolphin(after[side])
  if (!held?.used || held.returned || !dolphinEffectScope(after[side], held)) return after
  const keys = new Set(held.sustainedKeys)
  if (controlledEntities(after, side).length || littleEyeShotBusy(after, side)) keys.add('prepared')
  for (const key of changedDolphinCounters(before, after)) keys.add(key)
  for (const key of dolphinEffectFlags(before, after, side)) keys.add(key)
  return writeDolphinKeys(after, side, [...keys])
}
function recordDolphinFlags(before: FightState, after: FightState, side: FightSide): FightState {
  const held = equippedDolphin(after[side])
  if (!held?.used || held.returned || !dolphinEffectScope(after[side], held)) return after
  const flags = dolphinEffectFlags(before, after, side)
  return flags.length
    ? writeDolphinKeys(after, side, [...new Set([...held.sustainedKeys, ...flags])])
    : after
}
function dolphinEffectScope(actor: ArcadeFighter, held: StolenChainAbility): boolean {
  const attack = actor.attack
  return (
    !attack?.hatsuSource ||
    chainAbilityGroup(attack.moveId ?? `${attack.hatsuSource}:neutralSpecial`) ===
      chainAbilityGroup(held.moveId)
  )
}
function writeDolphinKeys(state: FightState, side: FightSide, sustainedKeys: string[]): FightState {
  const actor = state[side]
  const held = { ...equippedDolphin(actor)!, sustainedKeys }
  return actor.dolphinLoan && !actor.dolphinLoanChannel
    ? { ...state, [side]: { ...actor, dolphinLoan: { ...actor.dolphinLoan, held } } }
    : { ...state, [side]: { ...actor, kurapika: { ...actor.kurapika!, held } } }
}

export function dolphinIsBusy(
  state: FightState,
  side: FightSide,
  held: StolenChainAbility,
): boolean {
  if (held.returned) return false
  if (
    held.lentTo &&
    state.rosterGuests?.some((guest) => guest.id === held.lentTo && guest.phase === 'acting')
  )
    return true
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
  return restoreDolphinDonor(restored, held)
}

/** Gum may be detached voluntarily; a curse or timed effect must run its course. */
export function dismissDolphinGum(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  const held = equippedDolphin(actor)
  const anchors = gumObjectAnchors(actor).filter(
    (anchor) => anchor.source !== 'dolphin' || anchor.theftId !== held?.theftId,
  )
  const cleared = clearBorrowedGumSupport(actor)
  const next =
    anchors.length === gumObjectAnchors(actor).length
      ? { ...state, [side]: cleared }
      : {
          ...state,
          [side]: { ...cleared, gumObjectAnchors: anchors.length ? anchors : undefined },
        }
  return clearGumSource(next, side, { source: 'dolphin', theftId: held?.theftId })
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
  const previous = dolphinFlags(before, side)
  const next = dolphinFlags(after, side)
  return Object.keys(next).filter((key) => next[key] && !previous[key])
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
    'gum-support': gumUseBusy(fighter) || borrowedGumNetworkBusy(state, side),
    cookie: Boolean(fighter.cookie),
    'biohazard-device': Boolean(
      state.battlefield?.entities.some(
        (entry) => entry.device?.form?.owner === side || entry.device?.transforming?.owner === side,
      ),
    ),
    prepared: preparedEffectBusy(state, side),
    'luini-anchor': Boolean(luiniAnchor(state, side)),
    'cross-game': state[side === 'player' ? 'opponent' : 'player'].crossGame?.owner === side,
    'padaille-weapon': Boolean(fighter.padailleTool),
    predator: predatorBusy(fighter),
    'needle-puppet': ownsNeedlePuppet(state, side),
    'illumi-face': borrowedIllumiFaceBusy(fighter),
    'needle-face': borrowedNeedleFaceBusy(state, side),
    'secret-window': secretWindowBusy(fighter),
    'paper-doll': paperDolls(fighter).some((doll) => doll.active !== false),
    'paper-control': paperControlBusy(state, side),
    'paper-stream': state.projectiles.some(
      (shot) => shot.owner === side && Boolean(shot.kallutoPaper),
    ),
    cyclotron: cyclotronBusy(fighter),
    door: doorNetworkBusy(state, side),
    'bloody-mary': Boolean(fighter.bloodyMary?.tendril || fighter.bloodyMary?.drops.length),
    'body-and-soul': Boolean(fighter.lynchQuestion),
    poem: poemUseBusy(state, side),
    gum: borrowedGumNetworkBusy(state, side),
    projection: Boolean(fighter.hanzoProjection),
    texture: textureUseBusy(state, side),
    lsdf: Boolean(state.lsdf?.[side]),
  }
}

function textureUseBusy(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return (
    borrowedPaperTextureBusy(state, side) ||
    Boolean(fighter.textureSurprise && borrowedGumSupport(fighter, fighter.textureSurprise))
  )
}

function gumUseBusy(fighter: ArcadeFighter): boolean {
  if (fighter.gumProstheses && borrowedGumSupport(fighter, fighter.gumProstheses)) return true
  if (borrowedObjectAnchorBusy(fighter)) return true
  if (fighter.gumWoundSeals && borrowedGumSupport(fighter, fighter.gumWoundOrigin)) return true
  return borrowedCatchBusy(fighter)
}

function borrowedCatchBusy(fighter: ArcadeFighter): boolean {
  return (
    borrowedGumSupport(fighter, fighter.gumCatch) &&
    !fighter.gumCatch?.released &&
    Boolean(fighter.gumCatch?.frames || fighter.gumCatch?.projectile)
  )
}
function borrowedGumNetworkBusy(state: FightState, side: FightSide): boolean {
  return gumSourceBusy(state, side, {
    source: 'dolphin',
    theftId: equippedDolphin(state[side])?.theftId,
  })
}
function borrowedObjectAnchorBusy(fighter: ArcadeFighter): boolean {
  const held = equippedDolphin(fighter)
  return gumObjectAnchors(fighter).some(
    (anchor) => anchor.source === 'dolphin' && anchor.theftId === held?.theftId,
  )
}

function secretWindowBusy(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.secretWindow || fighter.secretWindowListening)
}

function poemUseBusy(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  const loan = actor.dolphinLoan?.held.source === 'basho'
  const papers = [actor.bashoPoem, ...(actor.bashoArchive ?? [])]
  return (
    papers.some((poem) => poem && (poem.ready || poem.writingFrames > 0) && (!loan || poem.loan)) ||
    (['player', 'opponent'] as const).some((target) => {
      const ward = state[target].bashoWard
      return Boolean(
        ward && ward.owner === side && ward.remainingFrames > 0 && (!loan || ward.loan),
      )
    })
  )
}

function preparedEffectBusy(state: FightState, side: FightSide): boolean {
  return controlledEntities(state, side).length > 0 || littleEyeShotBusy(state, side)
}
