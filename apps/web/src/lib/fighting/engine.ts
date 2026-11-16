import { attackIntent } from './fightAttackIntent'
import { nenActionAllowed } from './nenActionRules'
import { parallelFutureAiAction, steerFutureAi } from './parallelFutureAi'
import { advanceEasterEggs } from './easterEggs'
import { illumiBodyFree } from './illumiState'
import { illumiInput } from './illumiFrame'
import { poseFighter } from './fightActorPose'
import { holdMary, maryHeld } from './bloodyMary'
import { maryAiAction, maryAiBusy, maryAiBody } from './bloodyMaryAi'
import { resolveFighterSpeech } from './battleConversation'
import { reconcileBattleCantabile } from './battleCantabileFrame'
import { battleInput, battlePreparing } from './battleCantabileRules'
import { canAct, canMove, canGuard, playerCanJump } from './fightActorState'
import { biohazardBodyFree } from './biohazard'
import { performPreparedAction } from './preparationActions'
import { advancePreparation } from './preparationSimulation'
import { preparationCheck } from './preparationRequirements'
import { blinkyAiDefense } from './blinkyWounds'
import { plugWoundsInput } from './blinky'
import { resolveCrossGameCommand, resolveCrossGameMovement } from './crossGameAction'
import { crossGameBusy } from './crossGame'
import { planOpponentNen } from './opponentNenPlan'
import { steerCyclotron } from './phinksCyclotron'
import { cyclotronAiAction } from './phinksAction'
import { stepPostMortemOrFuture } from './camillaFrame'
import { advancePredatorClock } from './predatorSeal'
import { resolvePredatorThreats } from './predatorCombat'
import { performMelodyAction } from './melodyAction'
import { melodyInput, reconcileMelodySound, stopMelodyMusic } from './melodyChannel'
import { advanceMelodyHearing } from './melodyHearing'
import { MELODY_MUSIC_RANGE, soundDistance } from './melodyRules'
import { fightStyleSpecialReady } from './fightStyleSpecial'
import { thetaFirearmOptions } from './thetaFirearm'
import { advanceCatsName } from './camillaCat'
import { fightAcceptsCommands, fightResolutionPending } from './fightOutcome'
import { futurePerceivedTarget, stepParallelFuture } from './parallelFuture'
import { closeFutureEyes, futureAcceptsMove } from './parallelFutureAbility'
import type { FutureControls } from './parallelFutureTypes'
import { characterMoveOverride, routedFightMove } from './fightMoveSelection'
import { resolveMoonlightAction } from './moonlightAction'
import { characterAuraAction } from './characterAuraAction'
import { moonlightAiResponse, moonlightAiWaiting } from './moonlightContract'
import { callHanzoBody, canCallHanzoBody } from './hanzoBodyCall'
import { advanceEmperorClock, kurapikaAiActivation, resolveJudgmentDeaths } from './kurapikaActions'
import { withDolphinIdentity } from './kurapikaDolphin'
import { recordFightInjuries } from './feitanPain'
import { commitAuraAttack, type AuraAttackOptions } from './auraAttackAction'
import {
  canRejoinHanzoBody,
  sleepingBody,
  steerHanzoProjection,
  wakeHanzoBody,
} from './hanzoProjection'
import { attackVariant } from './duelMoves'
import { FIGHT_FPS, FIXED_STEP } from './fightClock'
import { fightFormat } from './formats'
import { advanceHatsuFrames } from './hatsu'
import { chooseStyleAttack, fightingStyle } from './fightStyles'
import { applyAuraContext, IN_CHARGE_FRAMES, setIn } from './nen'
import { resolveOnImpacts } from './onTechnique'
import { fighterDefinition } from './roster'
import { moveOpponent } from './opponentMovement'
import { advanceProjectiles, canUseRangedAttack, spawnRangedProjectiles } from './projectiles'
import { finishFight, resolveFightImpacts, TOWER_WIN_SCORE } from './combatImpact'
import { chooseMovesetAttack } from './movesetAi'
import { canUseMovesetMove, moveForAction } from './movesets'
import { createFightState, nextFightRound } from './fightState'
import { advanceFighterPhysics, separateFighterPushboxes } from './fighterPhysics'
import { steerFighter } from './fighterMovement'
import { capturePositions } from './fightInterpolation'
import { simulateVoconteDoorFrame } from './voconteDoorFrame'
import { EMPTY_INPUT } from './types'
import type {
  ArcadeFighter,
  AttackKind,
  FightInput,
  FightSide,
  FightState,
  FighterPose,
  MoveAction,
} from './types'
const RYU_FOLLOW_UP_FRAMES = 10
export { TOWER_WIN_SCORE }
export { createFightState as createFight, nextFightRound as nextRound }
export function beginFight(state: FightState): FightState {
  return state.phase === 'ready' ? { ...state, phase: 'fighting' } : state
}
export function tickFight(
  state: FightState,
  input: FightInput,
  options: number | { dt: number; opponentInput?: FightInput; ai?: boolean },
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
    const accumulator = next.frameAccumulator - FIXED_STEP
    const previousPositions = capturePositions(next)
    next = {
      ...stepPostMortemOrFuture(next, () =>
        stepParallelFuture(
          next,
          { player: input, opponent: opponentInput, ai: settings.ai ?? false },
          {
            simulate: simulateFightFrame,
            replay: (current, command) =>
              performAuraAttack({
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
  }
  return advanceEasterEggs(next, false)
}

function simulateFightFrame(state: FightState, controls: FutureControls): FightState {
  return advanceEasterEggs(
    simulateVoconteDoorFrame(state, controls, { step: stepFight, decide: opponentAttack }),
    state.hitstop === 0,
  )
}

function stepFight(state: FightState, input: FightInput, opponentInput?: FightInput): FightState {
  state = advancePredatorClock(state)
  if (state.catsName) return advanceCatsName(state)
  state = advanceEmperorClock(state)
  if (state.hitstop > 0) return { ...state, frame: state.frame + 1, hitstop: state.hitstop - 1 }
  state = advancePreparation(state, { player: input, opponent: opponentInput })
  const player = updateControlledFighter(state.player, input)
  const opponent = opponentInput
    ? updateControlledFighter(state.opponent, opponentInput)
    : updateOpponent(state.opponent, futurePerceivedTarget(state, 'opponent', player), state)
  const judged = resolveJudgmentDeaths(
    resolveCrossGameMovement(state, { ...state, player, opponent }),
  )
  if (fightResolutionPending(judged)) return judged
  const buffered = flushBuffered(
    flushBuffered(resolveFighterSpeech(judged, input, opponentInput), 'player'),
    'opponent',
  )
  const withHatsu = advanceMelodyHearing(advanceHatsuFrames(buffered))
  if (fightResolutionPending(withHatsu)) return recordFightInjuries(state, withHatsu)
  const armed = withDolphinIdentity(withHatsu, spawnRangedProjectiles)
  const flight = advanceProjectiles(resolvePredatorThreats(armed), FIXED_STEP)
  const resolved = reconcileBattleCantabile(
    reconcileMelodySound(
      recordFightInjuries(
        state,
        resolveOnImpacts(flight.state, resolveFightImpacts(flight.state, flight.hits)),
      ),
    ),
  )
  if (fightResolutionPending(resolved)) return resolved
  const separated = separateFighterPushboxes(resolved.player, resolved.opponent)
  const remainingFrames =
    state.mode === 'training' ? state.remainingFrames : Math.max(0, state.remainingFrames - 1)
  const next = {
    ...resolved,
    ...separated,
    frame: state.frame + 1,
    remainingFrames,
    time: remainingFrames / FIGHT_FPS,
  }
  return reconcileBattleCantabile(
    reconcileMelodySound(
      remainingFrames === 0 && state.mode !== 'training' ? finishByTime(next) : next,
    ),
  )
}

function updateControlledFighter(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  if (fighter.easterEgg) return poseFighter(advanceFighterPhysics(fighter))
  fighter = illumiInput(fighter, input)
  const advanced = advanceFighterPhysics(
    plugWoundsInput(battleInput(melodyInput(fighter, input), input), input),
  )
  if (advanced.needlePuppet) return advanced
  if (maryHeld(advanced)) return holdMary(applyAuraContext(advanced, input))
  if (advanced.parallelEyesClosed) return closeFutureEyes(advanced)
  const winding = steerCyclotron(advanced, input)
  if (winding) return winding
  if (advanced.hanzoProjection) return poseFighter(steerHanzoProjection(advanced, input))
  let next = updateHatsuCharge(applyAuraContext(advanced, input), input)
  next = updatePlayerGuard({ ...next, crouching: input.down && next.y === 0 }, input)
  const steered = steerFighter(next, {
    input,
    mobile: canMove(next),
    jumpable: playerCanJump(next, input),
  })
  return poseFighter(steered)
}

function updateHatsuCharge(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  let next = fighter
  const chargingHatsu = input.hatsu && canAct(next) && next.attack === null
  const hatsuChargeFrames = chargingHatsu ? next.hatsuChargeFrames + 1 : next.hatsuChargeFrames
  if (activatesIn(next, chargingHatsu, hatsuChargeFrames)) next = setIn(next, true)
  if (!input.conceal && releasesIn(next, chargingHatsu)) next = setIn(next, false)
  return { ...next, hatsuChargeFrames }
}

function activatesIn(fighter: ArcadeFighter, charging: boolean, frames: number): boolean {
  return charging && frames >= IN_CHARGE_FRAMES
}

function releasesIn(fighter: ArcadeFighter, charging: boolean): boolean {
  return !charging && !fighter.attack?.concealed && fighter.nen.in
}

function updatePlayerGuard(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const next = fighter
  const blocking = playerIsBlocking(next, input)
  const releasedGuard = next.blocking && !blocking
  return {
    ...next,
    blocking,
    guardFrames: blocking ? (next.blocking ? next.guardFrames + 1 : 1) : 0,
    ryuWindow: releasedGuard ? RYU_FOLLOW_UP_FRAMES : next.ryuWindow,
  }
}

function playerIsBlocking(fighter: ArcadeFighter, input: FightInput): boolean {
  if (!input.guard) return false
  if (!canGuard(fighter)) return false
  return !input.aura || fighter.nen.ken
}

function updateOpponent(
  fighter: ArcadeFighter,
  player: ArcadeFighter,
  state: FightState,
): ArcadeFighter {
  const advanced = blinkyAiDefense(state, advanceFighterPhysics(fighter))
  if (advanced.easterEgg) return poseFighter(advanced)
  if (advanced.needlePuppet) return advanced
  if (maryAiBusy(advanced)) return maryAiBody(advanced)
  if (battlePreparing(advanced)) return { ...advanced, pose: 'special', blocking: false }
  const winding = steerCyclotron(advanced)
  if (winding) return winding
  if (advanced.parallelEyesClosed) return closeFutureEyes(advanced)
  if (advanced.hanzoProjection && canRejoinHanzoBody(advanced) && advanced.aura < 16)
    return wakeHanzoBody(advanced)
  return poseFighter(steerFutureAi(state, advanced) ?? moveOpponent(advanced, sleepingBody(player)))
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
  if (!futureAcceptsMove(state, side)) return state
  const selected = moveForAction(state[side], action, input)
  const override = characterMoveOverride(
    { state, side, action, input },
    selected,
    performAuraAttack,
  )
  if (override) return override
  const move = routedFightMove(state[side], selected)
  if (!move) {
    if (action === 'throw') return performLegacyThrow(state, side)
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
  if (options.state[options.side].easterEgg) return options.state
  if (!illumiBodyFree(options.state[options.side])) return options.state
  if (maryHeld(options.state[options.side])) return options.state
  options = thetaFirearmOptions(options)
  return resolveMoonlightAction(
    options.state,
    resolveCrossGameCommand(options.state, executeAuraAttack(options), options.side),
    options.side,
  )
}

function executeAuraAttack(options: AuraAttackOptions): FightState {
  if (!biohazardBodyFree(options.state[options.side])) return options.state
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
  maryAiAction(state, performAuraAttack) ?? contextualOpponentAttack(state)

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
  if (canCallHanzoBody(state, 'opponent')) return callHanzoBody(state, 'opponent')
  return ordinaryOpponentAttack(state)
}

function ordinaryOpponentAttack(state: FightState): FightState {
  const planned = planOpponentNen(state)
  if (!canAct(planned.opponent)) return planned
  const [rolled, chance] = randomValue(planned)
  const gap = Math.abs(sleepingBody(rolled.player).x - rolled.opponent.x)
  const definition = fighterDefinition(rolled.opponent.id)
  const style = fightingStyle(rolled.opponent.id)
  const movesetAttack = chooseMovesetAttack(rolled, chance, gap)
  if (movesetAttack) {
    return performAuraAttack({
      state: rolled,
      side: 'opponent',
      kind: movesetAttack.kind,
      variant: movesetAttack.variant,
      moveId: movesetAttack.id,
      auraCharged: false,
    })
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

function randomValue(state: FightState): [FightState, number] {
  const rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0
  return [{ ...state, rng }, rng / 0x100000000]
}

function finishByTime(state: FightState): FightState {
  const format = fightFormat(state.formatId)
  if (format.victory !== 'health' && state.score.player !== state.score.opponent) {
    return finishFight(
      state,
      state.score.player > state.score.opponent ? 'player' : 'opponent',
      'time',
    )
  }
  if (state.player.health === state.opponent.health) {
    return {
      ...state,
      phase: 'finished',
      winner: 'draw',
      finishReason: 'time',
    }
  }
  return finishFight(
    state,
    state.player.health > state.opponent.health ? 'player' : 'opponent',
    'time',
  )
}

export function displayPose(fighter: ArcadeFighter): FighterPose {
  return poseFighter(fighter).pose
}

function flushBuffered(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const intent = fighter.bufferedAttack
  if (!intent || fighter.attack || !canAct(fighter)) return state
  const cleared = { ...state, [side]: { ...fighter, bufferedAttack: null } }
  return performAuraAttack({ state: cleared, side, ...intent })
}

export function performThrow(state: FightState, side: FightSide): FightState {
  if (state[side].easterEgg) return state
  if (state[side].cyclotronWindup) return state
  if (!futureAcceptsMove(state, side) || state[side].parallelEyesClosed) return state
  if (state.catsName) return state
  const move = moveForAction(state[side], 'throw', EMPTY_INPUT)
  if (move) return performMove({ state, side, action: 'throw' })
  return performLegacyThrow(state, side)
}

function performLegacyThrow(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const marked = { ...state, [side]: { ...fighter, throwTechFrames: 8 } }
  if (fighter.y > 0) return state
  if (!canMove(fighter)) return marked
  return performAuraAttack({
    state: marked,
    side,
    kind: 'heavy',
    variant: 'throw',
    auraCharged: false,
  })
}
