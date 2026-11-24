import { retainSoundContacts } from './audio/impactHistory'
import { nativeRecoveryCounter } from './recoveryCounterAction'
import { stepDeathMatchFight } from './heavensDeathMatch/fightBridge'
import { movesetFor } from './movesets'
import { nativeNenCombo } from './nativeNenCombo'
import { reservingAura } from './combatIntentPolicy'
import { performArsenalAction } from './arsenalExecution'
import { priorityBusyAi } from './priorityArsenalAi'
import { judgmentActionBreach } from './judgmentAction'
import { retrospectiveAiAction, hisokaInterceptionAi } from './retrospectiveAi'
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
import { canAct, canMove, auraAttackBodyFree } from './fightActorState'
import { biohazardBodyFree } from './biohazard'
import { performPreparedAction } from './preparationActions'
import { preparationCheck } from './preparationRequirements'
import { resolveCrossGameCommand } from './crossGameAction'
import { padailleBoundAction, padailleEscapeAi } from './padailleEscape'
import { luiniArsenalAi } from './luiniArsenal'
import { crossGameBusy } from './crossGame'
import { planOpponentNen } from './opponentNenPlan'
import { projectileDefenceHolds } from './projectileDefence'
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
import { performFuturePerceptionAction } from './futurePerception'
import type { FutureControls } from './parallelFutureTypes'
import { characterMoveOverride, routedFightMove } from './fightMoveSelection'
import { performDirectionalChain } from './directionalChainCommand'
import { pursuitAttackAllowed } from './airPursuitCommand'
import { moonlightAiBareHands, resolveMoonlightAction } from './moonlightAction'
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
import { applyRivalryRules } from './rivalryRules'
import { capturePositions } from './fightInterpolation'
import { EMPTY_INPUT } from './types'
import { stepActors } from './duelStep/actors'
import { resolveContextInput } from './contextInput'
import { applyOnContext, canSwearOn } from './onTechnique'
import { flushDirectMoves } from './directFightBuffer'
import { performChrolloBookAction, pickChrolloFlipSlot } from './chrolloBookAction'
import { CHROLLO_STEAL } from './chrolloBook'
import { revealBookSlot } from './chrolloDeck'
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
export { nextFightRound as nextRound }
export { releaseTsk17, canReleaseTsk17 } from './tsk17'

export function createFight(...args: Parameters<typeof createFightState>): FightState {
  return applyRivalryRules(createFightState(...args))
}

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
    next = stepDeathMatchFight({ ...next, previousPositions }, performAttack)
    if (next.phase === 'finished') {
      next = reconcileBattleCantabile(reconcileMelodySound(next))
      next = { ...next, player: wakeHanzoBody(next.player), opponent: wakeHanzoBody(next.opponent) }
    }
    next = retainSoundContacts(beforeFrame, next)
    settings.onFrame?.(beforeFrame, next)
  }
  return advanceEasterEggs(next, false)
}

function simulateFightFrame(state: FightState, controls: FutureControls): FightState {
  return simulateClashFrame(state, controls, {
    step: stepFight,
    decide: opponentAttack,
    attack: (state, action, input) =>
      performTrainingAction({ state, side: 'opponent', action, input }),
  })
}

/** One frame: shared clocks, per-body step, then contacts between the pair (duelStep/). */
function stepFight(state: FightState, input: FightInput, opponentInput?: FightInput): FightState {
  state = flushDirectMoves(state, performTrainingAction)
  const inputs = {
    player: resolveContextInput(state, 'player', input),
    opponent: opponentInput ? resolveContextInput(state, 'opponent', opponentInput) : undefined,
  }
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
  const perception = performFuturePerceptionAction(options.state, options.side, (state) =>
    performMove({ ...options, state }),
  )
  if (perception) return perception
  if (options.state[options.side].arenaRecovery) return options.state
  if (options.state[options.side].easterEgg) return options.state
  if (!biohazardBodyFree(options.state[options.side])) return options.state
  if (!illumiBodyFree(options.state[options.side])) return options.state
  if (maryHeld(options.state[options.side])) return options.state
  if (crossGameBusy(options.state[options.side])) return options.state
  if (options.state[options.side].chrolloBook?.isFlipping) {
    const slot = options.action === 'light' ? 0 : options.action === 'heavy' ? 1 : null
    if (slot !== null)
      return pickChrolloFlipSlot(options.state, options.side, slot) ?? options.state
  }
  const chrollo = options.state[options.side]
  if (
    options.action === 'special' &&
    chrollo.id === 'chrollo' &&
    chrollo.chrolloBook?.stolenPage &&
    options.input &&
    (chrollo.facing === 1
      ? options.input.right && !options.input.left
      : options.input.left && !options.input.right) &&
    !options.input.down
  ) {
    const flipped = performChrolloBookAction({
      state: options.state,
      side: options.side,
      kind: 'special',
      moveId: CHROLLO_STEAL,
    })
    if (flipped) return flipped
  }
  if (
    options.action === 'special' &&
    !options.input?.directControls &&
    options.input?.aura &&
    canSwearOn(options.state[options.side])
  ) {
    const sworn = applyOnContext(options.state[options.side], { ...options.input, hatsu: true })
    if (sworn) return { ...options.state, [options.side]: sworn }
  }
  const executed = resolveCrossGameCommand(options.state, executeFightMove(options), options.side)
  return revealUsedChrolloSlot(executed, options.side, options.action)
}

function revealUsedChrolloSlot(state: FightState, side: FightSide, action: MoveAction): FightState {
  const book = state[side].chrolloBook
  if (!book || (action !== 'special' && action !== 'finisher')) return state
  const slot =
    action === 'finisher'
      ? (book.bookmarkSlot ?? null)
      : book.open
        ? (book.openSlot ?? null)
        : (book.bookmarkSlot ?? null)
  const revealed = revealBookSlot(book, slot)
  return revealed === book ? state : { ...state, [side]: { ...state[side], chrolloBook: revealed } }
}

function executeFightMove(options: PerformMoveOptions): FightState {
  const { state, side, action, input = EMPTY_INPUT } = options
  if (state.catsName) return state
  if (!futureAcceptsMove(state, side)) return state
  const chain = performDirectionalChain({ state, side, action, input }, performAuraAttack)
  if (chain) return chain
  const selected = moveForAction(state[side], action, input)
  const override = characterMoveOverride(
    { state, side, action, input },
    selected,
    performAuraAttack,
  )
  if (override) return override
  const move = routedFightMove(state[side], selected)
  if (!move) {
    if (action === 'throw') return performLegacyThrow(state, side, input)
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
  const perception = performFuturePerceptionAction(options.state, options.side, (state) =>
    performAuraAttack({ ...options, state }),
  )
  if (perception) return perception
  if (!pursuitAttackAllowed(options)) return options.state
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

export const opponentAttack = (state: FightState): FightState => {
  // The historical hall has its own frame-by-frame plans for Chrollo and CPU Hisoka.
  // Letting the generic duel AI run too makes it spend frames on Ken and blocks the
  // canonical feints, retreats and surprise strikes executed after the duel frame.
  if (state.deathMatch) return state
  return (
    hisokaInterceptionAi(state) ??
    (projectileDefenceHolds(state)
      ? state
      : (priorityBusyAi(state, performAuraAttack) ??
        maryAiAction(state, performAuraAttack) ??
        intentionalOpponentAttack(state)))
  )
}

function intentionalOpponentAttack(state: FightState): FightState {
  const counter = nativeRecoveryCounter(state, performAuraAttack)
  if (counter) return counter
  // Bare strikes cost no aura, so a bare-hands pact keeps the AI fighting even while it recovers.
  const bareHands = fightAcceptsCommands(state) && moonlightAiBareHands(state, aiBareStrike)
  if (bareHands) return bareHands
  return reservingAura(state.opponent) ? planOpponentNen(state) : contextualOpponentAttack(state)
}

function aiBareStrike(state: FightState, kind: 'light' | 'heavy'): FightState {
  return performAttack(state, 'opponent', kind)
}

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
  return nativeNenCombo(planned, performAuraAttack) ?? availableOpponentAttack(planned)
}

function availableOpponentAttack(planned: FightState): FightState {
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
  if (movesetFor(rolled.opponent.id)) return rolled
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

export function performThrow(
  state: FightState,
  side: FightSide,
  input: FightInput = EMPTY_INPUT,
): FightState {
  const perception = performFuturePerceptionAction(state, side, (current) =>
    performThrow(current, side, input),
  )
  if (perception) return perception
  if (state[side].easterEgg) return state
  if (state[side].cyclotronWindup) return state
  if (!futureAcceptsMove(state, side) || state[side].parallelEyesClosed) return state
  if (state.catsName) return state
  const move = moveForAction(state[side], 'throw', input)
  if (move) return performMove({ state, side, action: 'throw', input })
  return performLegacyThrow(state, side, input)
}

function performLegacyThrow(state: FightState, side: FightSide, input: FightInput): FightState {
  const fighter = state[side]
  if (fighter.y > 0) return state
  if (!canMove(fighter)) return state
  return performAuraAttack({
    state,
    side,
    kind: 'heavy',
    variant: 'throw',
    auraCharged: input.aura,
  })
}
