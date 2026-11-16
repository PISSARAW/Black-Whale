import { tunePhinksMoveset } from './phinksMoveset'
import { cyclotronMoveResources } from './phinksAction'
import { cyclotronPunchReady } from './phinksCyclotron'
import { isPredatorMove, predatorNenAvailable, predatorReady } from './predator'
import { predatorNenLocked } from './predatorSeal'
import { tuneMelodyMoveset } from './melodyMoveset'
import { melodyMoveResources } from './melodyRules'
import { tuneBashoMoveset } from './bashoMoveset'
import { bashoCanWrite } from './bashoPoem'
import { tuneGelMoveset } from './gelMoveset'
import { machiBindReady } from './machiThread'
import { tuneMachiMoveset } from './machiMoveset'
import { tuneCamillaMoveset } from './camillaMoveset'
import { sealedSenseCount } from './saiyuSenses'
import { tuneThetaMoveset } from './thetaMoveset'
import { thetaShotMove } from './thetaFirearm'
import { tuneParallelFutureMoveset } from './parallelFutureMoveset'
import { futureMoveResources } from './parallelFutureAbility'
import { furykovMoveAvailable, tuneFurykovMoveset } from './furykovMoveset'
import { tuneLonghiMoveset } from './longhiMoveset'
import { moonlightCanOffer } from './moonlightContract'
import { isErigeronAction } from './billSupport'
import { tuneBenjaminMoveset } from './benjaminMoveset'
import { benjaminMoveAvailable } from './benjaminBaton'
import { tuneKurapikaMoveset } from './kurapikaMoveset'
import { kurapikaMoveAvailable } from './kurapika'
import { feitanMoveAvailable } from './feitanPain'
import { chrolloMoveAvailable, CHROLLO_SECONDARY } from './chrolloBook'
import { tuneChrolloMoveset } from './chrolloMoveset'
import { tuneHisokaMoveset } from './hisokaMoveset'
import { remotePunchAvailable } from './leorioAttack'
import { musseMoveAvailable } from './secretWindow'
import { canActivateLsdf, isLsdfMove } from './lsdf'
import { sweetHomeAvailable, sweetHomeCanTouch } from './sweetHomeContacts'
import { tuneFranklinMoveset } from './franklinMoveset'
import { franklinNenAvailable } from './franklinAttack'
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
  ALL_MOVESETS.map(tuneMachiMoveset)
    .map(tuneCamillaMoveset)
    .map(tuneParallelFutureMoveset)
    .map(tunePhinksMoveset)
    .map(tuneBenjaminMoveset)
    .map(tuneKurapikaMoveset)
    .map(tuneMelodyMoveset)
    .map(tuneThetaMoveset)
    .map(tuneGelMoveset)
    .map(tuneFranklinMoveset)
    .map(tuneLonghiMoveset)
    .map(tuneBashoMoveset)
    .map(tuneChrolloMoveset)
    .map(tuneHisokaMoveset)
    .map(tuneFurykovMoveset)
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
    ['leorio', 'yokotani', 'bill', 'longhi', 'melody', 'basho', 'musse', 'phinks'].includes(
      fighter.id,
    ) && action === 'special'
      ? 'neutralSpecial'
      : slotForAction(fighter, action, input)
  return moveset.moves.find((move) => move.slot === slot) ?? null
}

export function moveForSlot(fighterId: FighterId, slot: MoveSlot): FighterMove | null {
  return moveById(moveId(fighterId, slot))
}

export function canUseMovesetMove(state: FightState, side: FightSide, move: FighterMove): boolean {
  if (move.id === 'basho:neutralSpecial') return bashoCanWrite(state, side)
  if (move.id === 'longhi:neutralSpecial') return moonlightCanOffer(state, side)
  return ordinaryMoveAllowed(state, side, move)
}

function ordinaryMoveAllowed(state: FightState, side: FightSide, move: FighterMove): boolean {
  const fighter = state[side]
  if (move.kind === 'special' && isLsdfMove(fighter, move.id) && !canActivateLsdf(state, side))
    return false
  if (!predatorMoveAllowed(state, side, move)) return false
  if (!hasMoveResources(fighter, move)) return false
  if (!canonicalTechniqueAllowed(state, side, move)) return false
  return move.category !== 'finisher' || finisherCondition(state, side)
}

export function hasMoveResources(fighter: ArcadeFighter, move: FighterMove): boolean {
  const cyclotron = cyclotronMoveResources(fighter, move.id)
  if (cyclotron !== null && move.kind === 'special') return cyclotron
  if (move.kind === 'special' && predatorNenLocked(fighter)) return false
  if (move.kind === 'special' && isPredatorMove(fighter, move.id))
    return predatorNenAvailable(fighter)
  const melody = melodyMoveResources(fighter, move.kind, move.id)
  if (melody !== null) return melody
  if (!musseMoveAvailable(fighter, move.id)) return false
  const future = futureMoveResources(fighter, move.id)
  if (future !== null) return future
  return remainingMoveResources(fighter, move)
}

function remainingMoveResources(fighter: ArcadeFighter, move: FighterMove): boolean {
  if (!furykovMoveAvailable(fighter, move)) return false
  if (!characterMoveAvailable(fighter, move)) return false
  if (isHeldChainMove(fighter, move)) return true
  if (thetaShotMove(fighter, move.id)) return true
  if (isBiscuitFormMove(fighter, move.id)) return !isBiscuitTrueForm(fighter)
  const projectionResources = hanzoMoveResources(fighter, move.id, move.kind)
  if (projectionResources !== null) return projectionResources
  if (fighter.aura < move.auraCost) return false
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
  if (fighter.id === 'franklin' && move.kind === 'special' && !franklinNenAvailable(fighter))
    return false
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
  hisoka: (state, side) => state.bungeeGum?.owner === side && state.bungeeGum.target !== side,
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
  illumi: (state, side) => opponentOf(state, side).hatsuEffects.needleFrames > 0,
  kalluto: (state, side) => opponentOf(state, side).hatsuEffects.serpentMarks >= 2,
  bonolenov: (state, side) => state[side].hatsuEffects.cantabileFrames > 0,
  shizuku: (state, side) => opponentOf(state, side).health <= 50,
  hinrigh: (state, side) => state[side].hatsuEffects.biohazardFrames > 0,
  mizaistom: (state, side) => opponentOf(state, side).hatsuEffects.restrainedFrames > 0,
  hanzo: (state, side) => Boolean(state[side].hanzoProjection),
  rihan: predatorReady,
  zakuro: (state, side) => opponentOf(state, side).hatsuEffects.bloodBoundFrames > 0,
  halkenburg: (state, side) => opponentOf(state, side).hatsuEffects.possessedFrames > 0,
  lynch: (state, side) => opponentOf(state, side).hatsuEffects.soulExposedFrames > 0,
  luini: (state, side) => state[side].hatsuEffects.teleportDodges > 0,
  furykov: (state, side) => state[side].comboHits >= 3,
  cluck: (state, side) => opponentOf(state, side).health <= 40,
  beyond: (state, side) => state[side].health <= 40,
  padaille: (state, side) => state[side].hatsuEffects.weaponFrames > 0,
  sayird: (state, side) => state[side].comboHits >= 2,
  terebellum: (state, side) => sweetHomeAvailable(state, side) && sweetHomeCanTouch(state, side),
  voconte: (state, side) => state[side].hatsuEffects.doorDodges > 0,
}

function predatorMoveAllowed(state: FightState, side: FightSide, move: FighterMove): boolean {
  if (!isPredatorMove(state[side], move.id) || move.category !== 'finisher') return true
  return predatorReady(state, side)
}
