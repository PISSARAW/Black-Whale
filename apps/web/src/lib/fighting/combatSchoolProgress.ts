import { INPUT_BUFFER_FRAMES } from './fightClock'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import type { CombatRoute } from './combatRoutes'
import type { FightState } from './types'

export type CombatCue =
  | 'ready'
  | 'wait'
  | 'cancel'
  | 'late'
  | 'blocked'
  | 'wrong'
  | 'dropped'
  | 'complete'
  | 'guard'
  | 'defend-wait'
  | 'defense-late'
  | 'punish'
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
}
export function initialCombatProgress(id: string, demo: boolean): CombatProgress {
  return {
    id,
    step: 0,
    lastImpact: 0,
    lastFrame: 0,
    lastContact: 0,
    cue: id.endsWith(':defense') ? 'guard' : 'ready',
    failed: false,
    complete: false,
    demo,
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
  const expected = `${route.fighter}:${route.moves[progress.step]}`
  if (state.player.attack?.moveId !== expected || state.impact!.comboHits !== progress.step + 1)
    return { ...next, cue: 'wrong', failed: true }
  const step = progress.step + 1
  const complete = step === route.moves.length
  return { ...next, step, lastContact: state.frame, complete, cue: complete ? 'complete' : 'wait' }
}
export function observeCombatRoute(
  progress: CombatProgress,
  state: FightState,
  route: CombatRoute,
): CombatProgress {
  if (inactive(progress, state)) return progress
  let next = { ...progress, lastFrame: state.frame }
  if (state.impact && state.impact.sequence !== progress.lastImpact)
    next = routeContact(next, state, route)
  if (next.failed || next.complete) return next
  if (next.step > 0 && state.opponent.hitStun === 0 && state.hitstop === 0)
    return { ...next, cue: 'dropped', failed: true }
  return { ...next, cue: routeCue(next, state, route) }
}
function routeCue(progress: CombatProgress, state: FightState, route: CombatRoute): CombatCue {
  if (progress.step === 0) return 'ready'
  const move = moveForSlot(route.fighter, route.moves[progress.step])!
  if (state.player.attack?.moveId === move.id) return 'wait'
  if (state.opponent.hitStun <= move.tuning.startup) return 'late'
  return canStartFighterAttack(state.player, move.kind, move.id) ? 'cancel' : 'wait'
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
