import type { Blast } from '../stands/damage'
import type { Vec3 } from '../stands/geometry'
import { updateSpectator } from './create'
import { PANIC_FEAR } from './step'
import { living, type CrowdState, type Spectator } from './types'

/** Fear spreads from a point: close bodies panic, far ones only stand up. */
export function alarm(crowd: CrowdState, at: Vec3, intensity: number): CrowdState {
  const spectators = crowd.spectators.map((spectator) => {
    if (!living(spectator)) return spectator
    const distance = Math.hypot(spectator.at.x - at.x, spectator.at.z - at.z)
    const fear = Math.min(1, spectator.fear + intensity / (1 + distance / 6))
    return { ...spectator, fear }
  })
  return { ...crowd, spectators }
}

export function blastRadius(power: number): { lethal: number; reach: number } {
  return { lethal: 0.6 + power * 0.6, reach: 1.2 + power * 1.4 }
}

function blastOne(spectator: Spectator, blast: Blast): Spectator {
  if (!living(spectator)) return spectator
  const dx = spectator.at.x - blast.at.x
  const dz = spectator.at.z - blast.at.z
  const distance = Math.hypot(dx, spectator.at.y - blast.at.y, dz)
  const { lethal, reach } = blastRadius(blast.power)
  if (distance <= lethal)
    return { ...spectator, health: 0, posture: 'dead', cause: 'blast', gum: false }
  if (distance > reach) return spectator
  const strength = (reach - distance) / reach
  const health = spectator.health - strength * 70
  const away = distance || 1e-3
  return {
    ...spectator,
    health: Math.max(0, health),
    posture: health <= 0 ? 'dead' : 'airborne',
    cause: health <= 0 ? 'blast' : spectator.cause,
    velocity: { x: (dx / away) * strength * 6, y: 2 + strength * 3, z: (dz / away) * strength * 6 },
  }
}

/** A detonation kills inside its core, throws and wounds inside its reach, then alarms the hall. */
export function applyBlast(crowd: CrowdState, blast: Blast): CrowdState {
  const struck = {
    ...crowd,
    spectators: crowd.spectators.map((spectator) => blastOne(spectator, blast)),
  }
  return alarm(struck, blast.at, 0.5 + blast.power * 0.3)
}

/**
 * Ordinary bodies between a blast and its target soak part of it: the unintended shield
 * Chrollo's plain copies gave Hisoka. Each body within 0.6 m of the line takes a quarter.
 */
export function shieldedPower(crowd: CrowdState, blast: Blast, target: Vec3): number {
  let power = blast.power
  for (const body of crowd.spectators) {
    if (body.posture === 'vanished' || body.posture === 'evacuated' || body.marks.sun) continue
    if (distanceToSegment(body.at, blast.at, target) <= 0.6) power *= 0.75
  }
  return power
}

function distanceToSegment(point: Vec3, a: Vec3, b: Vec3): number {
  const abx = b.x - a.x
  const abz = b.z - a.z
  const length = abx * abx + abz * abz || 1e-6
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * abx + (point.z - a.z) * abz) / length))
  if (t <= 0.02 || t >= 0.98) return Infinity
  return Math.hypot(point.x - (a.x + abx * t), point.z - (a.z + abz * t))
}

/** Chrollo throws a body: it flies, lands, and is hurt by the fall. */
export function throwSpectator(crowd: CrowdState, id: string, velocity: Vec3): CrowdState {
  return updateSpectator(crowd, id, (spectator) =>
    living(spectator) ? { ...spectator, posture: 'airborne', velocity, gum: false } : spectator,
  )
}

/** Bungee Gum sticks to a body: it is held until pulled or released. */
export function attachGum(crowd: CrowdState, id: string): CrowdState {
  return updateSpectator(crowd, id, (spectator) =>
    spectator.posture === 'vanished'
      ? spectator
      : { ...spectator, gum: true, posture: 'held', fear: Math.max(spectator.fear, PANIC_FEAR) },
  )
}

/** The gum contracts: the body flies toward the anchor. */
export function pullGum(crowd: CrowdState, id: string, anchor: Vec3): CrowdState {
  return updateSpectator(crowd, id, (spectator) => {
    if (!spectator.gum) return spectator
    const dx = anchor.x - spectator.at.x
    const dz = anchor.z - spectator.at.z
    const flat = Math.hypot(dx, dz) || 1
    return {
      ...spectator,
      posture: 'airborne',
      gum: false,
      velocity: { x: (dx / flat) * 9, y: 3.5, z: (dz / flat) * 9 },
    }
  })
}

export function releaseGum(crowd: CrowdState, id: string): CrowdState {
  return updateSpectator(crowd, id, (spectator) =>
    spectator.gum
      ? { ...spectator, gum: false, posture: spectator.health > 0 ? 'standing' : 'dead' }
      : spectator,
  )
}
