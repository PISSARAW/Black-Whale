import { thetaFirearmOptions } from './thetaFirearm'
import { resolveMoonlightAction, performMoonlightAction } from './moonlightAction'
import { moonlightAiResponse, moonlightAiWaiting } from './moonlightContract'
import { characterMoveOverride, routedFightMove } from './fightMoveSelection'
import { advanceEmperorClock, kurapikaAiActivation, performKurapikaAction, resolveJudgmentDeaths } from './kurapikaActions'
import { chainsImmobilize } from './kurapika'
import { withDolphinIdentity } from './kurapikaDolphin'
import { recordFightInjuries } from './feitanPain'
import { hisokaTechnique, hisokaTechniqueAllowed } from './hisokaTechnique'
import { commitAuraAttack, type AuraAttackOptions } from './auraAttackAction'
import { performLeorioAction } from './leorioAttack'
import { performLsdfAction } from './lsdfAction'
import { performBiscuitFormAction } from './biscuitFormAction'
import { callHanzoBody, canCallHanzoBody, resolveHanzoBodyCalls } from './hanzoBodyCall'
import { performProjectionAction } from './hanzoProjectionAction'
import {
  canRejoinHanzoBody,
  projectionPreparing,
  sleepingBody,
  steerHanzoProjection,
  wakeHanzoBody,
} from './hanzoProjection'
import { performChrolloBookAction } from './chrolloBookAction'
import { attackVariant } from './duelMoves'
import { FIGHT_FPS, FIXED_STEP } from './fightClock'
import { fightFormat } from './formats'
import {
  advanceHatsuFrames,
  canUseFightHatsu,
  FIGHT_HATSU_AURA_COST,
  hatsuSourceFor,
} from './hatsu'
import { chooseStyleAttack, fightingStyle } from './fightStyles'
import { applyAuraContext, IN_CHARGE_FRAMES, setIn } from './nen'
import { opponentWantsOn, resolveOnImpacts } from './onTechnique'
import { fighterDefinition } from './roster'
import { moveOpponent } from './opponentMovement'
import { advanceProjectiles, canUseRangedAttack, spawnRangedProjectiles } from './projectiles'
import { finishFight, resolveFightImpacts, TOWER_WIN_SCORE } from './combatImpact'
import { chooseMovesetAttack } from './movesetAi'
import { canUseMovesetMove, moveForAction, moveById } from './movesets'
import { createFightState, nextFightRound } from './fightState'
import { advanceFighterPhysics, separateFighterPushboxes } from './fighterPhysics'
import { steerFighter } from './fighterMovement'
import { capturePositions } from './fightInterpolation'
import { advanceAiCadence } from './aiCadence'
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

const GROUND = 0
const RYU_FOLLOW_UP_FRAMES = 10
export { TOWER_WIN_SCORE }
export { createFightState as createFight, nextFightRound as nextRound }
const IN_AURA_SURCHARGE = 12

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
    next = { ...stepFight(next, input, opponentInput), frameAccumulator: accumulator }
    next = { ...next, previousPositions }
    if (next.phase === 'finished') {
      next = { ...next, player: wakeHanzoBody(next.player), opponent: wakeHanzoBody(next.opponent) }
    }
    if (settings.ai && !opponentInput) next = advanceAiCadence(next, opponentAttack)
  }
  return next
}

function stepFight(state: FightState, input: FightInput, opponentInput?: FightInput): FightState {
  state = advanceEmperorClock(state)
  if (state.hitstop > 0) return { ...state, frame: state.frame + 1, hitstop: state.hitstop - 1 }
  const player = updatePlayer(state.player, input)
  const opponent = opponentInput
    ? updateControlledFighter(state.opponent, opponentInput)
    : updateOpponent(state.opponent, player)
  const judged = resolveJudgmentDeaths({ ...state, player, opponent })
  if (judged.phase === 'finished') return judged
  const buffered = flushBuffered(
    flushBuffered(
      resolveHanzoBodyCalls(judged, input, opponentInput),
      'player',
    ),
    'opponent',
  )
  const withHatsu = advanceHatsuFrames(buffered)
  if (withHatsu.phase === 'finished') return recordFightInjuries(state, withHatsu)
  const armed = withDolphinIdentity(withHatsu, spawnRangedProjectiles)
  const flight = advanceProjectiles(armed, FIXED_STEP)
  const resolved = recordFightInjuries(
    state,
    resolveOnImpacts(flight.state, resolveFightImpacts(flight.state, flight.hits)),
  )
  if (resolved.phase === 'finished') return resolved
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
  return remainingFrames === 0 && state.mode !== 'training' ? finishByTime(next) : next
}

function updatePlayer(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  return updateControlledFighter(fighter, input)
}

function updateControlledFighter(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const advanced = advanceFighterPhysics(fighter)
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
  if (releasesIn(next, chargingHatsu)) next = setIn(next, false)
  return { ...next, hatsuChargeFrames }
}

function activatesIn(fighter: ArcadeFighter, charging: boolean, frames: number): boolean {
  return fighter.id === 'hisoka' && charging && frames >= IN_CHARGE_FRAMES
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

function playerCanJump(fighter: ArcadeFighter, input: FightInput): boolean {
  return input.jump && !input.aura && canMove(fighter) && fighter.y === GROUND
}

function updateOpponent(fighter: ArcadeFighter, player: ArcadeFighter): ArcadeFighter {
  const advanced = advanceFighterPhysics(fighter)
  if (advanced.hanzoProjection && canRejoinHanzoBody(advanced) && advanced.aura < 16)
    return wakeHanzoBody(advanced)
  return poseFighter(moveOpponent(advanced, sleepingBody(player)))
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
  const { state, side, action, input = EMPTY_INPUT } = options
  const selected = moveForAction(state[side], action, input)
  const override = characterMoveOverride({ state, side, action, input }, selected, performAuraAttack)
  if (override) return override
  const move = routedFightMove(state[side], selected)
  if (!move) {
    if (action === 'throw') return performLegacyThrow(state, side)
    if (action === 'finisher') return state
    return performAuraAttack({ state, side, kind: action, auraCharged: input.aura })
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
  options = thetaFirearmOptions(options)
  return resolveMoonlightAction(options.state, executeAuraAttack(options), options.side)
}

function executeAuraAttack(options: AuraAttackOptions): FightState {
  const { side, kind } = options
  if (options.state.phase !== 'fighting') return options.state
  const original = options.state[side]
  const chains = performKurapikaAction(options, performAuraAttack)
  if (chains) return chains
  const book = performChrolloBookAction(options)
  if (book) return book
  if (kind === 'special' && !hisokaTechniqueAllowed(options.state, side, options.moveId))
    return options.state
  const form = performBiscuitFormAction(options)
  if (form) return form
  const remote = performLeorioAction(options, performAuraAttack)
  if (remote) return remote
  const utility = performUtilityHatsu(options)
  if (utility) return utility
  const variant = attackVariant({ fighter: original, kind, variant: options.variant })
  return commitAuraAttack({ ...options, variant }, attackIntent(original, kind, options.moveId))
}

function attackIntent(fighter: ArcadeFighter, kind: AttackKind, moveId?: string) {
  const move = moveById(moveId)
  const usesHatsu = move ? ['special', 'finisher'].includes(move.category) : kind === 'special'
  return {
    hatsuSource: usesHatsu ? hatsuSourceFor(fighter, moveId) : null,
    concealed: concealedHatsu(fighter, kind, moveId),
    resourceReady: move ? fighter.aura >= move.auraCost : attackResourceReady(fighter, kind),
  }
}

function concealedHatsu(fighter: ArcadeFighter, kind: AttackKind, moveId?: string): boolean {
  return (
    kind === 'special' &&
    fighter.id === 'hisoka' &&
    hisokaTechnique(fighter, moveId) === 'attach' &&
    fighter.hatsuChargeFrames >= IN_CHARGE_FRAMES &&
    fighter.aura >= FIGHT_HATSU_AURA_COST + IN_AURA_SURCHARGE
  )
}

function attackResourceReady(fighter: ArcadeFighter, kind: AttackKind): boolean {
  if (kind === 'special') return canUseFightHatsu(fighter)
  if (kind === 'ranged') return canUseRangedAttack(fighter)
  return true
}

export function opponentAttack(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  state = moonlightAiResponse(state)
  return moonlightAiWaiting(state) ? state : ordinaryOpponentAttack(state)
}

function ordinaryOpponentAttack(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  const emperor = kurapikaAiActivation(state)
  if (emperor) return emperor
  if (canCallHanzoBody(state, 'opponent')) return callHanzoBody(state, 'opponent')
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
    canSpecial: canUseFightHatsu(rolled.opponent) && gap <= definition.specialRange,
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

function planOpponentNen(state: FightState): FightState {
  const gap = Math.abs(state.player.x - state.opponent.x)
  const opponent = state.opponent
  if (opponent.judgmentChain || chainsImmobilize(opponent))
    return applyOpponentAura(state, { aura: true, down: true })
  if (opponent.hanzoProjection) return state
  if (needsZetsu(opponent)) return applyOpponentAura(state, { aura: true, down: true })
  if (canLeaveZetsu(opponent)) return applyOpponentAura(state, {})
  if (opponentWantsOn(opponent)) return applyOpponentAura(state, { aura: true, hatsu: true })
  if (needsKen(state, gap)) return applyOpponentAura(state, { aura: true, guard: true })
  return wantsRen(opponent, gap) ? applyOpponentAura(state, { aura: true }) : state
}

function applyOpponentAura(
  state: FightState,
  partial: Partial<Pick<FightInput, 'aura' | 'down' | 'guard' | 'jump' | 'hatsu'>>,
): FightState {
  const input = { ...EMPTY_INPUT, ...partial }
  return { ...state, opponent: applyAuraContext(state.opponent, input) }
}

const needsZetsu = (fighter: ArcadeFighter) => fighter.aura < 16 && fighter.nen.mode !== 'zetsu'
const canLeaveZetsu = (fighter: ArcadeFighter) => fighter.nen.mode === 'zetsu' && fighter.aura > 48
const needsKen = (state: FightState, gap: number) =>
  gap < 18 &&
  state.opponent.aura > 28 &&
  !state.opponent.nen.ken &&
  ['heavy', 'special'].includes(state.player.pose)
const wantsRen = (fighter: ArcadeFighter, gap: number) =>
  gap < 12 && fighter.aura > 55 && fighter.nen.mode === 'ten'

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
    return { ...state, phase: 'finished', winner: 'draw', finishReason: 'time' }
  }
  return finishFight(
    state,
    state.player.health > state.opponent.health ? 'player' : 'opponent',
    'time',
  )
}

function poseFighter(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.health <= 0) return { ...fighter, pose: 'ko', blocking: false }
  if (fighter.knockdownFrames > 0) return { ...fighter, pose: 'down', blocking: false }
  if (fighter.wakeupInvulnerableFrames > 0 && !fighter.attack)
    return { ...fighter, pose: 'wakeup', blocking: false }
  if (fighter.hitStun > 0) return { ...fighter, pose: 'hit', blocking: false }
  if (fighter.attack) return { ...fighter, pose: fighter.attack.kind, blocking: false }
  if (fighter.y > GROUND) return { ...fighter, pose: 'jump', blocking: false }
  if (fighter.blocking || fighter.blockStun > 0) return { ...fighter, pose: 'guard' }
  return fighter
}

function canAct(fighter: ArcadeFighter): boolean {
  return (
    !chainsImmobilize(fighter) &&
    !projectionPreparing(fighter) &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.health > 0
  )
}

function canMove(fighter: ArcadeFighter): boolean {
  return canAct(fighter) && fighter.attack === null
}

function canGuard(fighter: ArcadeFighter): boolean {
  return (
    !chainsImmobilize(fighter) &&
    fighter.y === GROUND &&
    fighter.hitStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.health > 0 &&
    fighter.attack === null
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

function performUtilityHatsu(options: Parameters<typeof performAuraAttack>[0]): FightState | null {
  return performMoonlightAction(options) ?? performLsdfAction(options) ?? performProjectionAction(options)
}
