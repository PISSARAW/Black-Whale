import { createCombatRouteFight, combatRouteAction, combatRouteInput } from './combatRouteFight'
import { dashWindowOpen } from './dashCancel'
import { comboAdmissionBody } from './comboAuraCost'
import { performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { canStartFighterAttack } from './fighterAttacks'
import { attackPhase } from './frameData'
import { moveForSlot } from './movesets'
import { performTrainingAction } from './trainingAction'
import { setTrainingResources } from './trainingSession'
import { isMotionStep, motionStepFrame, type SignatureMotionStep } from './signatureMotionSteps'
import {
  isLotStep,
  lotStepFrame,
  utilityCommandDone,
  waitingForPuppetApproach,
  type SignatureLotStep,
} from './signatureLotSteps'
import { isLot2Step, lot2StepFrame, type SignatureLot2Step } from './signatureLot2Steps'
import {
  signatureHits,
  type SignatureCombo,
  type SignaturePreparationStep,
} from './signatureCombos'
import { dummyInput, futureStep, riposteStep } from './signatureComboSteps'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

/** Frames of the double tap: press, release, press. */
const TAP_FRAMES = 3
const MAX_FRAMES = 1800

export interface SignatureContact {
  move: string | undefined
  combo: number
  blocked: boolean
}
export interface SignatureRun {
  state: FightState
  contacts: SignatureContact[]
  /** Index of the first step that never ran; equals the step count once complete. */
  reached: number
}
/** The guarding dummy by default; `ai` lets the opponent's own AI fight back instead. */
export interface SignatureDummy {
  ai?: boolean
  /** Sees every simulated frame with the index of the step being attempted (demonstrations). */
  onFrame?: (state: FightState, step: number) => void
}
interface Cursor {
  state: FightState
  index: number
  tap: number
  /** Player health when a riposte step began. */
  health?: number
  /** Whether Cat's Name post-mortem sequence has begun during a fatal riposte step. */
  catsSeen?: boolean
}

/** The fight a signature demonstration starts from: full aura, the dummy guards after a hit. */
export function createSignatureFight(
  combo: SignatureCombo,
  options: { mirrored: boolean; gap: number },
) {
  const route = createCombatRouteFight(
    {
      id: combo.id,
      fighter: combo.fighter,
      kind: 'confirm',
      title: combo.title,
      moves: [],
      requirement: combo.requirement,
    },
    combo.opponent,
  )
  const state = prepareSignature(combo, route)
  const facing = options.mirrored ? -1 : 1
  return {
    ...state,
    player: { ...state.player, x: 50 - facing * options.gap, facing },
    opponent: { ...state.opponent, x: 50, facing: facing === 1 ? -1 : 1 },
  } satisfies FightState
}

const SETTLE_FRAMES = 240

/** Preparation runs at contact range, then both bodies settle before the combo begins. */
function prepareSignature(combo: SignatureCombo, start: FightState): FightState {
  const steps = combo.preparation
  if (!steps) return start
  const hits = steps.filter((step) => 'move' in step && step.hit !== false).length
  let state = playSignatureSteps({ steps, hits }, start).state
  for (let i = 0; i < SETTLE_FRAMES && !settled(state); i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  // A new exercise: the dummy guards only after the combo's own first hit, aura is refilled.
  const training = state.training && { ...state.training, firstHitTaken: false }
  return setTrainingResources({ ...state, impact: null, training }, 'player', {
    aura: 100,
    infiniteAura: false,
    infiniteHealth: false,
  })
}

function settled(state: FightState): boolean {
  const idle = (side: 'player' | 'opponent') => {
    const body = state[side]
    return !body.attack && !body.hitStun && !body.blockStun && !body.knockdownFrames
  }
  return !state.hitstop && !state.projectiles.length && idle('player') && idle('opponent')
}

/** Plays the combo through the ordinary commands; each step waits until it can really run. */
export function playSignatureCombo(
  combo: SignatureCombo,
  start: FightState,
  dummy: SignatureDummy = {},
): SignatureRun {
  return playSignatureSteps({ steps: combo.steps, hits: signatureHits(combo).length, dummy }, start)
}

/** Steps are played in order; the run ends once every step ran and `hits` contacts landed. */
export function playSignatureSteps(
  plan: { steps: readonly SignaturePreparationStep[]; hits: number; dummy?: SignatureDummy },
  start: FightState,
): SignatureRun {
  const { steps, hits, dummy = {} } = plan
  let cursor: Cursor = { state: start, index: 0, tap: -1 }
  let lastImpact = start.impact?.sequence ?? 0
  const contacts: SignatureContact[] = []
  const shots = new Map<number, string>()
  const finished = () => cursor.index >= steps.length && contacts.length >= hits
  for (let frame = 0; frame < MAX_FRAMES && !finished(); frame++) {
    const step = steps[cursor.index]
    const { cursor: next, input } = step ? attempt(cursor, step) : { cursor, input: EMPTY_INPUT }
    const state = tickFight(next.state, input, opponentControls(dummy, step, contacts.length > 0))
    cursor = { ...next, state }
    labelShots(state, shots)
    lastImpact = recordContact(state, lastImpact, { contacts, shots })
    dummy.onFrame?.(state, cursor.index)
  }
  return { state: cursor.state, contacts, reached: cursor.index }
}

/** The AI fights on its own; the dummy guards once struck, except while striking back. */
function opponentControls(
  dummy: SignatureDummy,
  step: SignaturePreparationStep | undefined,
  struck: boolean,
) {
  if (dummy.ai) return { dt: 1 / 60, ai: true }
  const riposte = Boolean(
    step && ('riposte' in step || 'disobey' in step || 'fatalRiposte' in step),
  )
  return { dt: 1 / 60, ai: false, opponentInput: dummyInput(struck && !riposte) }
}

function attempt(
  cursor: Cursor,
  step: SignaturePreparationStep,
): { cursor: Cursor; input: FightInput } {
  if ('dash' in step) return dashFrame(cursor, step)
  if ('future' in step || 'riposte' in step) return hingeStep(cursor, step)
  if (isMotionStep(step)) return motionAttempt(cursor, step)
  if (isLotStep(step)) return lotAttempt(cursor, step)
  if (isLot2Step(step)) return lot2Attempt(cursor, step)
  const state = cursor.state
  const after = commandStep(state, step)
  const done = 'emperor' in step ? Boolean(after.player.kurapika?.emperorTime) : after !== state
  return {
    cursor: { ...cursor, state: after, index: cursor.index + Number(done) },
    input: EMPTY_INPUT,
  }
}

/** One command attempt; the unchanged state when the engine refuses it this frame. */
function commandStep(state: FightState, step: SignaturePreparationStep): FightState {
  if ('move' in step) return startMove(state, step.move, step.hit === false)
  if ('ranged' in step) return fire(state, 'player')
  if ('incoming' in step) return incoming(state)
  if ('trueForm' in step) return revealTrueForm(state)
  if ('emperor' in step) return emperorTime(state)
  if ('command' in step)
    return performArsenalAction({ state, side: 'player', command: step.command }, performAuraAttack)
  return state
}

/** The deliberate break of a combo: a Parallel Future command or a riposte taken on purpose. */
function hingeStep(
  cursor: Cursor,
  step: SignaturePreparationStep,
): { cursor: Cursor; input: FightInput } {
  const health = cursor.health ?? cursor.state.player.health
  const result =
    'future' in step
      ? futureStep(cursor.state, step.future)
      : riposteStep(cursor.state, 'riposte' in step ? step.riposte : 'standingLight', health)
  const index = cursor.index + Number(result.done)
  return {
    cursor: { ...cursor, state: result.state, index, health: result.done ? undefined : health },
    input: EMPTY_INPUT,
  }
}

function moveBlocked(
  state: FightState,
  move: NonNullable<ReturnType<typeof moveForSlot>>,
  utility: boolean,
): boolean {
  if (move.variant === 'air' && state.player.y <= 0) return true
  if (closingDash(state) || (!utility && waitingForPuppetApproach(state))) return true
  if (state.player.attack && !state.player.attack.confirmedHit) return true
  return !canStartFighterAttack(comboAdmissionBody(state, 'player', move), move.kind, move.id)
}

function startMove(
  state: FightState,
  slot: Parameters<typeof moveForSlot>[1],
  utility = false,
): FightState {
  const move = moveForSlot(state.player.id, slot)
  if (!move || moveBlocked(state, move, utility)) return state
  const after = performTrainingAction({
    state,
    side: 'player',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.player.facing),
  })
  const started =
    (after.player.attack?.moveId === move.id && after.player.attack !== state.player.attack) ||
    (utility && utilityCommandDone(state, after))
  return started ? after : state
}

/** The ordinary ranged command; unchanged state when the engine refuses it. */
function fire(state: FightState, side: 'player' | 'opponent'): FightState {
  const after = performAuraAttack({ state, side, kind: 'ranged', auraCharged: false })
  const started = after[side].attack?.kind === 'ranged' && after[side].attack !== state[side].attack
  return started ? after : state
}

function motionAttempt(cursor: Cursor, step: SignatureMotionStep) {
  const frame = motionStepFrame(cursor.state, step)
  const index = cursor.index + Number(frame.done)
  return { cursor: { ...cursor, state: frame.state, index }, input: frame.input }
}

function lotAttempt(cursor: Cursor, step: SignatureLotStep) {
  const frame = lotStepFrame(cursor.state, step)
  const index = cursor.index + Number(frame.done)
  return { cursor: { ...cursor, state: frame.state, index }, input: frame.input }
}

function lot2Attempt(cursor: Cursor, step: SignatureLot2Step) {
  const frame = lot2StepFrame(cursor.state, step, cursor.catsSeen)
  const index = cursor.index + Number(frame.done)
  const catsSeen = frame.done ? undefined : frame.catsSeen
  return { cursor: { ...cursor, state: frame.state, index, catsSeen }, input: frame.input }
}

/** Neutral special reveals the natural body; only a real change of form counts as done. */
function revealTrueForm(state: FightState): FightState {
  const after = performTrainingAction({ state, side: 'player', action: 'special' })
  return after.player.biscuitTrueForm && !state.player.biscuitTrueForm ? after : state
}

/** The opponent fires into the player's technique once it is active (a capture window). */
function incoming(state: FightState): FightState {
  if (state.player.attack && attackPhase(state.player) !== 'active') return state
  return fire(state, 'opponent')
}

/** Aura + finisher toggles Emperor Time; it is retried until a capture lets it start. */
function emperorTime(state: FightState): FightState {
  return performTrainingAction({
    state,
    side: 'player',
    action: 'finisher',
    input: { ...EMPTY_INPUT, aura: true },
  })
}

/** A double tap entered once the hit is confirmed and the hitstop has ended. */
function dashFrame(
  cursor: Cursor,
  step: { dash: 'back' | 'forward' | 'through'; free?: true; low?: true },
) {
  const { state } = cursor
  const ready = step.free ? freeToDash(state) : tapReady(state)
  if (cursor.tap < 0 && !ready) return { cursor, input: EMPTY_INPUT }
  // The engine reads no input during hitstop (a volley strikes every other frame): wait it out.
  if (cursor.tap >= 0 && state.hitstop > 0) return { cursor, input: EMPTY_INPUT }
  const tap = cursor.tap + 1
  const direction = step.dash === 'back' ? -state.player.facing : state.player.facing
  const held = tap !== 1
  const input = {
    ...EMPTY_INPUT,
    down: Boolean(step.low),
    right: held && direction === 1,
    left: held && direction === -1,
  }
  const done = tap === TAP_FRAMES - 1
  return {
    cursor: { ...cursor, tap: done ? -1 : tap, index: cursor.index + Number(done) },
    input,
  }
}

/** A dash from neutral waits for the body to be free and any previous dash to end. */
const freeToDash = (state: FightState) => !state.player.attack && !state.player.motion?.dash

const tapReady = (state: FightState) => dashWindowOpen(state.player) && state.hitstop === 0

const CONTACT_GAP = 6

function closingDash(state: FightState): boolean {
  const dash = state.player.motion?.dash
  const gap = Math.abs(state.opponent.x - state.player.x)
  // A crossing dash runs until the body is past the opponent and facing it again.
  if (dash?.through) return dash.direction === state.player.facing
  return Boolean(dash?.accel && dash.direction === state.player.facing && gap > CONTACT_GAP)
}

/** A projectile is credited to the move that fired it, even once a later move has started. */
function labelShots(state: FightState, shots: Map<number, string>) {
  for (const shot of state.projectiles)
    if (shot.owner === 'player' && !shots.has(shot.id))
      shots.set(shot.id, state.player.attack?.moveId ?? `${state.player.id}:ranged`)
}

/** A shot is credited to its move; one fired point-blank lands on the frame it appears. */
function contactMove(state: FightState, shots: Map<number, string>): string | undefined {
  const id = state.impact?.projectileId
  if (id === null || id === undefined) return state.player.attack?.moveId
  return shots.get(id) ?? state.player.attack?.moveId ?? `${state.player.id}:ranged`
}

function simultaneousShotHits(impact: NonNullable<FightState['impact']>, seen: number): number {
  if (impact.projectileId === null || impact.projectileId === undefined || impact.blocked) return 1
  return Math.max(1, Math.min(impact.sequence - seen, impact.comboHits || 1))
}

/** Appends the player's new contact, if this frame produced one; returns the impact seen. */
function recordContact(
  state: FightState,
  seen: number,
  record: { contacts: SignatureContact[]; shots: Map<number, string> },
): number {
  const impact = state.impact
  if (!impact || impact.sequence === seen) return seen
  if (impact.attacker === 'player') {
    const move = contactMove(state, record.shots)
    const total = impact.comboHits ?? 0
    const blocked = Boolean(impact.blocked)
    const count = simultaneousShotHits(impact, seen)
    for (let i = 0; i < count; i++)
      record.contacts.push({
        move,
        combo: total >= count ? total - (count - 1 - i) : total,
        blocked,
      })
  }
  return impact.sequence
}
