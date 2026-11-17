import type { StolenChainAbility } from './kurapika'
import { withLoanCarrier } from './dolphinBorrowing'
import { dolphinCanUse } from './kurapikaDolphin'
import { outsideDuelAbility } from './outsideDuelAbility'
import { canAct } from './fightActorState'
import { historicalHandsReady } from './historicalHands'
import { voiceTarget, voiceTargets, changeVoiceTarget, type VoiceTarget } from './blackVoiceTargets'
import { dolphinBody } from './dolphinBodies'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

const INJECTION_REACH = 6 // Duel contact distance, not a manga quantity.
export function dolphinCanLend(state: FightState, side: FightSide, target: VoiceTarget): boolean {
  if (!lenderReady(state, side) || !recipientReady(target)) return false
  if (sameBody(state, side, target)) return false
  if (!historicalHandsReady(state, side, ['right'])) return false
  const caster = state[side]
  return Math.hypot(target.x - caster.x, target.y - caster.y) <= INJECTION_REACH
}
function lenderReady(state: FightState, side: FightSide): boolean {
  const caster = state[side]
  const chain = caster.kurapika
  if (!chain) return false
  const held = chain.held
  return Boolean(
    held?.loaded &&
    !held.used &&
    !caster.dolphinLoan &&
    !chain.dolphinLoans?.length &&
    chain!.emperorTime &&
    canAct(caster) &&
    !caster.attack,
  )
}
function recipientReady(target: VoiceTarget): boolean {
  return Boolean(
    target.body && target.health > 0 && !target.body.dolphinLoan && !target.body.blocking,
  )
}
function sameBody(state: FightState, side: FightSide, target: VoiceTarget): boolean {
  return target.side === side && target.member === (state.teamMatch?.seats[side].active ?? 0)
}

export function performDolphinLoan(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const target = command.target && voiceTarget(state, command.target)
  if (!target || !dolphinCanLend(state, side, target)) return state
  const caster = state[side]
  const member = state.teamMatch?.seats[side].active ?? 0
  const held = caster.kurapika!.held!
  const next = changeVoiceTarget(state, target, {
    dolphinLoan: { lender: { owner: side, member }, held },
  })
  return {
    ...next,
    [side]: {
      ...next[side],
      kurapika: {
        ...caster.kurapika!,
        held: null,
        dolphinLoans: [{ owner: target.side!, member: target.member! }],
      },
    },
  }
}
export function dolphinLoanOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const body = state[side]
  if (body.dolphinLoan) return recipientOptions(state, side)
  if (!body.kurapika?.held?.loaded || body.kurapika.held.used) return []
  return voiceTargets(state)
    .filter(
      (target) =>
        target.body &&
        !(target.side === side && target.member === (state.teamMatch?.seats[side].active ?? 0)),
    )
    .map((target) => ({
      command: { action: 'dolphin-lend', target: target.id },
      labelFr: `Dolphin · Prêter à ${target.body!.id}`,
      labelEn: `Dolphin · Lend to ${target.body!.id}`,
      ready: dolphinCanLend(state, side, target),
      conditionFr:
        'Seringue au contact réel ; Dolphin chargé et inutilisé. Le prêt libère Steal Chain, sans lever le coût d’Emperor Time.',
      conditionEn:
        'Real syringe contact; equipped and unused Dolphin. Lending frees Steal Chain without ending Emperor Time’s cost.',
    }))
}

function recipientOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const body = state[side]
  const lender = dolphinBody(state, body.dolphinLoan!.lender)
  const held = body.dolphinLoan!.held
  const [labelFr, labelEn] = recipientUseLabels(held)
  return [
    {
      command: { action: 'dolphin-use' },
      labelFr,
      labelEn,
      ready: Boolean(lender?.kurapika?.emperorTime && recipientCanCommand(state, side)),
      conditionFr:
        'Ordre du destinataire ; aura du donneur, conditions et matériel du Hatsu conservés. Le prêteur paie Emperor Time.',
      conditionEn:
        'The recipient commands; donor aura, Hatsu conditions and real equipment remain required. The lender pays Emperor Time.',
    },
  ]
}

function recipientUseLabels(held: StolenChainAbility): [string, string] {
  if (held.returned) return ['Dolphin prêté · Fermer Dolphin', 'Loaned Dolphin · Dismiss Dolphin']
  return held.used
    ? ['Dolphin prêté · Terminer l’application', 'Loaned Dolphin · Finish the application']
    : ['Dolphin prêté · Utiliser le Hatsu chargé', 'Loaned Dolphin · Use the equipped Hatsu']
}

function recipientCanCommand(state: FightState, side: FightSide): boolean {
  const body = state[side]
  if (!canAct(body) || body.attack) return false
  const held = body.dolphinLoan!.held
  if (held.used) return true
  if (outsideDuelAbility(held.moveId)?.activation === 'post-mortem') return false
  let ready = false
  withLoanCarrier(state, { side, kurapikaCommand: true }, (prepared) => {
    ready = dolphinCanUse(prepared, side)
    return prepared
  })
  return ready
}
