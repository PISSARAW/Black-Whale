import { declareMoveCombatRules } from './moveCombatRules'
import { canUseRangedAttack } from './projectiles'
import { selectedGumLink } from './bungeeNetwork'
import { nenActionAllowed } from './nenActionRules'
import { attackAuraCost } from './fightAttackCost'
import { tuneBeyondMoveset } from './beyondMoveset'
import { beyondCurseUnavailable } from './beyondCurseAction'
import { padailleMoveAvailable } from './padailleWeapon'
import { paperCommandReady, paperMoveAllowed } from './kallutoPaper'
import { tuneKallutoMoveset } from './kallutoMoveset'
import { illumiBodyFree } from './illumiState'
import { tuneVoconteMoveset } from './voconteMoveset'
import { voconteMoveResources } from './voconteDoorAction'
import { illumiMoveReadiness } from './illumiPresentation'
import { tuneBonolenovMoveset } from './bonolenovMovesetTuning'
import { tuneIllumiMoveset } from './illumiMoveset'
import { illumiResources } from './illumiAccess'
import { tuneMachiMoveset } from './machiMoveset'
import { machiBindReady } from './machiThread'
import { tuneZakuroMoveset, zakuroMoveReady } from './bloodyMaryMoveset'
import { bonolenovMoveAllowed, bonolenovResources } from './bonolenovMoveset'
import { tuneBiohazardMoveset, biohazardMoveResources } from './biohazardMoveset'
import { preparedSource, preparedActionReady } from './preparationActions'
import { tunePreparationMoveset } from './preparationMoveset'
import { preparationCheck } from './preparationRequirements'
import { canAskLynchQuestion } from './lynchRules'
import { tuneLynchMoveset } from './lynchMoveset'
import { blinkyBloodReady } from './blinky'
import { tuneBlinkyMoveset, blinkyMoveAllowed } from './blinkyMoveset'
import { tunePhinksMoveset } from './phinksMoveset'
import { cyclotronMoveResources } from './phinksAction'
import { cyclotronPunchReady } from './phinksCyclotron'
import { crossGameCanWarn } from './crossGame'
import { tuneGelMoveset } from './gelMoveset'
import { sealedSenseCount } from './saiyuSenses'
import { isPredatorMove, predatorNenAvailable, predatorReady } from './predator'
import { predatorNenLocked } from './predatorSeal'
import { tuneCamillaMoveset } from './camillaMoveset'
import { tuneThetaMoveset } from './thetaMoveset'
import { tuneMelodyMoveset } from './melodyMoveset'
import { melodyMoveResources } from './melodyRules'
import { thetaShotMove } from './thetaFirearm'
import { isErigeronAction } from './billSupport'
import { tuneParallelFutureMoveset } from './parallelFutureMoveset'
import { futureMoveResources } from './parallelFutureAbility'
import { healthPercent } from './health'
import { tuneBashoMoveset } from './bashoMoveset'
import { bashoCanWrite } from './bashoPoem'
import { tuneLonghiMoveset } from './longhiMoveset'
import { moonlightCanOffer } from './moonlightContract'
import { remotePunchAvailable } from './leorioAttack'
import { chrolloMoveAvailable, CHROLLO_SECONDARY } from './chrolloBook'
import { tuneChrolloMoveset } from './chrolloMoveset'
import { tuneKurapikaMoveset } from './kurapikaMoveset'
import { kurapikaMoveAvailable } from './kurapika'
import { tuneHisokaMoveset } from './hisokaMoveset'
import { musseMoveAvailable } from './secretWindow'
import { canActivateLsdf, isLsdfMove } from './lsdf'
import { sweetHomeAvailable, sweetHomeCanTouch } from './sweetHomeContacts'
import { furykovMoveAvailable, tuneFurykovMoveset } from './furykovMoveset'
import { tuneBenjaminMoveset } from './benjaminMoveset'
import { tuneFranklinMoveset } from './franklinMoveset'
import { franklinNenAvailable } from './franklinAttack'
import { benjaminMoveAvailable } from './benjaminBaton'
import { feitanMoveAvailable } from './feitanPain'
import { isBiscuitFormMove, isBiscuitTrueForm } from './biscuitForm'
import { hanzoMoveResources } from './hanzoProjection'
import { canUseHatsu } from '@black-whale/nen-engine'
import { hatsuSealedByOn } from './onTechnique'
import { moveId } from './movesetFactory'
import type { FighterMove, FighterMoveset } from './movesetTypes'
import { canonicalTechniqueAllowed } from './techniqueContracts'
import { WAVE_FOUR_MOVESETS_A } from './movesetWaveFourA'
import { WAVE_FOUR_MOVESETS_B } from './movesetWaveFourB'
import { ROSTER_FINAL_MOVESETS } from './movesetRosterFinal'
import { WAVE_ONE_MOVESETS_A } from './movesetWaveOneA'
import { WAVE_ONE_MOVESETS_B } from './movesetWaveOneB'
import { WAVE_THREE_MOVESETS_A } from './movesetWaveThreeA'
import { WAVE_THREE_MOVESETS_B } from './movesetWaveThreeB'
import { WAVE_TWO_MOVESETS_A } from './movesetWaveTwoA'
import { WAVE_TWO_MOVESETS_B } from './movesetWaveTwoB'
import type {
  ArcadeFighter,
  FightInput,
  FightSide,
  FightState,
  FighterId,
  MoveAction,
  MoveSlot,
} from './types'

const WAVE_ONE_MOVESETS = [...WAVE_ONE_MOVESETS_A, ...WAVE_ONE_MOVESETS_B]
const WAVE_TWO_MOVESETS = [...WAVE_TWO_MOVESETS_A, ...WAVE_TWO_MOVESETS_B]
const WAVE_THREE_MOVESETS = [...WAVE_THREE_MOVESETS_A, ...WAVE_THREE_MOVESETS_B]
const WAVE_FOUR_MOVESETS = [...WAVE_FOUR_MOVESETS_A, ...WAVE_FOUR_MOVESETS_B]
const ALL_MOVESETS = [
  ...WAVE_ONE_MOVESETS,
  ...WAVE_TWO_MOVESETS,
  ...WAVE_THREE_MOVESETS,
  ...WAVE_FOUR_MOVESETS,
  ...ROSTER_FINAL_MOVESETS,
]
const MOVESETS = new Map<FighterId, FighterMoveset>(
  ALL_MOVESETS.map(tuneBeyondMoveset)
    .map(tunePreparationMoveset)
    .map(tuneIllumiMoveset)
    .map(tuneBiohazardMoveset)
    .map(tuneMachiMoveset)
    .map(tuneCamillaMoveset)
    .map(tuneParallelFutureMoveset)
    .map(tuneVoconteMoveset)
    .map(tunePhinksMoveset)
    .map(tuneBenjaminMoveset)
    .map(tuneChrolloMoveset)
    .map(tuneKurapikaMoveset)
    .map(tuneMelodyMoveset)
    .map(tuneLynchMoveset)
    .map(tuneThetaMoveset)
    .map(tuneBlinkyMoveset)
    .map(tuneKallutoMoveset)
    .map(tuneGelMoveset)
    .map(tuneFranklinMoveset)
    .map(tuneLonghiMoveset)
    .map(tuneBashoMoveset)
    .map(tuneZakuroMoveset)
    .map(tuneChrolloMoveset)
    .map(tuneHisokaMoveset)
    .map(tuneFurykovMoveset)
    .map(tuneBonolenovMoveset)
    .map(declareMoveCombatRules)
    .map((moveset) => [moveset.fighterId, moveset]),
)
const MOVES = new Map(
  [...MOVESETS.values()].flatMap((moveset) =>
    moveset.moves.map((move) => [move.id, move] as const),
  ),
)

export const WAVE_ONE_FIGHTERS = WAVE_ONE_MOVESETS.map((moveset) => moveset.fighterId)
export const WAVE_TWO_FIGHTERS = WAVE_TWO_MOVESETS.map((moveset) => moveset.fighterId)
export const WAVE_THREE_FIGHTERS = WAVE_THREE_MOVESETS.map((moveset) => moveset.fighterId)
export const WAVE_FOUR_FIGHTERS = WAVE_FOUR_MOVESETS.map((moveset) => moveset.fighterId)
export const ROSTER_FINAL_FIGHTERS = ROSTER_FINAL_MOVESETS.map((moveset) => moveset.fighterId)

export function movesetFor(fighterId: FighterId): FighterMoveset | null {
  return MOVESETS.get(fighterId) ?? null
}

export function moveById(id?: string): FighterMove | null {
  return id ? (MOVES.get(id) ?? null) : null
}

export function moveForAction(
  fighter: ArcadeFighter,
  action: MoveAction,
  input: FightInput,
): FighterMove | null {
  const moveset = movesetFor(fighter.id)
  if (!moveset) return null
  const slot =
    [
      'leorio',
      'yokotani',
      'bill',
      'lynch',
      'longhi',
      'melody',
      'basho',
      'musse',
      'mizaistom',
      'phinks',
      'voconte',
    ].includes(fighter.id) && action === 'special'
      ? 'neutralSpecial'
      : slotForAction(fighter, action, input)
  return moveset.moves.find((move) => move.slot === slot) ?? null
}

export function moveForSlot(fighterId: FighterId, slot: MoveSlot): FighterMove | null {
  return moveById(moveId(fighterId, slot))
}

export function canUseMovesetMove(state: FightState, side: FightSide, move: FighterMove): boolean {
  if (move.kind === 'ranged' && !canUseRangedAttack(state[side])) return false
  if (!nenActionAllowed({ state, side, kind: move.kind, moveId: move.id })) return false
  return contextualMoveAllowed(state, side, move)
}

function contextualMoveAllowed(state: FightState, side: FightSide, move: FighterMove): boolean {
  if (!illumiBodyFree(state[side])) return false
  const needles = illumiMoveReadiness(state, side, move)
  if (needles !== null) return needles
  const blood = zakuroMoveReady(state, side, move)
  if (blood !== null) return blood
  const battle = bonolenovMoveAllowed(state, side, move)
  if (battle !== null) return battle
  const preparation = preparedMoveAllowed(state, side, move)
  if (preparation !== null) return preparation
  if (!paperAndBlinkyMoveAllowed(state, side, move)) return false
  if (move.id === 'mizaistom:neutralSpecial') return crossGameCanWarn(state, side)
  if (move.id === 'basho:neutralSpecial') return bashoCanWrite(state, side)
  if (move.id === 'longhi:neutralSpecial') return moonlightCanOffer(state, side)
  return ordinaryMoveAllowed(state, side, move)
}

function ordinaryMoveAllowed(state: FightState, side: FightSide, move: FighterMove): boolean {
  if (beyondCurseUnavailable({ fighter: state[side], kind: move.kind, moveId: move.id }))
    return false
  if (move.id === 'lynch:neutralSpecial') return canAskLynchQuestion(state, side, move.id)
  const fighter = state[side]
  if (
    isPredatorMove(fighter, move.id) &&
    move.category === 'finisher' &&
    !predatorReady(state, side)
  )
    return false
  if (!lsdfMoveAllowed(state, side, move)) return false
  if (!hasMoveResources(fighter, move)) return false
  if (!canonicalTechniqueAllowed(state, side, move)) return false
  return move.category !== 'finisher' || finisherCondition(state, side)
}

export function hasMoveResources(fighter: ArcadeFighter, move: FighterMove): boolean {
  if (move.id === 'machi:neutralSpecial' && !fighter.openWounds) return false
  const door = move.kind === 'special' ? voconteMoveResources(fighter, move.id) : null
  if (door !== null) return door
  const needles = move.kind === 'special' ? illumiResources(fighter, move.id) : null
  if (needles !== null) return needles && fighter.aura >= move.auraCost
  const biohazard = biohazardMoveResources(fighter, move.id)
  if (biohazard !== null) return biohazard
  return bonolenovResources(fighter, move) ?? ordinaryMoveResources(fighter, move)
}

function ordinaryMoveResources(fighter: ArcadeFighter, move: FighterMove): boolean {
  const cyclotron = cyclotronMoveResources(fighter, move.id)
  if (cyclotron !== null && move.kind === 'special') return cyclotron
  const melody = melodyMoveResources(fighter, move.kind, move.id)
  if (melody !== null) return melody
  if (move.kind === 'special' && predatorNenLocked(fighter)) return false
  if (move.kind === 'special' && isPredatorMove(fighter, move.id))
    return predatorNenAvailable(fighter)
  if (!musseMoveAvailable(fighter, move.id)) return false
  const future = futureMoveResources(fighter, move.id)
  if (future !== null) return future
  return remainingMoveResources(fighter, move)
}

function remainingMoveResources(fighter: ArcadeFighter, move: FighterMove): boolean {
  if (move.kind === 'special' && !padailleMoveAvailable(fighter, move.id)) return false
  if (!furykovMoveAvailable(fighter, move)) return false
  if (!characterMoveAvailable(fighter, move)) return false
  if (isHeldChainMove(fighter, move)) return true
  if (thetaShotMove(fighter, move.id)) return true
  if (isBiscuitFormMove(fighter, move.id)) return !isBiscuitTrueForm(fighter)
  const projectionResources = hanzoMoveResources(fighter, move.id, move.kind)
  if (projectionResources !== null) return projectionResources
  if (fighter.aura < attackAuraCost({ fighter, kind: move.kind, moveId: move.id })) return false
  return hasTechniqueResources(fighter, move)
}

function isHeldChainMove(fighter: ArcadeFighter, move: FighterMove): boolean {
  return (
    fighter.id === 'kurapika' &&
    move.id === 'kurapika:backSpecial' &&
    Boolean(fighter.kurapika?.held)
  )
}

function characterMoveAvailable(fighter: ArcadeFighter, move: FighterMove): boolean {
  if (isErigeronAction(fighter, move.kind, move.id)) return false
  if (move.kind === 'special' && !chrolloMoveAvailable(fighter, move.id)) return false
  return (
    kurapikaMoveAvailable(fighter, move.id) &&
    feitanMoveAvailable(fighter, move.id) &&
    remotePunchAvailable(fighter, move.kind, move.id) &&
    benjaminMoveAvailable(fighter, move.id)
  )
}

function hasTechniqueResources(fighter: ArcadeFighter, move: FighterMove): boolean {
  if (move.category !== 'special' && move.category !== 'finisher') return true
  if (fighter.id === 'franklin') return franklinNenAvailable(fighter)
  return canUseHatsu(fighter.nen) && !hatsuSealedByOn(fighter)
}

export function finisherReady(state: FightState, side: FightSide): boolean {
  const move = moveForSlot(state[side].id, 'finisher')
  return Boolean(move && canUseMovesetMove(state, side, move))
}

function slotForAction(fighter: ArcadeFighter, action: MoveAction, input: FightInput): MoveSlot {
  if (action === 'throw' || action === 'finisher') return action
  const direction = relativeDirection(fighter, input)
  if (action === 'special') return specialSlot(input, direction)
  return normalSlot({ fighter, action, input, direction })
}

function specialSlot(input: FightInput, direction: ReturnType<typeof relativeDirection>): MoveSlot {
  if (input.down) return 'downSpecial'
  if (direction === 'forward') return 'forwardSpecial'
  if (direction === 'back') return 'backSpecial'
  return 'neutralSpecial'
}

interface NormalSlotOptions {
  fighter: ArcadeFighter
  action: 'light' | 'heavy'
  input: FightInput
  direction: ReturnType<typeof relativeDirection>
}

function normalSlot(options: NormalSlotOptions): MoveSlot {
  const { fighter, action, input, direction } = options
  if (fighter.y > 0) return action === 'light' ? 'airLight' : 'airHeavy'
  if (input.down) return action === 'light' ? 'lowLight' : 'lowHeavy'
  if (direction === 'forward') return action === 'light' ? 'forwardLight' : 'forwardHeavy'
  if (direction === 'back' && action === 'heavy') return 'backHeavy'
  return action === 'light' ? 'standingLight' : 'standingHeavy'
}

function relativeDirection(fighter: ArcadeFighter, input: FightInput): 'forward' | 'back' | null {
  const forward = fighter.facing === 1 ? input.right : input.left
  const back = fighter.facing === 1 ? input.left : input.right
  if (forward && !back) return 'forward'
  if (back && !forward) return 'back'
  return null
}

function finisherCondition(state: FightState, side: FightSide): boolean {
  return FINISHER_CONDITIONS[state[side].id]?.(state, side) ?? false
}

type FinisherCondition = (state: FightState, side: FightSide) => boolean
const opponentOf = (state: FightState, side: FightSide) =>
  state[side === 'player' ? 'opponent' : 'player']

const FINISHER_CONDITIONS: Partial<Record<FighterId, FinisherCondition>> = {
  kurapika: (state, side) =>
    Boolean(state[side].kurapika?.emperorTime) && !opponentOf(state, side).judgmentChain,
  hisoka: (state, side) => selectedGumLink(state, side)?.target.kind === 'fighter',
  chrollo: (state, side) => chrolloMoveAvailable(state[side], CHROLLO_SECONDARY),
  benjamin: (state, side) => Boolean(state[side].hatsuEffects.baton?.card),
  tserriednich: (state, side) =>
    state.parallelFuture?.owner === side && state.parallelFuture.phase === 'vision',
  feitan: (state, side) => feitanMoveAvailable(state[side], 'feitan:finisher'),
  saiyu: (state, side) => sealedSenseCount(opponentOf(state, side)) >= 2,
  biscuit: (state, side) => isBiscuitTrueForm(state[side]),
  phinks: (state, side) => cyclotronPunchReady(state[side]),
  franklin: () => true,
  machi: (state, side) => machiBindReady(state, side),
  kalluto: (state, side) => paperCommandReady(state, side, 'serpent'),
  shizuku: blinkyBloodReady,
  hanzo: (state, side) => Boolean(state[side].hanzoProjection),
  rihan: (state, side) => predatorReady(state, side),
  halkenburg: (state, side) => opponentOf(state, side).hatsuEffects.possessedFrames > 0,
  luini: (state, side) => state[side].hatsuEffects.teleportDodges > 0,
  furykov: (state, side) => state[side].comboHits >= 3,
  cluck: (state, side) => healthPercent(opponentOf(state, side)) <= 40,
  sayird: (state, side) => state[side].comboHits >= 2,
  terebellum: (state, side) => sweetHomeAvailable(state, side) && sweetHomeCanTouch(state, side),
}

function lsdfMoveAllowed(state: FightState, side: FightSide, move: FighterMove): boolean {
  return (
    move.kind !== 'special' || !isLsdfMove(state[side], move.id) || canActivateLsdf(state, side)
  )
}

function preparedMoveAllowed(
  state: FightState,
  side: FightSide,
  move: FighterMove,
): boolean | null {
  if (move.kind !== 'special') return null
  if (preparedSource(state, side, move.id)) return preparedActionReady(state, side, move.id)
  return preparationCheck(state, side, move.id).ready ? null : false
}

function paperAndBlinkyMoveAllowed(state: FightState, side: FightSide, move: FighterMove): boolean {
  return (
    (move.kind !== 'special' || paperMoveAllowed(state, side, move.id)) &&
    blinkyMoveAllowed(state, side, move.id)
  )
}
