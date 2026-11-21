import { PIT } from '../../heavensArenaLayout'
import { damagedGroundY, type StandsDamage } from '../stands/damage'
import { landingSurface, railBetween, type Vec3 } from '../stands/geometry'
import { arenaGraph, nearestExitRoute, nearestNode } from '../stands/navigation'
import { crowdLod } from './lod'
import { living, present, type CrowdState, type Spectator } from './types'

export const DT = 1 / 60
export const PANIC_FEAR = 0.6
const GRAVITY = 9.8
const FLEE_SPEED = 2.4
const PUPPET_SPEED = 2.8
const BODY_RADIUS = 0.32
const FIGHTER_RADIUS = 0.7
const RESCUE_EVERY = 90

export interface CrowdContext {
  fighters: readonly Vec3[]
  /** Where the camera looks: decides each body's level of detail. */
  focus: Vec3
  damage: StandsDamage
  /** Rescue teams are inside the hall and carry bodies out. */
  rescue: boolean
}

const routeCache = new Map<string, readonly string[]>()

function exitRoute(at: Vec3): readonly string[] {
  const graph = arenaGraph()
  const start = nearestNode(graph, at).id
  if (!routeCache.has(start)) routeCache.set(start, nearestExitRoute(graph, at))
  return routeCache.get(start)!
}

function toward(at: Vec3, target: Vec3, step: number): { at: Vec3; arrived: boolean } {
  const dx = target.x - at.x
  const dy = target.y - at.y
  const dz = target.z - at.z
  const distance = Math.hypot(dx, dy, dz)
  if (distance <= step) return { at: target, arrived: true }
  const k = step / distance
  return { at: { x: at.x + dx * k, y: at.y + dy * k, z: at.z + dz * k }, arrived: false }
}

function calm(spectator: Spectator): Spectator {
  const fear = Math.max(0, spectator.fear - 0.002)
  if (spectator.nature === 'human' && fear >= PANIC_FEAR)
    return { ...spectator, fear, posture: 'fleeing', route: exitRoute(spectator.at), routeIndex: 0 }
  if (spectator.goal) return followGoal({ ...spectator, fear })
  return { ...spectator, fear, posture: fear > 0.25 ? 'standing' : spectator.posture }
}

function followGoal(spectator: Spectator): Spectator {
  const moved = toward(spectator.at, spectator.goal!, PUPPET_SPEED * DT)
  return {
    ...spectator,
    at: moved.at,
    posture: 'standing',
    goal: moved.arrived ? undefined : spectator.goal,
  }
}

function flee(spectator: Spectator): Spectator {
  const node = arenaGraph().nodes.get(spectator.route[spectator.routeIndex])
  if (!node) return { ...spectator, posture: 'evacuated' }
  const speed = FLEE_SPEED * Math.max(0.4, spectator.health / 100)
  const moved = toward(spectator.at, node.at, speed * DT)
  if (!moved.arrived) return { ...spectator, at: moved.at }
  const routeIndex = spectator.routeIndex + 1
  const done = routeIndex >= spectator.route.length
  return { ...spectator, at: moved.at, routeIndex, posture: done ? 'evacuated' : 'fleeing' }
}

function fall(spectator: Spectator, damage: StandsDamage): Spectator {
  const velocity = { ...spectator.velocity, y: spectator.velocity.y - GRAVITY * DT }
  const at = {
    x: spectator.at.x + velocity.x * DT,
    y: spectator.at.y + velocity.y * DT,
    z: spectator.at.z + velocity.z * DT,
  }
  const surface = landingSurface(at)
  const groundY =
    surface?.kind === 'balcony' ? surface.y : (damagedGroundY(damage, at.x, at.z) ?? -PIT)
  if (velocity.y > 0 || at.y > groundY) return { ...spectator, at, velocity }
  const injury = Math.max(0, (-velocity.y - 4) * 12)
  const health = spectator.health - injury
  return {
    ...spectator,
    at: { ...at, y: groundY },
    velocity: { x: 0, y: 0, z: 0 },
    health,
    posture: health <= 0 ? 'dead' : 'injured',
    cause: health <= 0 ? 'fall' : spectator.cause,
  }
}

function moveOne(spectator: Spectator, damage: StandsDamage): Spectator {
  switch (spectator.posture) {
    case 'seated':
    case 'standing':
      return calm(spectator)
    case 'fleeing':
      return flee(spectator)
    case 'airborne':
      return fall(spectator, damage)
    default:
      return spectator
  }
}

const cellKey = (x: number, z: number) => `${Math.floor(x / 0.8)}:${Math.floor(z / 0.8)}`

function spatialHash(spectators: readonly Spectator[]): Map<string, number[]> {
  const cells = new Map<string, number[]>()
  spectators.forEach((spectator, index) => {
    if (!present(spectator) || spectator.posture === 'airborne') return
    const key = cellKey(spectator.at.x, spectator.at.z)
    const cell = cells.get(key)
    if (cell) cell.push(index)
    else cells.set(key, [index])
  })
  return cells
}

function neighbours(cells: Map<string, number[]>, at: Vec3): number[] {
  const cx = Math.floor(at.x / 0.8)
  const cz = Math.floor(at.z / 0.8)
  const found: number[] = []
  for (let dx = -1; dx <= 1; dx += 1)
    for (let dz = -1; dz <= 1; dz += 1) found.push(...(cells.get(`${cx + dx}:${cz + dz}`) ?? []))
  return found
}

const moving = (spectator: Spectator) =>
  spectator.posture === 'fleeing' || (spectator.posture === 'standing' && Boolean(spectator.goal))

interface ContactPass {
  spectators: Spectator[]
  cells: Map<string, number[]>
  context: CrowdContext
}

function contactsOf(
  pass: ContactPass,
  index: number,
): { push: { x: number; z: number }; dense: number } {
  const spectator = pass.spectators[index]
  const push = { x: 0, z: 0 }
  let dense = 0
  for (const other of neighbours(pass.cells, spectator.at)) {
    if (other === index) continue
    const body = pass.spectators[other]
    const dx = spectator.at.x - body.at.x
    const dz = spectator.at.z - body.at.z
    const distance = Math.hypot(dx, dz) || 1e-3
    if (distance < 0.45) dense += 1
    if (distance >= BODY_RADIUS * 2) continue
    push.x += (dx / distance) * 0.02
    push.z += (dz / distance) * 0.02
  }
  return { push, dense }
}

/** Bodies push apart; a dense moving crowd crushes; nothing is pushed through a rail. */
function separate(pass: ContactPass, index: number): void {
  const spectator = pass.spectators[index]
  if (!moving(spectator) || crowdLod(spectator, pass.context.focus) === 'far') return
  const { push, dense } = contactsOf(pass, index)
  const target = { ...spectator.at, x: spectator.at.x + push.x, z: spectator.at.z + push.z }
  const at = railBetween(spectator.at, target) ? spectator.at : target
  const crushed = dense >= 5 ? spectator.health - 0.15 : spectator.health
  pass.spectators[index] =
    crushed <= 0
      ? { ...spectator, at, health: 0, posture: 'dead', cause: 'crush' }
      : { ...spectator, at, health: crushed }
}

/** A fighter shoves bodies aside; pushed over the pit barrier, a spectator falls. */
function shove(spectator: Spectator, fighter: Vec3): Spectator {
  if (!living(spectator) || spectator.posture === 'airborne' || spectator.posture === 'held')
    return spectator
  const dx = spectator.at.x - fighter.x
  const dz = spectator.at.z - fighter.z
  const distance = Math.hypot(dx, dz)
  if (distance >= FIGHTER_RADIUS || Math.abs(spectator.at.y - fighter.y) > 1.6) return spectator
  const k = (FIGHTER_RADIUS - distance) / (distance || 1e-3)
  const target = { ...spectator.at, x: spectator.at.x + dx * k, z: spectator.at.z + dz * k }
  if (!railBetween(spectator.at, target))
    return { ...spectator, at: target, fear: Math.max(spectator.fear, PANIC_FEAR) }
  return {
    ...spectator,
    posture: 'airborne',
    velocity: { x: dx * 2, y: 1.5, z: Math.sign(dz || 1) * 2 },
  }
}

function rescue(spectators: Spectator[], frame: number): void {
  if (frame % RESCUE_EVERY !== 0) return
  const index = spectators.findIndex(
    (spectator) => spectator.posture === 'dead' || spectator.posture === 'injured',
  )
  if (index >= 0) spectators[index] = { ...spectators[index], posture: 'evacuated' }
}

/** One simulation frame for every body in the hall. */
export function stepCrowd(crowd: CrowdState, context: CrowdContext): CrowdState {
  const spectators = crowd.spectators.map((spectator) => moveOne(spectator, context.damage))
  const pass: ContactPass = { spectators, cells: spatialHash(spectators), context }
  for (let index = 0; index < spectators.length; index += 1) separate(pass, index)
  for (const fighter of context.fighters)
    for (let index = 0; index < spectators.length; index += 1)
      spectators[index] = shove(spectators[index], fighter)
  const frame = crowd.frame + 1
  if (context.rescue) rescue(spectators, frame)
  return { ...crowd, frame, spectators }
}
