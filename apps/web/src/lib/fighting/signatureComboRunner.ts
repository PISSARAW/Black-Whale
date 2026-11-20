import { createCombatRouteFight, combatRouteAction, combatRouteInput } from './combatRouteFight'
import { comboAdmissionBody } from './comboAuraCost'
import { performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { performTrainingAction } from './trainingAction'
import { signatureHits, type SignatureCombo, type SignatureStep } from './signatureCombos'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

/** Frames of the double tap: press, release, press. */
const TAP_FRAMES = 3
const MAX_FRAMES = 420

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
interface Cursor {
  state: FightState
  index: number
  tap: number
}

/** The fight a signature demonstration starts from: full aura, the dummy guards after a hit. */
export function createSignatureFight(
  combo: SignatureCombo,
  options: { mirrored: boolean; gap: number },
) {
  const state = createCombatRouteFight(
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
  const facing = options.mirrored ? -1 : 1
  return {
    ...state,
    player: { ...state.player, x: 50 - facing * options.gap, facing },
    opponent: { ...state.opponent, x: 50, facing: facing === 1 ? -1 : 1 },
  } satisfies FightState
}

/** Plays the combo through the ordinary commands; each step waits until it can really run. */
export function playSignatureCombo(combo: SignatureCombo, start: FightState): SignatureRun {
  let cursor: Cursor = { state: start, index: 0, tap: -1 }
  let lastImpact = start.impact?.sequence ?? 0
  const contacts: SignatureContact[] = []
  for (let frame = 0; frame < MAX_FRAMES && !finished(combo, cursor, contacts); frame++) {
    const step = combo.steps[cursor.index]
    const { cursor: next, input } = step ? attempt(cursor, step) : { cursor, input: EMPTY_INPUT }
    const state = tickFight(next.state, input, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard: contacts.length > 0 },
    })
    cursor = { ...next, state }
    lastImpact = recordContact(state, lastImpact, contacts)
  }
  return { state: cursor.state, contacts, reached: cursor.index }
}

function finished(combo: SignatureCombo, cursor: Cursor, contacts: SignatureContact[]) {
  return cursor.index >= combo.steps.length && contacts.length >= signatureHits(combo).length
}

function attempt(cursor: Cursor, step: SignatureStep): { cursor: Cursor; input: FightInput } {
  if ('dash' in step) return dashFrame(cursor, step.dash)
  const state = cursor.state
  let after = state
  if ('move' in step) after = startMove(state, step.move)
  else if ('emperor' in step) after = emperorTime(state)
  else
    after = performArsenalAction(
      { state, side: 'player', command: step.command },
      performAuraAttack,
    )
  const done = 'emperor' in step ? Boolean(after.player.kurapika?.emperorTime) : after !== state
  return {
    cursor: { ...cursor, state: after, index: cursor.index + Number(done) },
    input: EMPTY_INPUT,
  }
}

function startMove(state: FightState, slot: Parameters<typeof moveForSlot>[1]): FightState {
  const move = moveForSlot(state.player.id, slot)
  if (!move) return state
  // An air move waits for the body to leave the ground rather than becoming a ground move.
  if (move.variant === 'air' && state.player.y <= 0) return state
  // A forward accélération runs until contact range, as a player would time it.
  if (closingDash(state)) return state
  if (!canStartFighterAttack(comboAdmissionBody(state, 'player', move), move.kind, move.id))
    return state
  const after = performTrainingAction({
    state,
    side: 'player',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.player.facing),
  })
  const started =
    after.player.attack?.moveId === move.id && after.player.attack !== state.player.attack
  return started ? after : state
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
function dashFrame(cursor: Cursor, dash: 'back' | 'forward') {
  const { state } = cursor
  if (cursor.tap < 0 && !(state.player.attack?.confirmedHit && state.hitstop === 0))
    return { cursor, input: EMPTY_INPUT }
  const tap = cursor.tap + 1
  const direction = dash === 'forward' ? state.player.facing : -state.player.facing
  const held = tap !== 1
  const input = { ...EMPTY_INPUT, right: held && direction === 1, left: held && direction === -1 }
  const done = tap === TAP_FRAMES - 1
  return {
    cursor: { ...cursor, tap: done ? -1 : tap, index: cursor.index + Number(done) },
    input,
  }
}

const CONTACT_GAP = 6

function closingDash(state: FightState): boolean {
  const dash = state.player.motion?.dash
  const gap = Math.abs(state.opponent.x - state.player.x)
  return Boolean(dash?.accel && dash.direction === state.player.facing && gap > CONTACT_GAP)
}

/** Appends the player's new contact, if this frame produced one; returns the impact seen. */
function recordContact(state: FightState, seen: number, contacts: SignatureContact[]): number {
  const impact = state.impact
  if (!impact || impact.sequence === seen) return seen
  if (impact.attacker === 'player')
    contacts.push({
      move: state.player.attack?.moveId,
      combo: impact.comboHits ?? 0,
      blocked: Boolean(impact.blocked),
    })
  return impact.sequence
}
