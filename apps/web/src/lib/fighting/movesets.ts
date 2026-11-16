import { remotePunchAvailable } from './leorioAttack'
import { canActivateLsdf, isLsdfMove } from './lsdf'
import { sweetHomeAvailable, sweetHomeCanTouch } from './sweetHomeContacts'
import { tuneFranklinMoveset } from './franklinMoveset'
import { franklinNenAvailable } from './franklinAttack'
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
  ALL_MOVESETS.map(tuneFranklinMoveset).map((moveset) => [moveset.fighterId, moveset]),
)
const MOVES = new Map(
  [...MOVESETS.values()].flatMap((moveset) => moveset.moves.map((move) => [move.id, move] as const)),
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
  const slot = (fighter.id === 'leorio' || fighter.id === 'yokotani') && action === 'special' ? 'neutralSpecial' : slotForAction(fighter, action, input)
  return moveset.moves.find((move) => move.slot === slot) ?? null
}

export function moveForSlot(fighterId: FighterId, slot: MoveSlot): FighterMove | null {
  return moveById(moveId(fighterId, slot))
}

export function canUseMovesetMove(state: FightState, side: FightSide, move: FighterMove): boolean {
  const fighter = state[side]
  if (move.kind === 'special' && isLsdfMove(fighter, move.id) && !canActivateLsdf(state, side)) return false
  if (!hasMoveResources(fighter, move)) return false
  if (!canonicalTechniqueAllowed(state, side, move)) return false
  return move.category !== 'finisher' || finisherCondition(state, side)
}

export function hasMoveResources(fighter: ArcadeFighter, move: FighterMove): boolean {
  if (!remotePunchAvailable(fighter, move.kind, move.id)) return false
  if (fighter.id === 'franklin' && move.kind === 'special' && !franklinNenAvailable(fighter)) return false
  if (fighter.aura < move.auraCost) return false
  return move.category !== 'special' && move.category !== 'finisher'
    ? true
    : canUseHatsu(fighter.nen) && !hatsuSealedByOn(fighter)
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
  kurapika: (state, side) => opponentOf(state, side).health <= 35,
  hisoka: (state, side) => state.bungeeGum?.owner === side && state.bungeeGum.target !== side,
  chrollo: (state, side) => {
    const marks = opponentOf(state, side).hatsuEffects
    return marks.sunMark + marks.moonMark > 0
  },
  benjamin: (state, side) => state[side].hatsuEffects.batonCharges >= 3,
  tserriednich: (state, side) => state[side].hatsuEffects.futureSight > 0,
  feitan: (state, side) => state[side].health <= 35,
  saiyu: (state, side) => opponentOf(state, side).hatsuEffects.senseSeals >= 2,
  theta: (state, side) => {
    const opponent = opponentOf(state, side)
    return opponent.hatsuEffects.forcedZetsuFrames > 0 || opponent.aura <= 30
  },
  biscuit: (state, side) => state[side].hatsuEffects.transformationFrames > 0,
  phinks: (state, side) => state[side].hatsuEffects.cyclotronTurns >= 4,
  franklin: () => true,
  machi: (state, side) => opponentOf(state, side).hatsuEffects.stitchedFrames > 0,
  illumi: (state, side) => opponentOf(state, side).hatsuEffects.needleFrames > 0,
  kalluto: (state, side) => opponentOf(state, side).hatsuEffects.serpentMarks >= 2,
  bonolenov: (state, side) => state[side].hatsuEffects.cantabileFrames > 0,
  shizuku: (state, side) => opponentOf(state, side).health <= 50,
  hinrigh: (state, side) => state[side].hatsuEffects.biohazardFrames > 0,
  mizaistom: (state, side) => opponentOf(state, side).hatsuEffects.restrainedFrames > 0,
  hanzo: (state, side) => state[side].hatsuEffects.cloneDodges > 0,
  rihan: (state, side) =>
    state[side].hatsuEffects.predatorFrames > 0 &&
    opponentOf(state, side).hatsuEffects.forcedZetsuFrames > 0,
  zakuro: (state, side) => opponentOf(state, side).hatsuEffects.bloodBoundFrames > 0,
  melody: (state, side) => opponentOf(state, side).hatsuEffects.entrancedFrames > 0,
  basho: (state, side) => state[side].hatsuEffects.haikuFrames > 0,
  camilla: (state, side) => state[side].health <= 30,
  halkenburg: (state, side) => opponentOf(state, side).hatsuEffects.possessedFrames > 0,
  gel: (state, side) => opponentOf(state, side).hatsuEffects.venomFrames > 0,
  lynch: (state, side) => opponentOf(state, side).hatsuEffects.soulExposedFrames > 0,
  luini: (state, side) => state[side].hatsuEffects.teleportDodges > 0,
  bill: (state, side) => state[side].hatsuEffects.growthFrames > 0 && state[side].health <= 50,
  furykov: (state, side) => state[side].comboHits >= 3,
  cluck: (state, side) => opponentOf(state, side).health <= 40,
  beyond: (state, side) => state[side].health <= 40,
  longhi: (state, side) => opponentOf(state, side).hatsuEffects.contractFrames > 0,
  musse: (state, side) => opponentOf(state, side).health <= 35,
  padaille: (state, side) => state[side].hatsuEffects.weaponFrames > 0,
  sayird: (state, side) => state[side].comboHits >= 2,
  terebellum: (state, side) => sweetHomeAvailable(state, side) && sweetHomeCanTouch(state, side),
  voconte: (state, side) => state[side].hatsuEffects.doorDodges > 0,
}
