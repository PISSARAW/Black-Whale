import { fighterDefinition } from './roster'
import type {
  ArcadeFighter,
  AttackKind,
  FightInput,
  FightSide,
  FightState,
  FighterId,
  FighterPose,
} from './types'
import type { FighterDefinition } from './types'

const GROUND = 0
const GRAVITY = 120
const JUMP_SPEED = 48
const MIN_X = 7
const MAX_X = 93
const MIN_GAP = 5
const ROUND_TIME = 60

const ATTACKS: Record<AttackKind, { damage: number; cooldown: number; duration: number }> = {
  light: { damage: 7, cooldown: 0.28, duration: 0.2 },
  heavy: { damage: 12, cooldown: 0.52, duration: 0.38 },
  special: { damage: 19, cooldown: 0.78, duration: 0.6 },
}

export function createFight(playerId: FighterId, opponentId: FighterId): FightState {
  return {
    player: createFighter(playerId, 22, 1),
    opponent: createFighter(opponentId, 78, -1),
    phase: 'ready',
    time: ROUND_TIME,
    winner: null,
    impact: null,
  }
}

function createFighter(id: FighterId, x: number, facing: -1 | 1): ArcadeFighter {
  return {
    id,
    x,
    y: GROUND,
    velocityY: 0,
    health: 100,
    aura: 20,
    facing,
    pose: 'idle',
    poseTime: 0,
    cooldown: 0,
    hitStun: 0,
    blocking: false,
  }
}

export function beginFight(state: FightState): FightState {
  return state.phase === 'ready' ? { ...state, phase: 'fighting' } : state
}

export function tickFight(state: FightState, input: FightInput, dt: number): FightState {
  if (state.phase !== 'fighting') return state
  const step = Math.min(dt, 0.05)
  const player = updatePlayer(state.player, input, step)
  const opponent = updateOpponent(state.opponent, player, step)
  const separated = separateFighters(player, opponent)
  const time = Math.max(0, state.time - step)
  const next = { ...state, ...separated, time }
  return time === 0 ? finishByTime(next) : next
}

function updatePlayer(fighter: ArcadeFighter, input: FightInput, dt: number): ArcadeFighter {
  const blocking = input.block && fighter.y === GROUND && fighter.hitStun === 0
  const direction = Number(input.right) - Number(input.left)
  let next = advanceFighter({ ...fighter, blocking }, dt)
  if (input.jump && canAct(next) && next.y === GROUND) {
    next = { ...next, velocityY: JUMP_SPEED, pose: 'jump', blocking: false }
  }
  if (!canMove(next) || blocking) return poseFighter(next)
  const speed = fighterDefinition(next.id).speed * 28
  return poseFighter({ ...next, x: clamp(next.x + direction * speed * dt, MIN_X, MAX_X) })
}

function updateOpponent(
  fighter: ArcadeFighter,
  player: ArcadeFighter,
  dt: number,
): ArcadeFighter {
  let next = advanceFighter(fighter, dt)
  const gap = Math.abs(player.x - next.x)
  const threatened = player.pose === 'heavy' || player.pose === 'special'
  const blocking = threatened && gap < 18 && next.hitStun === 0
  next = { ...next, blocking }
  if (!canMove(next) || blocking) return poseFighter(next)
  const direction = player.x < next.x ? -1 : 1
  const retreat = gap < 7 && next.health < 35 ? -direction : direction
  const speed = fighterDefinition(next.id).speed * 20
  return poseFighter({ ...next, x: clamp(next.x + retreat * speed * dt, MIN_X, MAX_X) })
}

function advanceFighter(fighter: ArcadeFighter, dt: number): ArcadeFighter {
  const airborne = fighter.y > GROUND || fighter.velocityY > 0
  const velocityY = airborne ? fighter.velocityY - GRAVITY * dt : 0
  const y = airborne ? Math.max(GROUND, fighter.y + velocityY * dt) : GROUND
  return {
    ...fighter,
    y,
    velocityY: y === GROUND ? 0 : velocityY,
    cooldown: Math.max(0, fighter.cooldown - dt),
    hitStun: Math.max(0, fighter.hitStun - dt),
    poseTime: Math.max(0, fighter.poseTime - dt),
    aura: Math.min(100, fighter.aura + dt * 1.8),
  }
}

function poseFighter(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.health <= 0) return { ...fighter, pose: 'ko', blocking: false }
  if (fighter.hitStun > 0) return { ...fighter, pose: 'hit', blocking: false }
  if (fighter.y > GROUND) return { ...fighter, pose: 'jump', blocking: false }
  if (fighter.blocking) return { ...fighter, pose: 'guard' }
  if (fighter.poseTime > 0) return fighter
  return { ...fighter, pose: 'idle' }
}

export function performAttack(
  state: FightState,
  side: FightSide,
  kind: AttackKind,
): FightState {
  if (state.phase !== 'fighting') return state
  const attacker = state[side]
  const defenderSide = side === 'player' ? 'opponent' : 'player'
  const defender = state[defenderSide]
  if (!canStartAttack(attacker, kind)) return state
  const definition = fighterDefinition(attacker.id)
  const attack = ATTACKS[kind]
  const range = attackRange(definition, kind)
  const inRange = Math.abs(attacker.x - defender.x) <= range
  const prepared = prepareAttack(attacker, kind, attack)
  if (!inRange) return { ...state, [side]: prepared }
  const blocked = defender.blocking
  const damage = attackDamage(attack.damage, definition.power, blocked)
  const struck = strikeDefender({ fighter: defender, attacker, damage, blocked })
  const impact = {
    sequence: (state.impact?.sequence ?? 0) + 1,
    attacker: side,
    kind,
    damage,
    blocked,
  }
  const next = { ...state, [side]: prepared, [defenderSide]: struck, impact }
  return struck.health === 0 ? finishFight(next, side) : next
}

function canStartAttack(fighter: ArcadeFighter, kind: AttackKind): boolean {
  return canAct(fighter) && (kind !== 'special' || fighter.aura >= 40)
}

function attackRange(definition: FighterDefinition, kind: AttackKind): number {
  if (kind === 'special') return definition.specialRange
  return definition.reach + (kind === 'heavy' ? 2 : 0)
}

function attackDamage(base: number, power: number, blocked: boolean): number {
  return Math.max(1, Math.round(base * power * (blocked ? 0.28 : 1)))
}

function prepareAttack(
  fighter: ArcadeFighter,
  kind: AttackKind,
  attack: { cooldown: number; duration: number },
): ArcadeFighter {
  return {
    ...fighter,
    aura: kind === 'special' ? fighter.aura - 40 : Math.min(100, fighter.aura + 8),
    pose: kind,
    poseTime: attack.duration,
    cooldown: attack.cooldown,
    blocking: false,
  }
}

interface StrikeOptions {
  fighter: ArcadeFighter,
  attacker: ArcadeFighter,
  damage: number,
  blocked: boolean,
}

function strikeDefender({ fighter, attacker, damage, blocked }: StrikeOptions): ArcadeFighter {
  const direction = fighter.x > attacker.x ? 1 : -1
  return {
    ...fighter,
    x: clamp(fighter.x + direction * (blocked ? 1 : 2.8), MIN_X, MAX_X),
    health: Math.max(0, fighter.health - damage),
    hitStun: blocked ? 0.08 : 0.24,
    pose: blocked ? 'guard' : 'hit',
    blocking: blocked,
  }
}

export function opponentAttack(state: FightState): FightState {
  if (state.phase !== 'fighting' || !canAct(state.opponent)) return state
  const gap = Math.abs(state.player.x - state.opponent.x)
  const definition = fighterDefinition(state.opponent.id)
  if (state.opponent.aura >= 40 && gap <= definition.specialRange && Math.random() < 0.24) {
    return performAttack(state, 'opponent', 'special')
  }
  if (gap <= definition.reach + 2) {
    return performAttack(state, 'opponent', Math.random() < 0.42 ? 'heavy' : 'light')
  }
  return state
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
    opponent: { ...opponent, x: centre + (MIN_GAP / 2) * playerFacing, facing: playerFacing === 1 ? -1 : 1 },
  }
}

function finishFight(state: FightState, winner: FightSide): FightState {
  return {
    ...state,
    phase: 'finished',
    winner,
    [winner === 'player' ? 'opponent' : 'player']: {
      ...state[winner === 'player' ? 'opponent' : 'player'],
      pose: 'ko',
      blocking: false,
    },
  }
}

function finishByTime(state: FightState): FightState {
  if (state.player.health === state.opponent.health) {
    return { ...state, phase: 'finished', winner: 'draw' }
  }
  return finishFight(state, state.player.health > state.opponent.health ? 'player' : 'opponent')
}

function canAct(fighter: ArcadeFighter): boolean {
  return fighter.cooldown === 0 && fighter.hitStun === 0 && fighter.health > 0
}

function canMove(fighter: ArcadeFighter): boolean {
  return fighter.hitStun === 0 && fighter.poseTime === 0 && fighter.health > 0
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function displayPose(fighter: ArcadeFighter): FighterPose {
  return poseFighter(fighter).pose
}
