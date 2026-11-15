import { canUseHatsu } from '@black-whale/nen-engine'
import {
  activeHitbox,
  attackData,
  attackPhase,
  attackTotal,
  boxesOverlap,
  contactPoint,
  FIGHT_FPS,
  FIXED_STEP,
  hurtboxes,
  INPUT_BUFFER_FRAMES,
  otherSide,
  ROUND_FRAMES,
} from './frameData'
import {
  advanceNen,
  applyNenCommand,
  consumeKo,
  createFightingNen,
  nenAttackFactor,
  nenDamageFactor,
} from './nen'
import { fighterDefinition } from './roster'
import type {
  ArcadeFighter,
  AttackKind,
  FightInput,
  FightNenCommand,
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

export function createFight(playerId: FighterId, opponentId: FighterId): FightState {
  return {
    player: createFighter(playerId, 22, 1),
    opponent: createFighter(opponentId, 78, -1),
    phase: 'ready',
    frame: 0,
    time: ROUND_FRAMES / FIGHT_FPS,
    remainingFrames: ROUND_FRAMES,
    frameAccumulator: 0,
    hitstop: 0,
    rng: seedFor(playerId, opponentId),
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
    aura: 55,
    nen: createFightingNen(),
    facing,
    pose: 'idle',
    hitStun: 0,
    blockStun: 0,
    blocking: false,
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
  const resolved = resolveAttacks({ ...state, player, opponent })
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
  let next = advanceFighter(fighter)
  const blocking = input.block && canGuard(next)
  next = { ...next, blocking }
  if (input.jump && canMove(next) && next.y === GROUND) {
    return poseFighter({ ...next, velocityY: JUMP_SPEED, pose: 'jump', blocking: false })
  }
  if (!canMove(next) || blocking) return poseFighter(next)
  const direction = Number(input.right) - Number(input.left)
  const speed = fighterDefinition(next.id).speed * 28
  const x = clamp(next.x + direction * speed * FIXED_STEP, MIN_X, MAX_X)
  return poseFighter({ ...next, x, pose: direction === 0 ? 'idle' : 'walk' })
}

function updateOpponent(fighter: ArcadeFighter, player: ArcadeFighter): ArcadeFighter {
  let next = advanceFighter(fighter)
  const gap = Math.abs(player.x - next.x)
  const threatened = player.pose === 'heavy' || player.pose === 'special'
  const blocking = threatened && gap < 18 && canGuard(next)
  next = { ...next, blocking }
  if (!canMove(next) || blocking) return poseFighter(next)
  const direction = player.x < next.x ? -1 : 1
  const retreat = gap < 7 && next.health < 35 ? -direction : direction
  const speed = fighterDefinition(next.id).speed * 20
  const x = clamp(next.x + retreat * speed * FIXED_STEP, MIN_X, MAX_X)
  return poseFighter({ ...next, x, pose: 'walk' })
}

function advanceFighter(fighter: ArcadeFighter): ArcadeFighter {
  const airborne = fighter.y > GROUND || fighter.velocityY > 0
  const velocityY = airborne ? fighter.velocityY - GRAVITY * FIXED_STEP : 0
  const y = airborne ? Math.max(GROUND, fighter.y + velocityY * FIXED_STEP) : GROUND
  let next = advanceAttack({
    ...fighter,
    y,
    velocityY: y === GROUND ? 0 : velocityY,
    hitStun: Math.max(0, fighter.hitStun - 1),
    blockStun: Math.max(0, fighter.blockStun - 1),
  })
  next = advanceNen(next, FIXED_STEP)
  if (!next.attack && next.bufferedAttack && canStartAttack(next, next.bufferedAttack)) {
    next = startAttack({ ...next, bufferedAttack: null }, next.bufferedAttack)
  }
  return next
}

function advanceAttack(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.attack) return fighter
  const data = attackData(fighter.attack.kind, fighter)
  const frame = fighter.attack.frame + 1
  let next: ArcadeFighter = { ...fighter, attack: { ...fighter.attack, frame } }
  if (!fighter.attack.impacted && frame >= data.startup + data.active) next = consumeKo(next)
  return frame >= attackTotal(data) ? { ...next, attack: null } : next
}

export function useNen(state: FightState, side: FightSide, command: FightNenCommand): FightState {
  if (state.phase !== 'fighting') return state
  return { ...state, [side]: applyNenCommand(state[side], command) }
}

export function performAttack(state: FightState, side: FightSide, kind: AttackKind): FightState {
  if (state.phase !== 'fighting') return state
  const fighter = state[side]
  if (canStartAttack(fighter, kind)) return { ...state, [side]: startAttack(fighter, kind) }
  return canBufferAttack(fighter)
    ? { ...state, [side]: { ...fighter, bufferedAttack: kind } }
    : state
}

function startAttack(fighter: ArcadeFighter, kind: AttackKind): ArcadeFighter {
  const data = attackData(kind, fighter)
  return {
    ...fighter,
    x: clamp(fighter.x + fighter.facing * data.lunge, MIN_X, MAX_X),
    aura: kind === 'special' ? fighter.aura - 40 : Math.min(100, fighter.aura + 8),
    pose: kind,
    blocking: false,
    attack: { kind, frame: 0, impacted: false },
    bufferedAttack: null,
  }
}

function canStartAttack(fighter: ArcadeFighter, kind: AttackKind): boolean {
  const specialReady = kind !== 'special' || (fighter.aura >= 40 && canUseHatsu(fighter.nen))
  return canAct(fighter) && fighter.attack === null && specialReady
}

function canBufferAttack(fighter: ArcadeFighter): boolean {
  if (fighter.hitStun > 0 || fighter.blockStun > 0) return true
  if (!fighter.attack) return false
  const remaining = attackTotal(attackData(fighter.attack.kind, fighter)) - fighter.attack.frame
  return remaining <= INPUT_BUFFER_FRAMES
}

function resolveAttacks(state: FightState): FightState {
  let next = resolveAttack(state, 'player')
  if (next.phase === 'fighting') next = resolveAttack(next, 'opponent')
  return next
}

function resolveAttack(state: FightState, side: FightSide): FightState {
  const attacker = state[side]
  if (!attacker.attack || attacker.attack.impacted || attackPhase(attacker) !== 'active')
    return state
  const defenderSide = otherSide(side)
  const defender = state[defenderSide]
  const collision = attackCollision(attacker, defender)
  if (!collision) return state
  const data = attackData(attacker.attack.kind, attacker)
  const blocked = defender.blocking && defender.y === GROUND
  const damage = attackDamage({ attacker, defender, base: data.damage, blocked })
  const spent = consumeKo({ ...attacker, attack: { ...attacker.attack, impacted: true } })
  const struck = strikeDefender({ fighter: defender, attacker, damage, blocked })
  const impact = {
    sequence: (state.impact?.sequence ?? 0) + 1,
    attacker: side,
    kind: attacker.attack.kind,
    damage,
    blocked,
    position: collision,
  }
  const next = { ...state, [side]: spent, [defenderSide]: struck, impact, hitstop: data.hitstop }
  return struck.health === 0 ? finishFight(next, side) : next
}

function attackCollision(attacker: ArcadeFighter, defender: ArcadeFighter) {
  const hitbox = activeHitbox(attacker)
  if (!hitbox) return null
  const hurtbox = hurtboxes(defender).find((candidate) => boxesOverlap(hitbox, candidate))
  return hurtbox ? contactPoint(hitbox, hurtbox) : null
}

interface DamageOptions {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  base: number
  blocked: boolean
}

function attackDamage({ attacker, defender, base, blocked }: DamageOptions): number {
  const power = fighterDefinition(attacker.id).power
  const guard = blocked ? 0.28 : 1
  const kind = attacker.attack?.kind ?? 'light'
  return Math.max(
    1,
    Math.round(base * power * nenAttackFactor(attacker, kind) * nenDamageFactor(defender) * guard),
  )
}

interface StrikeOptions {
  fighter: ArcadeFighter
  attacker: ArcadeFighter
  damage: number
  blocked: boolean
}

function strikeDefender({ fighter, attacker, damage, blocked }: StrikeOptions): ArcadeFighter {
  const data = attackData(attacker.attack?.kind ?? 'light', attacker)
  const direction = fighter.x > attacker.x ? 1 : -1
  return {
    ...fighter,
    x: clamp(fighter.x + direction * data.knockback, MIN_X, MAX_X),
    health: Math.max(0, fighter.health - damage),
    hitStun: blocked ? 0 : data.hitstun,
    blockStun: blocked ? data.blockstun : 0,
    pose: blocked ? 'guard' : 'hit',
    blocking: blocked,
    attack: null,
    bufferedAttack: null,
  }
}

export function opponentAttack(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  const planned = planOpponentNen(state)
  if (!canAct(planned.opponent)) return planned
  const [rolled, chance] = randomValue(planned)
  const gap = Math.abs(rolled.player.x - rolled.opponent.x)
  const definition = fighterDefinition(rolled.opponent.id)
  if (rolled.opponent.aura >= 40 && gap <= definition.specialRange && chance < 0.24) {
    return performAttack(rolled, 'opponent', 'special')
  }
  if (gap <= definition.reach + 2) {
    return performAttack(rolled, 'opponent', chance < 0.55 ? 'heavy' : 'light')
  }
  return rolled
}

function planOpponentNen(state: FightState): FightState {
  const gap = Math.abs(state.player.x - state.opponent.x)
  const opponent = state.opponent
  if (needsZetsu(opponent)) return useNen(state, 'opponent', 'zetsu')
  if (canLeaveZetsu(opponent)) return useNen(state, 'opponent', 'ten')
  if (needsKen(state, gap)) return useNen(state, 'opponent', 'ken')
  return wantsRen(opponent, gap) ? useNen(state, 'opponent', 'ren') : state
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

function finishFight(state: FightState, winner: FightSide): FightState {
  const loser = otherSide(winner)
  return {
    ...state,
    phase: 'finished',
    winner,
    [loser]: {
      ...state[loser],
      pose: 'ko',
      blocking: false,
      attack: null,
      bufferedAttack: null,
    },
  }
}

function finishByTime(state: FightState): FightState {
  if (state.player.health === state.opponent.health) {
    return { ...state, phase: 'finished', winner: 'draw' }
  }
  return finishFight(state, state.player.health > state.opponent.health ? 'player' : 'opponent')
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
  return fighter.y === GROUND && canMove(fighter)
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
