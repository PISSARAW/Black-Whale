import { finishPhysicalFrame } from './physicalFrameClocks'
import { performLegacyThrow } from './legacyThrow'
import { expireHistoricalMatter } from './historicalMatterClock'
import { moveAdmitted } from './moveAdmission'
import { performArsenalAction } from './arsenalExecution'
import { priorityBusyAi } from './priorityArsenalAi'
import { judgmentActionBreach } from './judgmentAction'
import { retrospectiveAiAction } from './retrospectiveAi'
import { perceivedOpponentGap, opponentCanAttemptCall } from './opponentAwareness'
import { nativeArsenalAiAction } from './arsenalAiAction'
import { performOpponentArsenalMove } from './arsenalAiNen'
import { simulateClashFrame } from './fightFrameSimulation'
import { performTrainingAction } from './trainingAction'
import { attackIntent } from './fightAttackIntent'
import { nenActionAllowed } from './nenActionRules'
import { parallelFutureAiAction } from './parallelFutureAi'
import { advanceEasterEggs } from './easterEggs'
import { illumiBodyFree } from './illumiState'
import { performArenaAction, nearestArenaObject } from './arenaActions'
import { readArenaInputs } from './arenaSimulation'
import { poseFighter } from './fightActorPose'
import { maryHeld } from './bloodyMary'
import { maryAiAction } from './bloodyMaryAi'
import { reconcileBattleCantabile } from './battleCantabileFrame'
import { canAct, auraAttackBodyFree } from './fightActorState'
import { biohazardBodyFree } from './biohazard'
import { performPreparedAction } from './preparationActions'
import { preparationCheck } from './preparationRequirements'
import { resolveCrossGameCommand } from './crossGameAction'
import { padailleBoundAction, padailleEscapeAi } from './padailleEscape'
import { luiniArsenalAi } from './luiniArsenal'
import { crossGameBusy } from './crossGame'
import { planOpponentNen } from './opponentNenPlan'
import { cyclotronAiAction } from './phinksAction'
import { stepPostMortemOrFuture } from './camillaFrame'
import { performMelodyAction } from './melodyAction'
import { reconcileMelodySound, stopMelodyMusic } from './melodyChannel'
import { MELODY_MUSIC_RANGE, soundDistance } from './melodyRules'
import { fightStyleSpecialReady } from './fightStyleSpecial'
import { thetaFirearmOptions } from './thetaFirearm'
import { fightAcceptsCommands, fightResolutionPending } from './fightOutcome'
import { stepParallelFuture } from './parallelFuture'
import { futureAcceptsMove } from './parallelFutureAbility'
import type { FutureControls } from './parallelFutureTypes'
import { characterMoveOverride, routedFightMove } from './fightMoveSelection'
import { resolveMoonlightAction } from './moonlightAction'
import { characterAuraAction } from './characterAuraAction'
import { moonlightAiResponse, moonlightAiWaiting } from './moonlightContract'
import { callHanzoBody } from './hanzoBodyCall'
import { kurapikaAiActivation } from './kurapikaActions'
import { commitAuraAttack, type AuraAttackOptions } from './auraAttackAction'
import { wakeHanzoBody } from './hanzoProjection'
import { attackVariant } from './duelMoves'
import { FIGHT_FPS, FIXED_STEP } from './fightClock'
import { chooseStyleAttack, fightingStyle } from './fightStyles'
import { fighterDefinition } from './roster'
import { canUseRangedAttack } from './projectiles'
import { TOWER_WIN_SCORE } from './combatImpact'
import { chooseMovesetAttack } from './movesetAi'
import { canUseMovesetMove, moveForAction } from './movesets'
import { createFightState, nextFightRound } from './fightState'
import { capturePositions } from './fightInterpolation'
import { EMPTY_INPUT } from './types'
import { stepActors } from './duelStep/actors'
import { resolveContacts, settleBodies } from './duelStep/contacts'
import { closeFrame, openFrame } from './duelStep/frame'
import { resolveKameoFrameContacts, stepKameoFrame } from './kameos/frame'
import type {
  ArcadeFighter,
  AttackKind,
  FightInput,
  FightSide,
  FightState,
  FighterPose,
  MoveAction,
} from './types'

export { TOWER_WIN_SCORE }
export { createFightState as createFight, nextFightRound as nextRound }

export function beginFight(state: FightState): FightState {
  return state.phase === 'ready' ? { ...state, phase: 'fighting' } : state
}

export interface FightTickOptions {
  dt: number
  opponentInput?: FightInput
  ai?: boolean
  /** Observes completed real simulation frames; never speculative future branches. */
  onFrame?: (before: FightState, after: FightState) => void
}

export function tickFight(
  state: FightState,
  input: FightInput,
  options: number | FightTickOptions,
): FightState {
  const settings = typeof options === 'number' ? { dt: options } : options
  const { dt, opponentInput } = settings
  if (state.phase !== 'fighting') return state
  const remainingFrames = Math.min(state.remainingFrames, Math.ceil(state.time * FIGHT_FPS))
  let next = {
    ...state,
    remainingFrames,
    frameAccumulator: state.frameAccumulator + Math.min(dt, 0.1),
  }
  while (next.frameAccumulator >= FIXED_STEP && next.phase === 'fighting') {
    const beforeFrame = next
    const accumulator = next.frameAccumulator - FIXED_STEP
    const previousPositions = capturePositions(next)
    // A detached vision pauses simulation; its owner must still be able to open their eyes.
    next = readArenaInputs(next, { player: input, opponent: opponentInput }, (current, side) =>
      performArenaAction(current, side, performAuraAttack),
    )
    next = {
      ...stepPostMortemOrFuture(next, () =>
        stepParallelFuture(
          next,
          { player: input, opponent: opponentInput, ai: settings.ai ?? false },
          {
            simulate: simulateFightFrame,
            replay: (current, command) =>
              command.arsenal
                ? performArsenalAction(
                    { state: current, side: 'opponent', command: command.arsenal },
                    performAuraAttack,
                  )
                : performAuraAttack({
                    state: current,
                    side: 'opponent',
                    ...command,
                  }),
          },
        ),
      ),
      frameAccumulator: accumulator,
    }
    next = { ...next, previousPositions }
    if (next.phase === 'finished') {
      next = reconcileBattleCantabile(reconcileMelodySound(next))
      next = { ...next, player: wakeHanzoBody(next.player), opponent: wakeHanzoBody(next.opponent) }
    }
    settings.onFrame?.(beforeFrame, next)
  }
  return advanceEasterEggs(next, false)
}

function simulateFightFrame(state: FightState, controls: FutureControls): FightState {
  return finishPhysicalFrame(
    simulateClashFrame(state, controls, {
      step: stepFight,
      decide: opponentAttack,
      attack: (state, action, input) =>
        performTrainingAction({ state, side: 'opponent', action, input }),
    }),
  )
}

/** One frame: shared clocks, per-body step, then contacts between the pair (duelStep/). */
function stepFight(state: FightState, input: FightInput, opponentInput?: FightInput): FightState {
  const inputs = { player: input, opponent: opponentInput }
  const opened = openFrame(state, inputs, performAuraAttack)
  if (opened.pending) return opened.state
  const start = opened.state
  const moved = stepActors(start, inputs)
  const settled = settleBodies({ start, moved, inputs }, performAuraAttack)
  if (settled.pending) return settled.state
  const contacts = resolveContacts(start, stepKameoFrame(settled.state, inputs))
  if (contacts.pending) return contacts.state
  const supported = resolveKameoFrameContacts(contacts.state)
  return fightResolutionPending(supported) ? supported : closeFrame(start, supported)
}

export function performAttack(state: FightState, side: FightSide, kind: AttackKind): FightState {
  if (kind !== 'ranged') return performMove({ state, side, action: kind })
  return performAuraAttack({ state, side, kind, auraCharged: false })
}

interface PerformMoveOptions {
  state: FightState
  side: FightSide
  action: MoveAction
  input?: FightInput
}

export function performMove(options: PerformMoveOptions): FightState {
  if (options.state[options.side].arenaRecovery) return options.state
  if (options.state[options.side].easterEgg) return options.state
  if (!biohazardBodyFree(options.state[options.side])) return options.state
  if (!illumiBodyFree(options.state[options.side])) return options.state
  if (maryHeld(options.state[options.side])) return options.state
  if (crossGameBusy(options.state[options.side])) return options.state
  return resolveCrossGameCommand(options.state, executeFightMove(options), options.side)
}

function executeFightMove(options: PerformMoveOptions): FightState {
  const { state, side, action, input = EMPTY_INPUT } = options
  if (state.catsName) return state
  const selected = moveForAction(state[side], action, input)
  if (!moveAdmitted({ state, side, input, slot: selected?.slot })) return state
  const override = characterMoveOverride(
    { state, side, action, input },
    selected,
    performAuraAttack,
  )
  if (override) return override
  const move = routedFightMove(state[side], selected)
  if (!move) {
    if (action === 'throw') return performLegacyThrow(state, side, performAuraAttack)
    if (action === 'finisher') return state
    return performAuraAttack({
      state,
      side,
      kind: action,
      auraCharged: input.aura,
    })
  }
  if (!canUseMovesetMove(state, side, move)) return state
  return performAuraAttack({
    state,
    side,
    kind: move.kind,
    variant: move.variant,
    moveId: move.id,
    auraCharged: input.aura,
  })
}

export function performAuraAttack(options: AuraAttackOptions): FightState {
  options = { ...options, state: expireHistoricalMatter(options.state) }
  if (options.state[options.side].easterEgg) return options.state
  if (!illumiBodyFree(options.state[options.side])) return options.state
  if (maryHeld(options.state[options.side])) return options.state
  const breach = judgmentActionBreach(options)
  if (breach) return breach
  options = thetaFirearmOptions(options)
  return resolveMoonlightAction(
    options.state,
    resolveCrossGameCommand(options.state, executeAuraAttack(options), options.side),
    options.side,
  )
}

function executeAuraAttack(options: AuraAttackOptions): FightState {
  return padailleBoundAction(options, performAuraAttack) ?? executeUnboundAuraAttack(options)
}

function executeUnboundAuraAttack(options: AuraAttackOptions): FightState {
  if (!auraAttackBodyFree(options.state[options.side])) return options.state
  options = thetaFirearmOptions(options)
  const { side, kind } = options
  if (!fightAcceptsCommands(options.state)) return options.state
  if (!nenActionAllowed(options)) return options.state
  const original = options.state[side]
  if (crossGameBusy(original)) return options.state
  const prepared = performPreparedAction(options)
  if (prepared) return prepared
  if (kind === 'special' && !preparationCheck(options.state, side, options.moveId).ready)
    return options.state
  const music = performMelodyAction(options, performAuraAttack)
  if (music) return music
  const character = characterAuraAction(options, performAuraAttack)
  if (character) return character
  const variant = attackVariant({
    fighter: original,
    kind,
    variant: options.variant,
  })
  return commitAuraAttack({ ...options, variant }, attackIntent(original, kind, options.moveId))
}

export const opponentAttack = (state: FightState): FightState =>
  priorityBusyAi(state, performAuraAttack) ??
  maryAiAction(state, performAuraAttack) ??
  contextualOpponentAttack(state)

function contextualOpponentAttack(state: FightState): FightState {
  if (!fightAcceptsCommands(state)) return state
  if (state.opponent.melodyPerformance && fightAcceptsCommands(state))
    return soundDistance(state.opponent, state.player) > MELODY_MUSIC_RANGE
      ? stopMelodyMusic(state, 'opponent')
      : state
  state = moonlightAiResponse(state)
  if (moonlightAiWaiting(state)) return state
  const future = parallelFutureAiAction(state)
  if (future) return future
  const cyclotron = cyclotronAiAction(state)
  if (cyclotron) return cyclotron
  const emperor = kurapikaAiActivation(state)
  if (emperor) return emperor
  if (opponentCanAttemptCall(state)) return callHanzoBody(state, 'opponent')
  return ordinaryOpponentAttack(state)
}

function ordinaryOpponentAttack(state: FightState): FightState {
  return (
    luiniArsenalAi(state, performAuraAttack) ??
    padailleEscapeAi(state, performAuraAttack) ??
    unboundOpponentAttack(state)
  )
}

function unboundOpponentAttack(state: FightState): FightState {
  const planned = planOpponentNen(state)
  if (!canAct(planned.opponent)) return planned
  const retrospective = retrospectiveAiAction(planned, performAuraAttack)
  if (retrospective) return retrospective
  const native = nativeArsenalAiAction(planned, performAuraAttack)
  if (native) return native
  const terrain = opponentTerrainAction(planned)
  if (terrain) return terrain
  const [rolled, chance] = randomValue(planned)
  const gap = perceivedOpponentGap(rolled)
  if (!Number.isFinite(gap)) return rolled
  const definition = fighterDefinition(rolled.opponent.id)
  const style = fightingStyle(rolled.opponent.id)
  const movesetAttack = chooseMovesetAttack(rolled, chance, gap)
  if (movesetAttack) {
    return performOpponentArsenalMove(
      { state: rolled, move: movesetAttack, roll: chance },
      performAuraAttack,
    )
  }
  const attack = chooseStyleAttack(rolled.opponent.id, {
    canSpecial: fightStyleSpecialReady(rolled.opponent, gap, definition.specialRange),
    canRanged: canUseRangedAttack(rolled.opponent) && gap > style.preferredRange[1],
    inRange: gap <= definition.reach + 2,
    roll: chance,
  })
  return attack
    ? performAuraAttack({
        state: rolled,
        side: 'opponent',
        kind: attack,
        variant: chance < 0.25 ? 'low' : 'standing',
        auraCharged: false,
      })
    : rolled
}

function opponentTerrainAction(state: FightState): FightState | null {
  if (!state.arena || !nearestArenaObject(state, 'opponent', 14) || state.frame % 90 !== 0)
    return null
  const next = performArenaAction(state, 'opponent', performAuraAttack)
  return next === state ? null : next
}

function randomValue(state: FightState): [FightState, number] {
  const rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0
  return [{ ...state, rng }, rng / 0x100000000]
}

export function displayPose(fighter: ArcadeFighter): FighterPose {
  return poseFighter(fighter).pose
}

export function performThrow(state: FightState, side: FightSide): FightState {
  if (state[side].easterEgg) return state
  if (state[side].cyclotronWindup) return state
  if (!futureAcceptsMove(state, side) || state[side].parallelEyesClosed) return state
  if (state.catsName) return state
  const move = moveForAction(state[side], 'throw', EMPTY_INPUT)
  if (move) return performMove({ state, side, action: 'throw' })
  return performLegacyThrow(state, side, performAuraAttack)
}
