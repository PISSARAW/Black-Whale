import { strikeDefender } from '../combatDamage'
import type { DetachedHead } from './crowd/types'
import { FIGHT_WORLD_X, FIGHT_WORLD_Y, fightWorldX, fightWorldY } from '../fightCoordinates'
import type { DamagedBodyPart } from '../bodyDamage'
import { recordFightDeath } from '../fightDeaths'
import type { ArcadeFighter, AttackKind, FightInput, FightSide, FightState } from '../types'
import { chrolloPhase, inCrowdPhase } from './chrolloPlan/phases'
import { stepDeathMatchWorld, type WorldInput } from './chrolloPlan/simulate'
import type { ChrolloIntent } from './chrolloPlan/tactics'
import { STARTING_DEPTH, type DeathMatchWorld } from './chrolloPlan/world'
import { blastRadius, shieldedPower } from './crowd/actions'
import type { Blast } from './stands/damage'
import { inRing, type Vec3 } from './stands/geometry'

/** The duel lane runs along the ring's long axis, through its centre. */
export const LANE_Z = 0

/** Lane units (x 0-100, y up) to metres in the hall. */
export function laneToHall(fighter: Pick<ArcadeFighter, 'x' | 'y'>): Vec3 {
  return { x: fightWorldX(fighter.x), y: fightWorldY(fighter.y), z: LANE_Z }
}

/** Metres in the hall to lane units; x is not clamped, so the stands lie beyond 0-100. */
export function hallToLane(at: Vec3): { x: number; y: number; z: number } {
  return { x: 50 + at.x / FIGHT_WORLD_X, y: Math.max(0, at.y) / FIGHT_WORLD_Y, z: at.z }
}

const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')

export function deathMatchSides(state: FightState): { chrollo: FightSide; hisoka: FightSide } {
  const chrollo = state.deathMatch?.scenario.options.chrolloSide ?? 'opponent'
  return { chrollo, hisoka: other(chrollo) }
}

/** Chrollo has left the ring for the stands: the plan, not the lane, places him. */
export function chrolloInStands(world: DeathMatchWorld): boolean {
  return (
    inCrowdPhase(chrolloPhase(world.scenario)) && !inRing(world.chrollo.at.x, world.chrollo.at.z)
  )
}

function busy(fighter: ArcadeFighter): boolean {
  return fighter.attack !== null || fighter.hitStun > 0 || fighter.blockStun > 0
}

/** The lane holds Chrollo where the plan put him, out of reach while he is in the stands. */
function parkChrollo(state: FightState, side: FightSide, at: Vec3): FightState {
  const fighter = state[side]
  const lane = hallToLane(at)
  return {
    ...state,
    [side]: {
      ...fighter,
      x: Math.min(100, Math.max(0, lane.x)),
      y: 0,
      velocityY: 0,
      attack: null,
      bufferedAttack: null,
      blocking: false,
      wakeupInvulnerableFrames: Math.max(fighter.wakeupInvulnerableFrames, 2),
    },
  }
}

/**
 * Who moves Chrollo. The plan owns a scripted replay, the CPU and every trip through the
 * stands; a player in a freer mode keeps his body while he stays in the ring.
 */
function planLeads(state: FightState, world: DeathMatchWorld): boolean {
  const { chrollo } = deathMatchSides(state)
  return (
    world.scenario.options.playMode === 'scripted' ||
    chrolloInStands(world) ||
    (state.mode !== 'versus-local' && chrollo === 'opponent')
  )
}

/** Scripted replay controls Hisoka; otherwise his canonical plan controls only a CPU Hisoka. */
function hisokaPlanLeads(state: FightState, world: DeathMatchWorld): boolean {
  const { hisoka } = deathMatchSides(state)
  return (
    world.scenario.options.playMode === 'scripted' ||
    (state.mode !== 'versus-local' && hisoka === 'opponent')
  )
}

/** In the ring the plan only slides him along the lane; he can still strike and be struck. */
function followPlan(state: FightState, side: FightSide, at: Vec3): FightState {
  const lane = hallToLane(at)
  return {
    ...state,
    [side]: {
      ...state[side],
      x: Math.min(100, Math.max(0, lane.x)),
      y: lane.y,
      velocityY: 0,
    },
  }
}

const ENGINE_ATTACK: Partial<Record<ChrolloIntent['kind'], 'light' | 'heavy'>> = {
  'feint-kicks': 'light',
  'surprise-strike': 'heavy',
}

/** The engine's own attack, passed in so this module never imports the engine back. */
export type PerformAttack = (state: FightState, side: FightSide, kind: AttackKind) => FightState

function performIntent(
  state: FightState,
  intent: { side: FightSide; intent: ChrolloIntent | null },
  attack: PerformAttack,
) {
  const kind = intent.intent && ENGINE_ATTACK[intent.intent.kind]
  return kind && !state[intent.side].attack ? attack(state, intent.side, kind) : state
}

/** The physical contact has already been confirmed in the hall. */
function strikeChrollo(state: FightState, head: DetachedHead): FightState {
  const { hisoka, chrollo } = deathMatchSides(state)
  const defender = state[chrollo]
  const damage = Math.min(18, Math.max(0, defender.health - 1))
  const hit = strikeDefender({
    fighter: defender,
    attacker: state[hisoka],
    zone: 'torso',
    damage,
    blocked: false,
    knockdown: false,
    antiAir: false,
    wallSplat: false,
    counterHit: false,
    comboHits: 1,
  })
  return {
    ...state,
    [chrollo]: { ...hit, x: defender.x },
    hitstop: Math.max(state.hitstop, 4),
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: hisoka,
      kind: 'ranged',
      damage,
      zone: 'torso',
      blocked: false,
      parried: false,
      critical: false,
      knockdown: false,
      counterHit: false,
      punish: false,
      antiAir: false,
      wallSplat: false,
      invulnerable: false,
      concealed: false,
      avoided: false,
      comboHits: 1,
      damageScale: 1,
      points: 0,
      projectileId: null,
      position: hallToLane(head.at),
    },
  }
}

/** Each blast in reach of Hisoka hurts him, less behind ordinary bodies. */
function blastHisoka(state: FightState, blasts: readonly Blast[], world: DeathMatchWorld) {
  const side = deathMatchSides(state).hisoka
  const at = world.hisoka.at
  let damage = 0
  for (const blast of blasts) {
    const gap = Math.hypot(blast.at.x - at.x, blast.at.y - at.y, blast.at.z - at.z)
    if (gap > blastRadius(blast.power).reach) continue
    damage += 6 * shieldedPower(world.crowd, blast, at)
  }
  if (!damage) return state
  const { difficulty, playMode } = world.scenario.options
  const scale = playMode === 'scripted' ? 1 : { canonical: 1, normal: 0.7, free: 0.4 }[difficulty]
  return {
    ...state,
    [side]: { ...state[side], health: Math.max(1, state[side].health - damage * scale) },
  }
}

/** The hall's anatomical wounds drive the duel renderer and its prosthesis mechanics too. */
function syncHisokaDamage(state: FightState, world: DeathMatchWorld): FightState {
  const side = deathMatchSides(state).hisoka
  const fighter = state[side]
  const parts = new Set<DamagedBodyPart>(fighter.bodyDamage?.parts ?? [])
  if (world.hisoka.wounds.leftFingers >= 4) parts.add('left-hand')
  if (world.hisoka.wounds.rightLowerLeg) parts.add('right-lower-leg')
  if (world.scenario.done.includes('final-explosion')) {
    parts.add('facial-surface')
    parts.add('neck-surface')
  }
  if (parts.size === (fighter.bodyDamage?.parts.length ?? 0)) return state
  return { ...state, [side]: { ...fighter, bodyDamage: { parts: [...parts] } } }
}

/** Buried under the bodies, Hisoka dies of asphyxia: the only death that ends this bout. */
function asphyxiate(state: FightState, world: DeathMatchWorld): FightState {
  if (!world.scenario.done.includes('hisoka-asphyxiated')) return state
  const { hisoka, chrollo } = deathMatchSides(state)
  const dead = { ...state, [hisoka]: { ...state[hisoka], health: 0, pose: 'ko' as const } }
  return recordFightDeath(dead, {
    victimSide: hisoka,
    killerSide: chrollo,
    cause: 'asphyxia',
    fatalCondition: true,
  })
}

function offDuelLane(at: Vec3): boolean {
  return at.z !== LANE_Z && at.z !== STARTING_DEPTH
}

/** The hall keeps depth after the player releases Context. Horizontal input still moves
 * against the duel lane; a held Context lets Bungee Gum guide the whole trajectory. */
function manualHisokaPosition(state: FightState, side: FightSide, world: DeathMatchWorld): Vec3 {
  const lane = laneToHall(state[side])
  const at = world.hisoka.at
  if (at.z === LANE_Z) return lane
  const previous = state.previousPositions?.[side]
  return {
    ...at,
    x: at.x + (previous ? lane.x - fightWorldX(previous.x) : 0),
    y: at.z === STARTING_DEPTH ? lane.y : at.y,
  }
}

function hallHisokaInput(
  state: FightState,
  world: DeathMatchWorld,
  request: { side: FightSide; context?: boolean },
): Pick<WorldInput, 'hisoka' | 'hisokaPlan' | 'hisokaAction'> {
  const fighter = state[request.side]
  const occupied = busy(fighter)
  if (hisokaPlanLeads(state, world)) return { hisoka: { busy: occupied }, hisokaPlan: true }
  const contextual = Boolean(request.context) && !occupied
  return {
    hisoka: {
      at: contextual ? world.hisoka.at : manualHisokaPosition(state, request.side, world),
      facing: contextual ? world.hisoka.facing : { x: fighter.facing, z: 0 },
      busy: occupied,
    },
    hisokaAction: contextual,
  }
}

function syncChrollo(state: FightState, side: FightSide, world: DeathMatchWorld): FightState {
  if (!planLeads(state, world)) return state
  const next = { ...state, [side]: { ...state[side], chrolloBook: world.chrollo.book } }
  return chrolloInStands(world)
    ? parkChrollo(next, side, world.chrollo.at)
    : followPlan(next, side, world.chrollo.at)
}

/**
 * One frame of the hall after one frame of the duel. In the ring the engine leads Chrollo;
 * once he is in the stands the plan leads and the lane only keeps his place.
 */
export function stepDeathMatchFight(
  state: FightState,
  attack: PerformAttack,
  inputs: Partial<Record<FightSide, FightInput>> = {},
): FightState {
  const world = state.deathMatch
  if (!world || state.phase !== 'fighting') return state
  const sides = deathMatchSides(state)
  const hisokaInput = hallHisokaInput(state, world, {
    side: sides.hisoka,
    context: inputs[sides.hisoka]?.context,
  })
  const led = planLeads(state, world)
    ? world
    : { ...world, chrollo: { ...world.chrollo, at: laneToHall(state[sides.chrollo]) } }
  const frame = stepDeathMatchWorld(led, hisokaInput)
  let next = syncChrollo({ ...state, deathMatch: frame.world }, sides.chrollo, frame.world)
  if (hisokaInput.hisokaPlan || hisokaInput.hisokaAction || offDuelLane(frame.world.hisoka.at))
    next = followPlan(next, sides.hisoka, frame.world.hisoka.at)
  next = performIntent(next, { side: sides.chrollo, intent: frame.outcome.engineIntent }, attack)
  if (frame.chrolloHit) next = strikeChrollo(next, frame.chrolloHit)
  next = blastHisoka(next, frame.blasts, frame.world)
  next = syncHisokaDamage(next, frame.world)
  return asphyxiate(next, frame.world)
}

/** Where the renderer draws a fighter of a death match, in lane units plus depth in metres. */
export function deathMatchBodyPosition(
  state: FightState,
  side: FightSide,
  lane: { x: number; y: number; z?: number },
): { x: number; y: number; z?: number } {
  const world = state.deathMatch
  if (!world) return lane
  const sides = deathMatchSides(state)
  if (side === sides.hisoka && (hisokaPlanLeads(state, world) || offDuelLane(world.hisoka.at)))
    return hallToLane(world.hisoka.at)
  if (side === sides.chrollo && chrolloInStands(world)) return hallToLane(world.chrollo.at)
  return lane
}
