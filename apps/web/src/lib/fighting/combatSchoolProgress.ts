import { INPUT_BUFFER_FRAMES } from './fightClock'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import type { CombatRoute } from './combatRoutes'
import type { FightState } from './types'
import { routeStepHits, routeHitsBefore } from './combatRouteContacts'
import { attackPhase } from './frameData'
import { comboSupportLanded, waitingForComboSupport } from './kameos/comboLessons'

export type CombatCue =
  | 'ready'
  | 'wait'
  | 'volley'
  | 'cancel'
  | 'link-wait'
  | 'link'
  | 'late'
  | 'blocked'
  | 'wrong'
  | 'dropped'
  | 'complete'
  | 'guard'
  | 'defend-wait'
  | 'defense-late'
  | 'punish'
  | 'evade'
  | 'whiff-confirm'
  | 'support-wait'
export interface CombatProgress {
  id: string
  step: number
  lastImpact: number
  lastFrame: number
  lastContact: number
  cue: CombatCue
  failed: boolean
  complete: boolean
  demo: boolean
  stepHits: number
  supportLanded?: boolean
}
export function initialCombatProgress(id: string, demo: boolean, whiff = false): CombatProgress {
  return {
    id,
    step: 0,
    lastImpact: 0,
    lastFrame: 0,
    lastContact: 0,
    cue: whiff ? 'evade' : id.endsWith(':defense') ? 'guard' : 'ready',
    failed: false,
    complete: false,
    demo,
    stepHits: 0,
  }
}
function inactive(progress: CombatProgress, state: FightState): boolean {
  return state.frame <= progress.lastFrame || progress.failed || progress.complete
}
function rejectedContact(state: FightState): boolean {
  const impact = state.impact!
  return impact.attacker !== 'player' || impact.blocked || impact.avoided || impact.invulnerable
}
function routeContact(
  progress: CombatProgress,
  state: FightState,
  route: CombatRoute,
): CombatProgress {
  const next = { ...progress, lastImpact: state.impact!.sequence }
  if (rejectedContact(state)) return { ...next, cue: 'blocked', failed: true }
  if (route.whiff && progress.step === 0 && state.player.attack?.comboOpening !== 'whiff-punish')
    return { ...next, cue: 'wrong', failed: true }
  const hits = (state.impact!.comboHits ?? 0) - routeHitsBefore(route, progress.step)
  const gained = hits - progress.stepHits
  if (!validRouteHit(state, progress, { route, hits, gained }))
    return { ...next, cue: 'wrong', failed: true }
  const finishedStep = hits === routeStepHits(route, progress.step)
  const step = progress.step + Number(finishedStep)
  const complete = routeFinished(route, step, progress.supportLanded)
  return {
    ...next,
    step,
    stepHits: finishedStep ? 0 : hits,
    lastContact: state.frame,
    complete,
    cue: complete ? 'complete' : 'wait',
  }
}

function validRouteHit(
  state: FightState,
  progress: CombatProgress,
  contact: { route: CombatRoute; hits: number; gained: number },
) {
  const { route, hits, gained } = contact
  return (
    state.player.attack?.moveId === `${route.fighter}:${route.moves[progress.step]}` &&
    gained >= 1 &&
    hits <= routeStepHits(route, progress.step) &&
    state.impact!.sequence - progress.lastImpact === gained
  )
}

function routeFinished(route: CombatRoute, step: number, supportLanded?: boolean) {
  return step === route.moves.length && (!route.kameo || supportLanded === true)
}

function missedWhiffPunish(progress: CombatProgress, state: FightState, route: CombatRoute) {
  return (
    route.whiff && progress.cue === 'whiff-confirm' && !state.opponent.attack && progress.step === 0
  )
}

function comboDropped(progress: CombatProgress, state: FightState) {
  return progress.step > 0 && state.opponent.hitStun === 0 && state.hitstop === 0
}
export function observeCombatRoute(
  progress: CombatProgress,
  state: FightState,
  route: CombatRoute,
): CombatProgress {
  if (inactive(progress, state)) return progress
  let next = supportProgress({ ...progress, lastFrame: state.frame }, state, route)
  if (state.impact && state.impact.sequence !== progress.lastImpact)
    next = routeContact(next, state, route)
  if (next.failed || next.complete) return next
  if (routeFinished(route, next.step, next.supportLanded))
    return { ...next, complete: true, cue: 'complete' }
  if (missedWhiffPunish(next, state, route)) return { ...next, cue: 'defense-late', failed: true }
  if (comboDropped(next, state)) return { ...next, cue: 'dropped', failed: true }
  return { ...next, cue: routeCue(next, state, route) }
}

function supportProgress(
  progress: CombatProgress,
  state: FightState,
  route: CombatRoute,
): CombatProgress {
  if (!route.kameo) return progress
  return {
    ...progress,
    supportLanded: progress.supportLanded || comboSupportLanded(state, route.kameo.id),
  }
}
function routeCue(progress: CombatProgress, state: FightState, route: CombatRoute): CombatCue {
  if (progress.step === route.moves.length || waitingForComboSupport(state, route, progress.step))
    return 'support-wait'
  if (progress.step === 0) return openingCue(state, route)
  const move = moveForSlot(route.fighter, route.moves[progress.step])!
  if (state.player.attack?.moveId === move.id)
    return routeStepHits(route, progress.step) > 1 ? 'volley' : 'wait'
  return continuationCue(progress, state, route)
}

function continuationCue(
  progress: CombatProgress,
  state: FightState,
  route: CombatRoute,
): CombatCue {
  const move = moveForSlot(route.fighter, route.moves[progress.step])!
  if (state.opponent.hitStun <= move.tuning.startup) return 'late'
  const previous = moveForSlot(route.fighter, route.moves[progress.step - 1])!
  if (previous.linkInto?.includes(move.id))
    return canStartFighterAttack(state.player, move.kind, move.id) ? 'link' : 'link-wait'
  return canStartFighterAttack(state.player, move.kind, move.id) ? 'cancel' : 'wait'
}

function openingCue(state: FightState, route: CombatRoute): CombatCue {
  if (!route.whiff) return 'ready'
  return attackPhase(state.opponent) === 'recovery' ? 'whiff-confirm' : 'evade'
}
function defenseContact(progress: CombatProgress, state: FightState): CombatProgress {
  const impact = state.impact!
  if (impact.attacker === 'opponent') {
    return impact.blocked
      ? { ...progress, step: 1, cue: 'defend-wait', lastContact: state.frame }
      : { ...progress, failed: true, cue: 'blocked' }
  }
  const complete = progress.step === 1 && impact.punish && !impact.blocked
  return {
    ...progress,
    complete,
    step: complete ? 2 : progress.step,
    failed: !complete,
    cue: complete ? 'complete' : 'wrong',
  }
}
export function observeCombatDefense(progress: CombatProgress, state: FightState): CombatProgress {
  if (inactive(progress, state)) return progress
  const next = { ...progress, lastFrame: state.frame }
  if (!state.impact || state.impact.sequence === progress.lastImpact)
    return defenseWindow(next, state)
  return defenseContact({ ...next, lastImpact: state.impact.sequence }, state)
}

function defenseWindow(progress: CombatProgress, state: FightState): CombatProgress {
  if (progress.step !== 1) return progress
  if (!state.opponent.attack) return { ...progress, cue: 'defense-late', failed: true }
  const waiting = state.hitstop > 0 || state.player.blockStun > INPUT_BUFFER_FRAMES
  return { ...progress, cue: waiting ? 'defend-wait' : 'punish' }
}
