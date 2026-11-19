import { canAct } from './fightActorState'
import { startFighterAttack } from './fighterAttacks'
import { hatsuFor } from './hatsu/registry'
import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import { moveById } from './movesets'
import { readyCohort } from './preparationWorld'
import { COHORT_WILL_FRAMES } from './preparationTuning'
import { halkenburgMode } from './halkenburgSoulTypes'
import { futureAcceptsMove } from './parallelFutureAbility'
import { judgmentForbidsNen } from './judgmentRules'
import { chainRuleDeath } from './kurapikaActions'
import { traceArsenal } from './arsenalTrace'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** His own bow follows Halkenburg's mind. This never unlocks another body's personal Hatsu. */
export function retainedSoulBowReady(actor: ArcadeFighter): boolean {
  return (
    Boolean(actor.halkForeignMind && actor.halkSoul?.mind?.identity === 'halkenburg') &&
    !actor.halkSoulSleep &&
    voluntaryNenAvailable(actor, { requireHatsu: false }) &&
    !chainAbilitySealed(actor, 'halkenburg:neutralSpecial')
  )
}
export function performSoulBow({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side],
    move = moveById('halkenburg:neutralSpecial')!
  if (!bowCommandReady({ state, side, command }) || !bowResourcesReady(state, side)) return state
  if (judgmentForbidsNen(actor)) return chainRuleDeath(state, side)
  const fighter = startFighterAttack({
    fighter: { ...actor, halkSoulLowShot: command.target === 'low' },
    kind: 'special',
    auraCharged: false,
    concealed: false,
    moveId: move.id,
    hatsuSource: 'halkenburg',
    auraCost: move.auraCost,
  })
  return hatsuFor('halkenburg').onTrigger({
    state: { ...state, [side]: fighter },
    side,
    source: 'halkenburg',
  })
}
function bowCommandReady({ state, side, command }: ArsenalInvocation): boolean {
  if (command.action !== 'halkenburg-arrow' || state.phase !== 'fighting' || state.catsName)
    return false
  if (command.target !== undefined && command.target !== 'low') return false
  if (!futureAcceptsMove(state, side)) return false
  return (
    personalSoulBowReady(state[side]) &&
    canAct(state[side]) &&
    !state[side].attack &&
    halkenburgMode(state, side) === 'souls'
  )
}
export function soulBowAiAction(state: FightState): FightState | null {
  const side = 'opponent',
    command = {
      action: 'halkenburg-arrow' as const,
      ...(state.player.halkSoulSleep ? { target: 'low' } : {}),
    }
  const next = performSoulBow({ state, side, command })
  return next === state ? null : traceArsenal({ state, side, command }, next)
}
function bowResourcesReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    actor.aura >= moveById('halkenburg:neutralSpecial')!.auraCost &&
    actor.hatsuEffects.cohortWillFrames >= COHORT_WILL_FRAMES &&
    readyCohort(state, side).length > 0
  )
}
export function soulBowOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (halkenburgMode(state, side) !== 'souls' || !ownsPersonalSoulBow(state[side])) return []
  return [undefined, 'low'].map((target) => soulBowOption(state, side, target))
}
function ownsPersonalSoulBow(actor: ArcadeFighter): boolean {
  return (
    actor.halkSoul?.mind?.identity === 'halkenburg' ||
    (actor.id === 'halkenburg' && !actor.halkCohortBody && !actor.nenOwner)
  )
}
function personalSoulBowReady(actor: ArcadeFighter): boolean {
  return (
    retainedSoulBowReady(actor) ||
    (ownsPersonalSoulBow(actor) &&
      !actor.halkForeignMind &&
      voluntaryNenAvailable(actor, { requireReserve: true }) &&
      !chainAbilitySealed(actor, 'halkenburg:neutralSpecial'))
  )
}
function soulBowOption(
  state: FightState,
  side: FightSide,
  target: string | undefined,
): ArsenalOption {
  const command = { action: 'halkenburg-arrow' as const, ...(target ? { target } : {}) }
  return {
    command,
    ready: performSoulBow({ state, side, command }) !== state,
    labelFr: target ? 'Halkenburg · Flèche basse' : 'Halkenburg · Arc de sa conscience',
    labelEn: target ? 'Halkenburg · Low arrow' : 'Halkenburg · His mind’s bow',
    conditionFr:
      'Son propre arc suit sa conscience. Même coût d’aura, volonté commune, groupe présent et consentant, préparation vulnérable et vraie flèche. Le tir bas vise un corps couché sans homing. Aucun Hatsu du corps occupé n’est acquis.',
    conditionEn:
      'His own bow follows his mind. Same aura cost, shared will, present consenting cohort, vulnerable startup and real arrow. Low aim can hit a lying body without homing. No host Hatsu is acquired.',
  }
}
