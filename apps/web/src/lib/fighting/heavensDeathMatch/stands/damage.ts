import { groundAt, type Surface, type Vec3 } from './geometry'

export interface Crater {
  x: number
  z: number
  radius: number
  depth: number
}

export interface Zone {
  x: number
  z: number
  radius: number
  /** Frames left; 0 is gone. */
  frames: number
}

/** Local destruction of the hall: craters, broken seats, fires and smoke. */
export interface StandsDamage {
  craters: readonly Crater[]
  fires: readonly Zone[]
  smoke: readonly (Zone & { density: number })[]
  /** Seats torn from their row, by "tier:x" key rounded to the metre. */
  brokenSeats: readonly string[]
  impacts: readonly Vec3[]
}

export const NO_DAMAGE: StandsDamage = {
  craters: [],
  fires: [],
  smoke: [],
  brokenSeats: [],
  impacts: [],
}

export interface Blast {
  at: Vec3
  /** 1 is an instant mark; a full 3-5 s charge reaches about 3. */
  power: number
}

const SMOKE_FRAMES = 60 * 40
const FIRE_FRAMES = 60 * 25

/** A detonation leaves an impact, smoke, sometimes fire, a crater and broken seats. */
export function damageFromBlast(damage: StandsDamage, blast: Blast): StandsDamage {
  const { at, power } = blast
  const radius = 0.8 + power * 0.9
  const ground = groundAt(at.x, at.z)
  const craters =
    power >= 2 && ground
      ? [...damage.craters, { x: at.x, z: at.z, radius, depth: power * 0.25 }]
      : damage.craters
  const fires =
    power >= 1.5
      ? [...damage.fires, { x: at.x, z: at.z, radius: radius * 0.6, frames: FIRE_FRAMES }]
      : damage.fires
  const smoke = [
    ...damage.smoke,
    { x: at.x, z: at.z, radius: radius * 2, frames: SMOKE_FRAMES, density: 0.35 * power },
  ]
  return {
    ...damage,
    craters,
    fires,
    smoke,
    brokenSeats: seatsBroken(damage, blast, ground),
    impacts: [...damage.impacts, at],
  }
}

function seatsBroken(
  damage: StandsDamage,
  blast: Blast,
  ground: Surface | null,
): readonly string[] {
  if (ground?.tier === undefined) return damage.brokenSeats
  const reach = Math.round(blast.power)
  const keys = new Set(damage.brokenSeats)
  for (let dx = -reach; dx <= reach; dx += 1)
    keys.add(`${ground.tier}:${Math.round(blast.at.x) + dx}`)
  return [...keys]
}

/** Ground height lowered by every crater over the point. */
export function damagedGroundY(damage: StandsDamage, x: number, z: number): number | null {
  const ground = groundAt(x, z)
  if (!ground) return null
  let y = ground.y
  for (const crater of damage.craters) {
    const distance = Math.hypot(x - crater.x, z - crater.z)
    if (distance < crater.radius) y -= crater.depth * (1 - distance / crater.radius)
  }
  return y
}

export function burningAt(damage: StandsDamage, x: number, z: number): boolean {
  return damage.fires.some(
    (fire) => fire.frames > 0 && Math.hypot(x - fire.x, z - fire.z) <= fire.radius,
  )
}

/** Fires and smoke burn down; craters, seats and impacts stay. */
export function advanceDamage(damage: StandsDamage): StandsDamage {
  const tick = <T extends Zone>(zones: readonly T[]) =>
    zones.map((zone) => ({ ...zone, frames: zone.frames - 1 })).filter((zone) => zone.frames > 0)
  return { ...damage, fires: tick(damage.fires), smoke: tick(damage.smoke) }
}

/** 1 is a clear line of sight, 0 fully hidden by smoke, sampled along the segment. */
export function visibilityThroughSmoke(damage: StandsDamage, from: Vec3, to: Vec3): number {
  if (!damage.smoke.length) return 1
  let opacity = 0
  const samples = 10
  for (let index = 1; index < samples; index += 1) {
    const t = index / samples
    const x = from.x + (to.x - from.x) * t
    const z = from.z + (to.z - from.z) * t
    for (const cloud of damage.smoke)
      if (Math.hypot(x - cloud.x, z - cloud.z) <= cloud.radius) opacity += cloud.density / samples
  }
  return Math.max(0, 1 - opacity)
}
