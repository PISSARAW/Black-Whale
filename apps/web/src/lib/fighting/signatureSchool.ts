import { comboAdmissionBody } from './comboAuraCost'
import { combatRouteAction, combatRouteInput } from './combatRouteFight'
import type { CombatProgress } from './combatSchoolProgress'
import { canStartFighterAttack } from './fighterAttacks'
import { packReplayInput } from './fightReplayInput'
import type { ReplayCommand } from './fightReplayTypes'
import { moveForSlot } from './movesets'
import {
  SIGNATURE_COMBOS,
  signatureCombo,
  signatureHits,
  type SignatureCombo,
  type SignatureStep,
} from './signatureCombos'
import { createSignatureFight } from './signatureComboRunner'
import { EMPTY_INPUT, type FightInput, type FightState, type MoveSlot } from './types'

/**
 * Academy lessons for the signature combos (SIGNATURE_COMBOS.md). The player's own steps are
 * observed in the simulation: an attack that starts, an accélération, Emperor Time, a gum cast.
 * Every hit must extend the same combo. The demonstration sends the same commands and inputs.
 */
export interface SignatureProgress extends CombatProgress {
  signature: true
  /** Hits of the combo confirmed so far. */
  hits: number
  /** First frame of the double tap the demonstration is entering, if any. */
  tapFrom?: number
}

/** Every signature combo; a preparation is played when the lesson starts (createSignatureFight). */
export const ACADEMY_SIGNATURES: readonly SignatureCombo[] = SIGNATURE_COMBOS
export const isSignatureLesson = (id: string) => ACADEMY_SIGNATURES.some((combo) => combo.id === id)

export function startSignatureLesson(id: string, demo: boolean) {
  const combo = signatureCombo(id)
  const progress: SignatureProgress = {
    id,
    signature: true,
    step: 0,
    hits: 0,
    lastImpact: 0,
    lastFrame: 0,
    lastContact: 0,
    cue: 'ready',
    failed: false,
    complete: false,
    demo,
    stepHits: 0,
  }
  return { progress, state: createSignatureFight(combo, { mirrored: false, gap: 5 }) }
}

export function observeSignatureLesson(progress: SignatureProgress, state: FightState) {
  if (state.frame <= progress.lastFrame || progress.failed || progress.complete) return progress
  const combo = signatureCombo(progress.id)
  let next: SignatureProgress = { ...progress, lastFrame: state.frame }
  next = advanceSteps(combo, next, state)
  if (state.impact && state.impact.sequence !== progress.lastImpact)
    next = observeContact(combo, next, state)
  return next.failed ? next : settle(combo, next, state)
}

/** Dropped once the target recovers, complete once every step and hit is in. */
function settle(combo: SignatureCombo, progress: SignatureProgress, state: FightState) {
  if (progress.hits > 0 && state.opponent.comboHits === 0) return fail(progress, 'dropped')
  const complete =
    progress.step >= combo.steps.length && progress.hits >= signatureHits(combo).length
  if (complete) return { ...progress, complete: true, cue: 'complete' as const }
  return { ...progress, cue: progress.hits > 0 ? ('cancel' as const) : ('ready' as const) }
}

/** The step a running demonstration is on; nothing once it is over or not a demonstration. */
function demoStep(progress: SignatureProgress): SignatureStep | undefined {
  if (!progress.demo || progress.complete || progress.failed) return undefined
  return signatureCombo(progress.id).steps[progress.step]
}

function fail(progress: SignatureProgress, cue: CombatProgress['cue']): SignatureProgress {
  return { ...progress, failed: true, cue }
}

/** Steps the player has really performed on this frame, in order; a wrong attack fails. */
function advanceSteps(combo: SignatureCombo, progress: SignatureProgress, state: FightState) {
  const step = combo.steps[progress.step]
  if (step && stepDone(step, state))
    return { ...progress, step: progress.step + 1, tapFrom: undefined }
  return startsWrongAttack(combo, progress, state) ? fail(progress, 'wrong') : progress
}

function stepDone(step: SignatureStep, state: FightState): boolean {
  if ('move' in step || 'ranged' in step)
    return (
      startedNow(state) && attackId(state) === moveId(state, 'move' in step ? step.move : 'ranged')
    )
  if ('dash' in step) return dashing(state, step.dash)
  if ('emperor' in step) return Boolean(state.player.kurapika?.emperorTime)
  return Boolean(state.gumNetwork?.pending.player) || ceilingLinked(state)
}

const moveId = (state: FightState, slot: MoveSlot | 'ranged') => `${state.player.id}:${slot}`

/** The player's attack as a step names it: a ranged attack has no move of its own. */
const attackId = (state: FightState) =>
  state.player.attack?.kind === 'ranged' ? moveId(state, 'ranged') : state.player.attack?.moveId

/** An attack is new on its first simulated frames. */
const startedNow = (state: FightState) => (state.player.attack?.frame ?? 99) <= 1

function dashing(state: FightState, dash: 'back' | 'forward'): boolean {
  const motion = state.player.motion?.dash
  if (!motion?.accel) return false
  return (motion.direction === state.player.facing) === (dash === 'forward')
}

function ceilingLinked(state: FightState): boolean {
  return Boolean(
    state.gumNetwork?.links.some(
      (link) =>
        link.owner === 'player' &&
        link.target.kind === 'surface' &&
        link.target.surface === 'ceiling',
    ),
  )
}

function startsWrongAttack(combo: SignatureCombo, progress: SignatureProgress, state: FightState) {
  const attack = state.player.attack
  if (!attack || !startedNow(state)) return false
  const expected = combo.steps
    .slice(0, progress.step)
    .flatMap((step) => ('move' in step ? [step.move] : 'ranged' in step ? ['ranged' as const] : []))
    .at(-1)
  return attackId(state) !== (expected ? moveId(state, expected) : undefined)
}

function observeContact(combo: SignatureCombo, progress: SignatureProgress, state: FightState) {
  const impact = state.impact!
  const next = { ...progress, lastImpact: impact.sequence }
  if (impact.attacker !== 'player') return fail(next, 'blocked')
  if (impact.blocked || impact.avoided || impact.invulnerable) return fail(next, 'blocked')
  const expected = signatureHits(combo)[progress.hits]
  if (attackId(state) !== `${combo.fighter}:${expected}`) return fail(next, 'wrong')
  if ((impact.comboHits ?? 0) !== progress.hits + 1) return fail(next, 'dropped')
  return { ...next, hits: progress.hits + 1, lastContact: state.frame }
}

/** The demonstration's command for this frame: an attack or Emperor Time. */
export function signatureDemoCommand(
  progress: SignatureProgress,
  state: FightState,
): ReplayCommand | null {
  const step = demoStep(progress)
  if (!step) return null
  if ('emperor' in step)
    return capturing(state) && !state.player.kurapika?.emperorTime
      ? { kind: 'emperor', side: 'player' }
      : null
  if ('ranged' in step) return rangedReady(state) ? RANGED_COMMAND : null
  if (!('move' in step) || !moveReady(state, step.move)) return null
  return {
    kind: 'move',
    side: 'player',
    action: combatRouteAction(step.move),
    input: packReplayInput(combatRouteInput(step.move, state.player.facing)),
  }
}

/** Emperor Time waits for a confirmed capture or Chain Jail, as in signatureComboRunner.ts. */
function capturing(state: FightState): boolean {
  const attack = state.player.attack
  return Boolean(attack?.confirmedHit && /:(throw|neutralSpecial)$/.test(attack.moveId ?? ''))
}

const CONTACT_GAP = 6

/** A forward accélération runs until contact range, as a player would time it. */
function closingDash(state: FightState): boolean {
  const dash = state.player.motion?.dash
  const gap = Math.abs(state.opponent.x - state.player.x)
  return Boolean(dash?.accel && dash.direction === state.player.facing && gap > CONTACT_GAP)
}

function moveReady(state: FightState, slot: MoveSlot): boolean {
  const move = moveForSlot(state.player.id, slot)
  if (!move || state.player.attack?.moveId === move.id) return false
  if ((move.variant === 'air' && state.player.y <= 0) || closingDash(state)) return false
  return canStartFighterAttack(comboAdmissionBody(state, 'player', move), move.kind, move.id)
}

function rangedReady(state: FightState): boolean {
  return state.player.attack?.kind !== 'ranged' && canStartFighterAttack(state.player, 'ranged')
}

const RANGED_COMMAND: ReplayCommand = {
  kind: 'move',
  side: 'player',
  action: 'ranged',
  input: packReplayInput(EMPTY_INPUT),
}

/** The demonstration's Hatsu command that is not an attack, journaled by the match. */
export function signatureDemoAction(progress: SignatureProgress, state: FightState) {
  const step = demoStep(progress)
  if (!step || !('command' in step) || state.player.attack || state.player.arenaRecovery)
    return null
  return step.command
}

/** Held directions of the demonstration: the double tap of an accélération. */
export function signatureDemoInput(
  progress: SignatureProgress,
  state: FightState,
): { input: FightInput; tapFrom?: number } {
  const step = demoStep(progress)
  if (!step || !('dash' in step)) return { input: EMPTY_INPUT }
  const tapFrom = progress.tapFrom ?? (tapReady(state) ? state.frame : undefined)
  if (tapFrom === undefined) return { input: EMPTY_INPUT }
  const held = state.frame - tapFrom !== 1
  const direction = step.dash === 'forward' ? state.player.facing : -state.player.facing
  return {
    tapFrom,
    input: { ...EMPTY_INPUT, right: held && direction === 1, left: held && direction === -1 },
  }
}

const tapReady = (state: FightState) =>
  Boolean(state.player.attack?.confirmedHit) && state.hitstop === 0
