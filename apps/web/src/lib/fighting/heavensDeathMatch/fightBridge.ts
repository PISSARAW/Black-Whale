import { FIGHT_WORLD_X, FIGHT_WORLD_Y, fightWorldX, fightWorldY } from '../fightCoordinates'
import { recordFightDeath } from '../fightDeaths'
import { resolveFightOutcome } from '../fightOutcome'
import type { ArcadeFighter, AttackKind, FightSide, FightState } from '../types'
import { beatSpec, type DeathMatchBeat } from './acts'
import { chrolloPhase, frontierBeat, inCrowdPhase } from './chrolloPlan/phases'
import { stepDeathMatchWorld } from './chrolloPlan/simulate'
import type { ChrolloIntent } from './chrolloPlan/tactics'
import type { DeathMatchWorld } from './chrolloPlan/world'
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

/** Beats the engine measures (wounds, burial, death) until it reports them itself. */
const ENGINE_MEASURED = new Set<DeathMatchBeat>([
  'true-face-revealed',
  'head-body-link-tracked',
  'hand-destroyed',
  'leg-destroyed',
  'hisoka-buried',
  'hisoka-asphyxiated',
])
/** Stand-in for Hisoka's side: his beats are credited after this wait, until P1 reads them. */
export const STAND_IN_DELAY = 2 * 60

function standInBeats(world: DeathMatchWorld): DeathMatchBeat[] {
  const front = frontierBeat(world.scenario)
  if (!front || world.crowd.frame - world.scenario.frame < STAND_IN_DELAY) return []
  return beatSpec(front).actor === 'hisoka' || ENGINE_MEASURED.has(front) ? [front] : []
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
 * Who moves Chrollo. The plan does whenever he is in the stands, and always when he is the
 * AI; a player who chose Chrollo keeps his body while he stays in the ring.
 */
function planLeads(state: FightState, world: DeathMatchWorld): boolean {
  const { chrollo } = deathMatchSides(state)
  return chrolloInStands(world) || (state.mode !== 'versus-local' && chrollo === 'opponent')
}

/** In the ring the plan only slides him along the lane; he can still strike and be struck. */
function followPlan(state: FightState, side: FightSide, at: Vec3): FightState {
  const lane = hallToLane(at)
  return { ...state, [side]: { ...state[side], x: Math.min(100, Math.max(0, lane.x)) } }
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

/** Each blast in reach of Hisoka hurts him, less behind ordinary bodies. */
function blastHisoka(state: FightState, blasts: readonly Blast[], world: DeathMatchWorld) {
  const side = deathMatchSides(state).hisoka
  const at = laneToHall(state[side])
  let damage = 0
  for (const blast of blasts) {
    const gap = Math.hypot(blast.at.x - at.x, blast.at.z - at.z)
    if (gap > blastRadius(blast.power).reach) continue
    damage += 6 * shieldedPower(world.crowd, blast, at)
  }
  if (!damage) return state
  return { ...state, [side]: { ...state[side], health: state[side].health - damage } }
}

/** Buried under the bodies, Hisoka dies of asphyxia: the only death that ends this bout. */
function asphyxiate(state: FightState, world: DeathMatchWorld): FightState {
  if (!world.scenario.done.includes('hisoka-asphyxiated')) return state
  const { hisoka, chrollo } = deathMatchSides(state)
  const dead = { ...state, [hisoka]: { ...state[hisoka], health: 0, pose: 'ko' as const } }
  return resolveFightOutcome(
    recordFightDeath(dead, {
      victimSide: hisoka,
      killerSide: chrollo,
      cause: 'asphyxia',
      fatalCondition: true,
    }),
  )
}

/**
 * One frame of the hall after one frame of the duel. In the ring the engine leads Chrollo;
 * once he is in the stands the plan leads and the lane only keeps his place.
 */
export function stepDeathMatchFight(state: FightState, attack: PerformAttack): FightState {
  const world = state.deathMatch
  if (!world || state.phase !== 'fighting') return state
  const sides = deathMatchSides(state)
  const hisoka = state[sides.hisoka]
  const led = planLeads(state, world)
    ? world
    : { ...world, chrollo: { ...world.chrollo, at: laneToHall(state[sides.chrollo]) } }
  const frame = stepDeathMatchWorld(led, {
    hisoka: {
      at: laneToHall(hisoka),
      facing: { x: hisoka.facing, z: 0 },
      busy: busy(hisoka),
      gumAnchors: [],
    },
    reported: standInBeats(world),
  })
  let next: FightState = { ...state, deathMatch: frame.world }
  if (chrolloInStands(frame.world)) next = parkChrollo(next, sides.chrollo, frame.world.chrollo.at)
  else if (planLeads(next, frame.world))
    next = followPlan(next, sides.chrollo, frame.world.chrollo.at)
  next = performIntent(next, { side: sides.chrollo, intent: frame.outcome.engineIntent }, attack)
  next = blastHisoka(next, frame.blasts, frame.world)
  return asphyxiate(next, frame.world)
}

/** Where the renderer draws a fighter of a death match, in lane units plus depth in metres. */
export function deathMatchBodyPosition(
  state: FightState,
  side: FightSide,
  lane: { x: number; y: number; z?: number },
): { x: number; y: number; z?: number } {
  const world = state.deathMatch
  if (!world || side !== deathMatchSides(state).chrollo || !chrolloInStands(world)) return lane
  return hallToLane(world.chrollo.at)
}
