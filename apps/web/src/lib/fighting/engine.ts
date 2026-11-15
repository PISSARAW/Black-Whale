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
import { canUseFightHatsu, FIGHT_HATSU_AURA_COST } from './hatsu'
import { chooseStyleAttack } from './fightStyles'
import {
  advanceNen,
  applyAuraContext,
  createFightingNen,
  focusAttackRyu,
  focusGuardRyu,
  isCriticalAuraStrike,
  nenAttackFactor,
  nenDamageFactor,
  releaseFocusedAura,
} from './nen'
import { fighterDefinition } from './roster'
import { moveOpponent } from './opponentMovement'
import { EMPTY_INPUT } from './types'
import type {
  ArcadeFighter,
  AttackKind,
  FightInput,
  FightNenZone,
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
const PARRY_WINDOW_FRAMES = 6
const RYU_FOLLOW_UP_FRAMES = 10
export const TOWER_WIN_SCORE = 10

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
    score: { player: 0, opponent: 0 },
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
    guardFrames: 0,
    ryuWindow: 0,
    auraExhausted: false,
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
  let next = applyAuraContext(advanceFighter(fighter), input)
  const blocking = playerIsBlocking(next, input)
  const releasedGuard = next.blocking && !blocking
  next = {
    ...next,
    blocking,
    guardFrames: blocking ? (next.blocking ? next.guardFrames + 1 : 1) : 0,
    ryuWindow: releasedGuard ? RYU_FOLLOW_UP_FRAMES : next.ryuWindow,
  }
  if (playerCanJump(next, input)) {
    return poseFighter({ ...next, velocityY: JUMP_SPEED, pose: 'jump', blocking: false })
  }
  if (!canMove(next) || blocking) return poseFighter(next)
  const direction = Number(input.right) - Number(input.left)
  const speed = fighterDefinition(next.id).speed * 28
  const x = clamp(next.x + direction * speed * FIXED_STEP, MIN_X, MAX_X)
  return poseFighter({ ...next, x, pose: direction === 0 ? 'idle' : 'walk' })
}

function playerIsBlocking(fighter: ArcadeFighter, input: FightInput): boolean {
  if (!input.guard && !input.block) return false
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
  let next = advanceAttack({
    ...fighter,
    y,
    velocityY: y === GROUND ? 0 : velocityY,
    hitStun: Math.max(0, fighter.hitStun - 1),
    blockStun: Math.max(0, fighter.blockStun - 1),
    ryuWindow: Math.max(0, fighter.ryuWindow - 1),
  })
  next = advanceNen(next, FIXED_STEP)
  if (!next.attack && next.bufferedAttack && canStartAttack(next, next.bufferedAttack.kind)) {
    const buffered = next.bufferedAttack
    next = startAttack({ ...next, bufferedAttack: null }, buffered.kind, buffered.auraCharged)
  }
  return next
}

function advanceAttack(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.attack) return fighter
  const data = attackData(fighter.attack.kind, fighter)
  const frame = fighter.attack.frame + 1
  let next: ArcadeFighter = { ...fighter, attack: { ...fighter.attack, frame } }
  if (!fighter.attack.impacted && frame >= data.startup + data.active) {
    next = releaseFocusedAura(next)
  }
  return frame >= attackTotal(data) ? { ...releaseFocusedAura(next), attack: null } : next
}

export function performAttack(state: FightState, side: FightSide, kind: AttackKind): FightState {
  return performAuraAttack({ state, side, kind, auraCharged: false })
}

export function performAuraAttack(options: {
  state: FightState
  side: FightSide
  kind: AttackKind
  auraCharged: boolean
}): FightState {
  const { state, side, kind, auraCharged } = options
  if (state.phase !== 'fighting') return state
  const fighter = state[side]
  if (canStartAttack(fighter, kind)) {
    return { ...state, [side]: startAttack(fighter, kind, auraCharged) }
  }
  return canBufferAttack(fighter)
    ? { ...state, [side]: { ...fighter, bufferedAttack: { kind, auraCharged } } }
    : state
}

function startAttack(
  fighter: ArcadeFighter,
  kind: AttackKind,
  auraCharged: boolean,
): ArcadeFighter {
  const data = attackData(kind, fighter)
  const usesRyu = fighter.blocking || fighter.ryuWindow > 0
  const focused = usesRyu ? focusAttackRyu(fighter, kind) : fighter
  return {
    ...focused,
    x: clamp(fighter.x + fighter.facing * data.lunge, MIN_X, MAX_X),
    aura: kind === 'special' ? fighter.aura - FIGHT_HATSU_AURA_COST : fighter.aura,
    pose: kind,
    blocking: false,
    guardFrames: 0,
    ryuWindow: usesRyu ? RYU_FOLLOW_UP_FRAMES : fighter.ryuWindow,
    attack: { kind, frame: 0, impacted: false, auraCharged },
    bufferedAttack: null,
  }
}

function canStartAttack(fighter: ArcadeFighter, kind: AttackKind): boolean {
  const specialReady = kind !== 'special' || canUseFightHatsu(fighter)
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
  if (!attackCanResolve(attacker)) return state
  const defenderSide = otherSide(side)
  const defender = state[defenderSide]
  const collision = attackCollision(attacker, defender)
  if (!collision) return state
  const data = attackData(attacker.attack.kind, attacker)
  const blocked = defender.blocking && defender.y === GROUND
  const parried = parryActive(defender, blocked)
  const critical = isCriticalAuraStrike(attacker)
  const defended = parried ? focusGuardRyu(defender, data.targetZone) : defender
  const damage = parried
    ? 0
    : attackDamage({
        attacker,
        defender: defended,
        base: data.damage,
        blocked,
        zone: data.targetZone,
      })
  const spent = releaseFocusedAura({
    ...attacker,
    attack: { ...attacker.attack, impacted: true, auraCharged: false },
  })
  const struck = strikeDefender({ fighter: defended, attacker, damage, blocked })
  const points = scoreForImpact(blocked, critical)
  const score = { ...state.score, [side]: state.score[side] + points }
  const impact = {
    sequence: (state.impact?.sequence ?? 0) + 1,
    attacker: side,
    kind: attacker.attack.kind,
    damage,
    blocked,
    parried,
    critical,
    points,
    zone: data.targetZone,
    position: collision.position,
  }
  const next = {
    ...state,
    [side]: spent,
    [defenderSide]: struck,
    score,
    impact,
    hitstop: data.hitstop,
  }
  return struck.health === 0 || score[side] >= TOWER_WIN_SCORE ? finishFight(next, side) : next
}

function attackCanResolve(
  fighter: ArcadeFighter,
): fighter is ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> } {
  return Boolean(fighter.attack && !fighter.attack.impacted && attackPhase(fighter) === 'active')
}

function parryActive(fighter: ArcadeFighter, blocked: boolean): boolean {
  return blocked && fighter.guardFrames > 0 && fighter.guardFrames <= PARRY_WINDOW_FRAMES
}

function scoreForImpact(blocked: boolean, critical: boolean): number {
  if (blocked) return 0
  return critical ? 2 : 1
}

function attackCollision(attacker: ArcadeFighter, defender: ArcadeFighter) {
  const hitbox = activeHitbox(attacker)
  if (!hitbox) return null
  const hurtbox = hurtboxes(defender).find((candidate) => boxesOverlap(hitbox, candidate))
  return hurtbox ? { position: contactPoint(hitbox, hurtbox) } : null
}

interface DamageOptions {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  base: number
  blocked: boolean
  zone: FightNenZone
}

function attackDamage({ attacker, defender, base, blocked, zone }: DamageOptions): number {
  if (blocked && defender.nen.ken) return 0
  const power = fighterDefinition(attacker.id).power
  const guard = blocked ? 0.28 : 1
  const kind = attacker.attack?.kind ?? 'light'
  return Math.max(
    1,
    Math.round(
      base * power * nenAttackFactor(attacker, kind) * nenDamageFactor(defender, zone) * guard,
    ),
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
  const attack = chooseStyleAttack(rolled.opponent.id, {
    canSpecial: canUseFightHatsu(rolled.opponent) && gap <= definition.specialRange,
    inRange: gap <= definition.reach + 2,
    roll: chance,
  })
  return attack ? performAttack(rolled, 'opponent', attack) : rolled
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
  if (state.score.player !== state.score.opponent) {
    return finishFight(state, state.score.player > state.score.opponent ? 'player' : 'opponent')
  }
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
