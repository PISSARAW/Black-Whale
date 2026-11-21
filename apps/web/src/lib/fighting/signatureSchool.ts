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
import {
  dashTapReady,
  motionDemoCommand,
  motionDemoInput,
  motionLessonDone,
} from './signatureSchoolMotion'
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

/**
 * Every signature combo whose steps the lesson can observe; a preparation is played when the
 * lesson starts (createSignatureFight). A Parallel Future vision or a riposte taken on purpose
 * (signatureCombosSecond.ts) breaks the combo on purpose and needs the opponent to act: those
 * routes stay out of the Academy for now.
 */
export const ACADEMY_SIGNATURES: readonly SignatureCombo[] = SIGNATURE_COMBOS.filter((combo) =>
  combo.steps.every((step) => !('future' in step) && !('riposte' in step)),
)
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
  const motion = motionLessonDone(step, state)
  if (motion !== null) return motion
  if ('move' in step || 'ranged' in step)
    return startedNow(state) && attackMatches(state, 'move' in step ? step.move : 'ranged')
  if ('dash' in step) return dashing(state, step.dash)
  return Boolean(state.gumNetwork?.pending.player) || ceilingLinked(state)
}

const moveId = (state: FightState, slot: MoveSlot | 'ranged') => `${state.player.id}:${slot}`

/**
 * Whether the player's attack is the one a step names: a `ranged` step accepts any ranged
 * attack (a burst has no move of its own); a move step needs that move, shot moves included.
 */
const attackMatches = (state: FightState, slot: MoveSlot | 'ranged') =>
  slot === 'ranged'
    ? state.player.attack?.kind === 'ranged'
    : state.player.attack?.moveId === moveId(state, slot)

/** An attack is new on its first simulated frames. */
const startedNow = (state: FightState) => (state.player.attack?.frame ?? 99) <= 1

function dashing(state: FightState, dash: 'back' | 'forward' | 'through'): boolean {
  const motion = state.player.motion?.dash
  if (!motion?.accel) return false
  return (motion.direction === state.player.facing) === (dash !== 'back')
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
  return !expected || !attackMatches(state, expected)
}

/**
 * The contact belongs to the expected move: the current attack, or for a bullet still in
 * flight, the move of the previous step (the last bullets of a volley land after the next starts).
 */
function contactMatches(
  lesson: { combo: SignatureCombo; progress: SignatureProgress },
  state: FightState,
  expected: MoveSlot | 'ranged',
): boolean {
  if (attackMatches(state, expected)) return true
  if (state.impact?.projectileId === undefined) return false
  const moves = lesson.combo.steps
    .slice(0, lesson.progress.step)
    .flatMap((step) => ('move' in step ? [step.move] : []))
  return moves.at(-2) === expected
}

function observeContact(combo: SignatureCombo, progress: SignatureProgress, state: FightState) {
  const impact = state.impact!
  const next = { ...progress, lastImpact: impact.sequence }
  if (impact.attacker !== 'player') return fail(next, 'blocked')
  if (impact.blocked || impact.avoided || impact.invulnerable) return fail(next, 'blocked')
  const expected = signatureHits(combo)[progress.hits]
  if (!expected || !contactMatches({ combo, progress }, state, expected)) return fail(next, 'wrong')
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
  if ('ranged' in step) return rangedReady(state) ? RANGED_COMMAND : null
  if (!('move' in step)) return motionDemoCommand(step, state)
  if (!moveReady(state, step.move)) return null
  return {
    kind: 'move',
    side: 'player',
    action: combatRouteAction(step.move),
    input: packReplayInput(combatRouteInput(step.move, state.player.facing)),
  }
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
  if (!step) return { input: EMPTY_INPUT }
  const motion = motionDemoInput(step, state)
  if (motion) return { input: motion }
  if (!('dash' in step)) return { input: EMPTY_INPUT }
  const tapFrom = progress.tapFrom ?? (dashTapReady(step, state) ? state.frame : undefined)
  if (tapFrom === undefined) return { input: EMPTY_INPUT }
  const direction = step.dash === 'back' ? -state.player.facing : state.player.facing
  const held = tapHeld(state, direction)
  return {
    tapFrom,
    input: {
      ...EMPTY_INPUT,
      down: Boolean(step.low),
      right: held && direction === 1,
      left: held && direction === -1,
    },
  }
}

/**
 * Press, release, press, read from the engine's own tap tracking rather than counted frames:
 * inputs entered during hitstop (every other frame of a volley) would otherwise be lost.
 */
function tapHeld(state: FightState, direction: number): boolean {
  const motion = state.player.motion
  if (motion?.tapDirection !== direction) return true
  return motion.heldDirection !== direction
}
