import { createCombatRouteFight, combatRouteAction, combatRouteInput } from './combatRouteFight'
import { comboAdmissionBody } from './comboAuraCost'
import { performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { canStartFighterAttack } from './fighterAttacks'
import { attackPhase } from './frameData'
import { moveForSlot } from './movesets'
import { performTrainingAction } from './trainingAction'
import { setTrainingResources } from './trainingSession'
import {
  signatureHits,
  type SignatureCombo,
  type SignaturePreparationStep,
} from './signatureCombos'
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
  let state = playSignatureSteps(steps, hits, start).state
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
export function playSignatureCombo(combo: SignatureCombo, start: FightState): SignatureRun {
  return playSignatureSteps(combo.steps, signatureHits(combo).length, start)
}

/** Steps are played in order; the run ends once every step ran and `hits` contacts landed. */
export function playSignatureSteps(
  steps: readonly SignaturePreparationStep[],
  hits: number,
  start: FightState,
): SignatureRun {
  let cursor: Cursor = { state: start, index: 0, tap: -1 }
  let lastImpact = start.impact?.sequence ?? 0
  const contacts: SignatureContact[] = []
  const shots = new Map<number, string>()
  const finished = () => cursor.index >= steps.length && contacts.length >= hits
  for (let frame = 0; frame < MAX_FRAMES && !finished(); frame++) {
    const step = steps[cursor.index]
    const { cursor: next, input } = step ? attempt(cursor, step) : { cursor, input: EMPTY_INPUT }
    const state = tickFight(next.state, input, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard: contacts.length > 0 },
    })
    cursor = { ...next, state }
    labelShots(state, shots)
    lastImpact = recordContact(state, lastImpact, { contacts, shots })
  }
  return { state: cursor.state, contacts, reached: cursor.index }
}

function attempt(
  cursor: Cursor,
  step: SignaturePreparationStep,
): { cursor: Cursor; input: FightInput } {
  if ('dash' in step) return dashFrame(cursor, step.dash)
  const state = cursor.state
  let after = state
  if ('move' in step) after = startMove(state, step.move)
  else if ('ranged' in step) after = fire(state, 'player')
  else if ('incoming' in step) after = incoming(state)
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

/** The ordinary ranged command; unchanged state when the engine refuses it. */
function fire(state: FightState, side: 'player' | 'opponent'): FightState {
  const after = performAuraAttack({ state, side, kind: 'ranged', auraCharged: false })
  const started = after[side].attack?.kind === 'ranged' && after[side].attack !== state[side].attack
  return started ? after : state
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

/** Appends the player's new contact, if this frame produced one; returns the impact seen. */
function recordContact(
  state: FightState,
  seen: number,
  record: { contacts: SignatureContact[]; shots: Map<number, string> },
): number {
  const impact = state.impact
  if (!impact || impact.sequence === seen) return seen
  if (impact.attacker === 'player')
    record.contacts.push({
      move: contactMove(state, record.shots),
      combo: impact.comboHits ?? 0,
      blocked: Boolean(impact.blocked),
    })
  return impact.sequence
}
