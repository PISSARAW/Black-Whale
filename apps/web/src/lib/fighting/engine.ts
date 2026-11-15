import { attackVariant } from './duelMoves'
import { FIGHT_FPS, FIXED_STEP } from './frameData'
import { DEFAULT_FIGHT_FORMAT, fightFormat, type FightFormatId } from './formats'
import {
  advanceHatsuFrames,
  canUseFightHatsu,
  FIGHT_HATSU_AURA_COST,
  hatsuSourceFor,
  triggerHatsu,
} from './hatsu'
import {
  advanceFighterAttack,
  canBufferFighterAttack,
  canStartFighterAttack,
  startFighterAttack,
} from './fighterAttacks'
import { chooseStyleAttack, fightingStyle } from './fightStyles'
import { advanceNen, applyAuraContext, createFightingNen, IN_CHARGE_FRAMES, setIn } from './nen'
import { fighterDefinition } from './roster'
import { moveOpponent } from './opponentMovement'
import { advanceProjectiles, canUseRangedAttack, spawnRangedProjectiles } from './projectiles'
import { finishFight, resolveFightImpacts, TOWER_WIN_SCORE } from './combatImpact'
import { EMPTY_INPUT } from './types'
import type {
  ArcadeFighter,
  AttackKind,
  AttackVariant,
  FightInput,
  FightSide,
  FightState,
  FighterId,
  FighterPose,
} from './types'

const GROUND = 0
const GRAVITY = 120
const JUMP_SPEED = 48
const MIN_X = 7
const MAX_X = 93
const MIN_GAP = 5
const RYU_FOLLOW_UP_FRAMES = 10
export { TOWER_WIN_SCORE }
const IN_AURA_SURCHARGE = 12

export function createFight(
  playerId: FighterId,
  opponentId: FighterId,
  formatId: FightFormatId = DEFAULT_FIGHT_FORMAT,
): FightState {
  const format = fightFormat(formatId)
  return {
    formatId,
    player: createFighter({ id: playerId, x: 22, facing: 1, health: format.health }),
    opponent: createFighter({ id: opponentId, x: 78, facing: -1, health: format.health }),
    phase: 'ready',
    frame: 0,
    time: format.roundFrames / FIGHT_FPS,
    remainingFrames: format.roundFrames,
    frameAccumulator: 0,
    hitstop: 0,
    rng: seedFor(playerId, opponentId),
    winner: null,
    finishReason: null,
    score: { player: 0, opponent: 0 },
    bungeeGum: null,
    projectiles: [],
    nextProjectileId: 1,
    impact: null,
  }
}

function createFighter(options: {
  id: FighterId
  x: number
  facing: -1 | 1
  health: number
}): ArcadeFighter {
  const { id, x, facing, health } = options
  return {
    id,
    x,
    y: GROUND,
    velocityY: 0,
    health,
    aura: 55,
    nen: createFightingNen(),
    facing,
    pose: 'idle',
    hitStun: 0,
    blockStun: 0,
    blocking: false,
    guardFrames: 0,
    ryuWindow: 0,
    auraExhausted: false,
    hatsuChargeFrames: 0,
    hatsuEffects: {
      forcedZetsuFrames: 0,
      contagionFrames: 0,
      contagionStacks: 0,
      futureSight: 0,
      batonCharges: 0,
      senseSeals: 0,
      sunMoonMarks: 0,
      manipulatedFrames: 0,
      transformationFrames: 0,
      isolationFrames: 0,
      cyclotronTurns: 0,
      stitchedFrames: 0,
      needleFrames: 0,
      serpentMarks: 0,
      cantabileFrames: 0,
      biohazardFrames: 0,
      restrainedFrames: 0,
      cloneDodges: 0,
      predatorFrames: 0,
      bloodBoundFrames: 0,
      entrancedFrames: 0,
      lastHatsuReceived: null,
    },
    attack: null,
    bufferedAttack: null,
  }
}

export function beginFight(state: FightState): FightState {
  return state.phase === 'ready' ? { ...state, phase: 'fighting' } : state
}

export function tickFight(state: FightState, input: FightInput, dt: number): FightState {
  if (state.phase !== 'fighting') return state
  const remainingFrames = Math.min(state.remainingFrames, Math.ceil(state.time * FIGHT_FPS))
  let next = {
    ...state,
    remainingFrames,
    frameAccumulator: state.frameAccumulator + Math.min(dt, 0.1),
  }
  while (next.frameAccumulator >= FIXED_STEP && next.phase === 'fighting') {
    const accumulator = next.frameAccumulator - FIXED_STEP
    next = { ...stepFight(next, input), frameAccumulator: accumulator }
  }
  return next
}

function stepFight(state: FightState, input: FightInput): FightState {
  if (state.hitstop > 0) return { ...state, frame: state.frame + 1, hitstop: state.hitstop - 1 }
  const player = updatePlayer(state.player, input)
  const opponent = updateOpponent(state.opponent, player)
  const buffered = flushBuffered(
    flushBuffered({ ...state, player, opponent }, 'player'),
    'opponent',
  )
  const withHatsu = advanceHatsuFrames(buffered)
  const armed = spawnRangedProjectiles(withHatsu)
  const flight = advanceProjectiles(armed, FIXED_STEP)
  const resolved = resolveFightImpacts(flight.state, flight.hits)
  if (resolved.phase === 'finished') return resolved
  const separated = separateFighters(resolved.player, resolved.opponent)
  const remainingFrames = Math.max(0, state.remainingFrames - 1)
  const next = {
    ...resolved,
    ...separated,
    frame: state.frame + 1,
    remainingFrames,
    time: remainingFrames / FIGHT_FPS,
  }
  return remainingFrames === 0 ? finishByTime(next) : next
}

function updatePlayer(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  let next = updateHatsuCharge(applyAuraContext(advanceFighter(fighter), input), input)
  next = updatePlayerGuard({ ...next, crouching: input.down && next.y === 0 }, input)
  if (playerCanJump(next, input)) {
    return poseFighter({ ...next, velocityY: JUMP_SPEED, pose: 'jump', blocking: false })
  }
  if (!canMove(next) || next.blocking) return poseFighter(next)
  const direction = Number(input.right) - Number(input.left)
  const speed = fighterDefinition(next.id).speed * 28
  const x = clamp(next.x + direction * speed * FIXED_STEP, MIN_X, MAX_X)
  return poseFighter({ ...next, x, pose: direction === 0 ? 'idle' : 'walk' })
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
  return poseFighter(moveOpponent(advanceFighter(fighter), player))
}

function advanceFighter(fighter: ArcadeFighter): ArcadeFighter {
  const airborne = fighter.y > GROUND || fighter.velocityY > 0
  const velocityY = airborne ? fighter.velocityY - GRAVITY * FIXED_STEP : 0
  const y = airborne ? Math.max(GROUND, fighter.y + velocityY * FIXED_STEP) : GROUND
  let next = advanceFighterAttack({
    ...fighter,
    y,
    velocityY: y === GROUND ? 0 : velocityY,
    hitStun: Math.max(0, fighter.hitStun - 1),
    blockStun: Math.max(0, fighter.blockStun - 1),
    ryuWindow: Math.max(0, fighter.ryuWindow - 1),
    throwTechFrames: Math.max(0, (fighter.throwTechFrames ?? 0) - 1),
  })
  next = advanceNen(next, FIXED_STEP)
  return next
}

export function performAttack(state: FightState, side: FightSide, kind: AttackKind): FightState {
  return performAuraAttack({ state, side, kind, auraCharged: false })
}

export function performAuraAttack(options: {
  state: FightState
  side: FightSide
  kind: AttackKind
  auraCharged: boolean
  variant?: AttackVariant
}): FightState {
  const { side, kind, auraCharged } = options
  if (options.state.phase !== 'fighting') return options.state
  const original = options.state[side]
  const variant = attackVariant({ fighter: original, kind, variant: options.variant })
  const { hatsuSource, concealed, resourceReady } = attackIntent(original, kind)
  const starts = canStartFighterAttack(original, kind)
  const buffers = resourceReady && canBufferFighterAttack(original)
  if (!starts && !buffers) return options.state
  const state =
    starts && hatsuSource ? triggerHatsu(options.state, side, hatsuSource) : options.state
  const fighter = state[side]
  if (starts) {
    return {
      ...state,
      [side]: startFighterAttack({ fighter, kind, variant, auraCharged, concealed, hatsuSource }),
    }
  }
  return buffers
    ? {
        ...state,
        [side]: {
          ...fighter,
          bufferedAttack: { kind, variant, auraCharged, concealed, hatsuSource },
        },
      }
    : state
}

function attackIntent(fighter: ArcadeFighter, kind: AttackKind) {
  return {
    hatsuSource: kind === 'special' ? hatsuSourceFor(fighter) : null,
    concealed: concealedHatsu(fighter, kind),
    resourceReady: attackResourceReady(fighter, kind),
  }
}

function concealedHatsu(fighter: ArcadeFighter, kind: AttackKind): boolean {
  return (
    kind === 'special' &&
    fighter.id === 'hisoka' &&
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
  const planned = planOpponentNen(state)
  if (!canAct(planned.opponent)) return planned
  const [rolled, chance] = randomValue(planned)
  const gap = Math.abs(rolled.player.x - rolled.opponent.x)
  const definition = fighterDefinition(rolled.opponent.id)
  const style = fightingStyle(rolled.opponent.id)
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
  if (needsZetsu(opponent)) return applyOpponentAura(state, { aura: true, down: true })
  if (canLeaveZetsu(opponent)) return applyOpponentAura(state, {})
  if (needsKen(state, gap)) return applyOpponentAura(state, { aura: true, guard: true })
  return wantsRen(opponent, gap) ? applyOpponentAura(state, { aura: true }) : state
}

function applyOpponentAura(
  state: FightState,
  partial: Partial<Pick<FightInput, 'aura' | 'down' | 'guard' | 'jump'>>,
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

function separateFighters(
  player: ArcadeFighter,
  opponent: ArcadeFighter,
): Pick<FightState, 'player' | 'opponent'> {
  const playerFacing = player.x <= opponent.x ? 1 : -1
  const gap = Math.abs(player.x - opponent.x)
  if (gap >= MIN_GAP || player.y > 4 || opponent.y > 4) {
    return {
      player: { ...player, facing: playerFacing },
      opponent: { ...opponent, facing: playerFacing === 1 ? -1 : 1 },
    }
  }
  const centre = (player.x + opponent.x) / 2
  return {
    player: { ...player, x: centre - (MIN_GAP / 2) * playerFacing, facing: playerFacing },
    opponent: {
      ...opponent,
      x: centre + (MIN_GAP / 2) * playerFacing,
      facing: playerFacing === 1 ? -1 : 1,
    },
  }
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
  if (fighter.hitStun > 0) return { ...fighter, pose: 'hit', blocking: false }
  if (fighter.attack) return { ...fighter, pose: fighter.attack.kind, blocking: false }
  if (fighter.y > GROUND) return { ...fighter, pose: 'jump', blocking: false }
  if (fighter.blocking || fighter.blockStun > 0) return { ...fighter, pose: 'guard' }
  return fighter
}

function canAct(fighter: ArcadeFighter): boolean {
  return fighter.hitStun === 0 && fighter.blockStun === 0 && fighter.health > 0
}

function canMove(fighter: ArcadeFighter): boolean {
  return canAct(fighter) && fighter.attack === null
}

function canGuard(fighter: ArcadeFighter): boolean {
  return (
    fighter.y === GROUND && fighter.hitStun === 0 && fighter.health > 0 && fighter.attack === null
  )
}

function seedFor(playerId: FighterId, opponentId: FighterId): number {
  const text = `${playerId}:${opponentId}`
  let seed = 2166136261
  for (const character of text) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619)
  return seed >>> 0
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
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
