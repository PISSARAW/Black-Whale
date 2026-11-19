import { endDolphinEffect } from './kurapikaActions'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import {
  drawRosterBody,
  guestProjection,
  mergeGuestProjection,
  storeRosterGuest,
  type RosterGuest,
} from './rosterGuests'
import { createKurapika } from './kurapika'
import { stolenAuraActor, restoreStolenAura } from './dolphinSupply'
import { syncRosterDolphinSupply } from './dolphinRosterSupply'
import {
  recordDolphinEffects,
  dolphinIsBusy,
  returnChainAbility,
  withDolphinIdentity,
} from './kurapikaDolphin'
import { moveById } from './movesets'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'
import type { DuelAttack } from './duelStep/types'
import type { FighterHatsu } from './hatsu/contract'

declare module './types' {
  interface ArcadeFighter {
    dolphinLoanResult?: 'cast' | 'conditions-unmet'
  }
}

export function performDolphinLoan({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side],
    held = actor.kurapika?.held
  if (command.action !== 'dolphin-loan' || !loanLoaded(state, side)) return state
  if (!loanBodyReady(state, side) || !loanSlotFree(state, side)) return state
  const draw = drawRosterBody(state, side)
  const id = `dolphin:${side}:${state.frame}`
  const enemy = state[side === 'player' ? 'opponent' : 'player']
  const fighter = {
    ...draw.fighter,
    x: Math.max(7, Math.min(93, enemy.x - actor.facing * 7)),
    supportConsent: true,
    kurapika: { ...createKurapika(), held: { ...held!, used: true, lentTo: undefined } },
  }
  const guest: RosterGuest = {
    id,
    owner: side,
    role: 'loan',
    phase: 'acting',
    fighter,
    frames: 0,
    cooldown: 0,
    loanSource: held!.source,
    loanMove: held!.moveId,
  }
  return {
    ...draw.state,
    rosterGuests: [...(state.rosterGuests ?? []), guest],
    [side]: {
      ...actor,
      aura: actor.aura - 10,
      dolphinLoanResult: undefined,
      kurapika: { ...actor.kurapika!, held: { ...held!, used: true, lentTo: id } },
    },
  }
}

function loanLoaded(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    held = actor.kurapika?.held
  return (
    actor.id === 'kurapika' &&
    Boolean(
      held?.loaded && !held.used && !held.lentTo && held.auraSupply && held.auraSupply.amount > 0,
    )
  )
}
function loanBodyReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canAct(actor) &&
    !actor.attack &&
    voluntaryNenAvailable(actor) &&
    Boolean(actor.kurapika?.emperorTime)
  )
}
function loanSlotFree(state: FightState, side: FightSide): boolean {
  return (
    state[side].aura >= 10 &&
    !state.rosterGuests?.some((guest) => guest.owner === side && guest.phase !== 'eliminated')
  )
}

export function advanceLoanGuest(
  state: FightState,
  guest: RosterGuest,
  attack: DuelAttack,
): FightState {
  if (!guest.used) return launchLoan(state, guest, attack)
  if (guest.fighter.attack || state.projectiles.some((shot) => shot.sourceBody === guest.id))
    return state
  const held = guest.fighter.kurapika?.held
  if (held && dolphinIsBusy(guestProjection(state, guest), guest.owner, held))
    return endLoanApplication(state, guest, attack)
  return finishLoan(state, guest, true)
}

function endLoanApplication(state: FightState, guest: RosterGuest, attack: DuelAttack): FightState {
  const view = guestProjection(state, guest)
  const ended = endDolphinEffect(
    {
      state: view,
      side: guest.owner,
      kind: 'special',
      moveId: 'kurapika:backSpecial',
      auraCharged: false,
    },
    attack,
  )
  return mergeGuestProjection(state, ended, guest)
}

function launchLoan(state: FightState, guest: RosterGuest, attack: DuelAttack): FightState {
  const view = guestProjection(state, guest)
  const body = guest.fighter
  const move = moveById(guest.loanMove)
  if (!move) return finishLoan(state, guest, false)
  const proxy = {
    ...view,
    [guest.owner]: stolenAuraActor({
      ...body,
      id: guest.loanSource!,
      nenOwner: body.id,
    }),
  }
  const cast = attack({
    state: proxy,
    side: guest.owner,
    kind: move?.kind ?? 'special',
    variant: move?.variant,
    moveId: guest.loanMove,
    auraCharged: false,
  })
  if (cast === proxy || cast[guest.owner] === proxy[guest.owner])
    return finishLoan(state, guest, false)
  const recorded = recordDolphinEffects(view, cast, guest.owner)
  const restored = {
    ...recorded,
    [guest.owner]: {
      ...restoreStolenAura(body, recorded[guest.owner]),
      id: body.id,
      nenOwner: body.nenOwner,
    },
  }
  const merged = mergeGuestProjection(state, restored, guest)
  const updated = merged.rosterGuests!.find((held) => held.id === guest.id)!
  const projectiles = merged.projectiles.map((shot) =>
    shot.id >= state.nextProjectileId ? { ...shot, sourceBody: guest.id } : shot,
  )
  return syncRosterDolphinSupply(
    storeRosterGuest(
      {
        ...merged,
        projectiles,
        [guest.owner]: { ...merged[guest.owner], dolphinLoanResult: 'cast' },
      },
      { ...updated, used: true },
    ),
    guest,
  )
}

function finishLoan(state: FightState, guest: RosterGuest, success: boolean): FightState {
  const side = guest.owner,
    actor = state[side],
    held = actor.kurapika?.held
  let next = storeRosterGuest(state, {
    ...guest,
    phase: 'leaving',
    fighter: { ...guest.fighter, kurapika: undefined },
  })
  if (!held || held.lentTo !== guest.id) return next
  next = {
    ...next,
    [side]: {
      ...actor,
      dolphinLoanResult: success ? 'cast' : 'conditions-unmet',
      kurapika: { ...actor.kurapika!, held: { ...held, lentTo: undefined, used: success } },
    },
  }
  return success ? returnChainAbility(next, side) : next
}

export function cancelLoanGuest(
  state: FightState,
  guest: RosterGuest,
  attack: DuelAttack,
): FightState {
  if (guest.role !== 'loan' || !guest.fighter.kurapika?.held) return state
  const ended = endLoanApplication(state, guest, attack)
  const current = ended.rosterGuests!.find((entry) => entry.id === guest.id)!
  return finishLoan(ended, current, Boolean(guest.used))
}

/** One source hook runs once, with the real borrower in the owner's projected seat. */
export function runRosterHatsu(state: FightState, hatsu: FighterHatsu): FightState {
  const guest = state.rosterGuests?.find(
    (entry) =>
      entry.role === 'loan' &&
      entry.used &&
      entry.loanSource === hatsu.id &&
      entry.phase === 'acting',
  )
  if (!guest) return withDolphinIdentity(state, hatsu.onFrame, hatsu.id)
  const view = guestProjection(state, guest)
  const run = withDolphinIdentity(view, hatsu.onFrame, hatsu.id)
  return syncRosterDolphinSupply(mergeGuestProjection(state, run, guest), guest)
}

export function dolphinLoanOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'kurapika' || !state[side].kurapika?.held?.loaded) return []
  const command = { action: 'dolphin-loan' as const }
  return [
    {
      command,
      ready: performDolphinLoan({ state, side, command }) !== state,
      labelFr: 'Dolphin · Prêter à un tiers du roster',
      labelEn: 'Dolphin · Lend to a roster ally',
      conditionFr:
        'Adaptation de scénario : un volontaire du roster apparaît pour un usage de la technique chargée. Il utilise l’aura prélevée au donneur et respecte les conditions, son corps et le matériel du Hatsu. Kurapika maintient Emperor Time jusqu’à la fin de l’usage.',
      conditionEn:
        'Scenario adaptation: a roster volunteer appears for one use of the loaded ability. It spends the stolen donor aura and must satisfy the Hatsu’s conditions with its own body and real equipment. Kurapika maintains Emperor Time until completion.',
    },
  ]
}
