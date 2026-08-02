import type { WallSegment } from '../tour/types'
import type { BodyZone, CombatEvent, CombatSide, FighterState, Impact } from './types'

export const STRIKE_RANGE = 2.2

interface Exchange {
  attacker: FighterState
  defender: FighterState
  attackerSide: CombatSide
  zone: BodyZone
  technique: 'strike' | 'ko' | 'hatsu'
  power?: number
  range?: number
  targetAt?: FighterState['position']
  clock: number
  walls: WallSegment[]
}

export interface ExchangeResult {
  attacker: FighterState
  defender: FighterState
  event: CombatEvent
}

export function resolveExchange(exchange: Exchange): ExchangeResult {
  const inRange =
    distance(exchange.attacker.position, exchange.defender.position) <=
    (exchange.range ?? STRIKE_RANGE)
  if (!inRange || isObstructed(exchange)) return resultOf(exchange, 'miss')
  if (
    exchange.targetAt &&
    distanceToLine(exchange.defender.position, exchange.attacker.position, exchange.targetAt) > 0.7
  )
    return resultOf(exchange, 'miss')

  const offence = offensiveAura(exchange.attacker, exchange.technique) * (exchange.power ?? 1)
  const defence = defensiveAura(exchange.defender, exchange.zone)
  const impact = impactOf(offence, defence)
  return resultOf(exchange, impact)
}

function distanceToLine(
  point: FighterState['position'],
  start: FighterState['position'],
  end: FighterState['position'],
): number {
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  const lengthSquared = dx * dx + dz * dz
  if (lengthSquared === 0) return distance(point, start)
  const t = Math.max(
    0,
    Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) / lengthSquared),
  )
  return distance(point, [start[0] + dx * t, start[1] + dz * t])
}

function isObstructed(exchange: Exchange): boolean {
  return exchange.walls.some((wall) =>
    crosses({
      from: exchange.attacker.position,
      to: exchange.defender.position,
      wall,
    }),
  )
}

function crosses(reading: {
  from: FighterState['position']
  to: FighterState['position']
  wall: WallSegment
}): boolean {
  const [a, b] = [reading.from, reading.to]
  const [c, d] = [reading.wall.start, reading.wall.end]
  const denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0])
  if (Math.abs(denominator) < 1e-9) return false
  const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / denominator
  const u = -((a[0] - b[0]) * (a[1] - c[1]) - (a[1] - b[1]) * (a[0] - c[0])) / denominator
  return t > 0.05 && t < 0.95 && u >= 0 && u <= 1
}

function distance(a: FighterState['position'], b: FighterState['position']): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

export function offensiveAura(fighter: FighterState, technique: 'strike' | 'ko' | 'hatsu'): number {
  if (fighter.mode === 'zetsu' || fighter.condition === 'down' || fighter.condition === 'ko') {
    return 0
  }
  const output = fighter.mode === 'ren' ? 1 : 0.65
  if (technique === 'ko') return output * 1.8
  const kenPenalty = fighter.ken ? 0.55 : 1
  return output * fighter.attackShare * kenPenalty
}

export function defensiveAura(fighter: FighterState, zone: BodyZone): number {
  if (fighter.mode === 'zetsu' || fighter.condition === 'down' || fighter.condition === 'ko') {
    return 0
  }
  const output = fighter.mode === 'ren' ? 1 : 0.65
  if (fighter.ken) return output * (fighter.guardWindow > 0 ? 0.92 : 0.72)

  const reserve = output * (1 - fighter.attackShare)
  if (zone === fighter.guard) return reserve * (fighter.guardWindow > 0 ? 2.15 : 1.5)
  return reserve * 0.45
}

export function impactOf(offence: number, defence: number): Impact {
  if (offence <= 0) return 'blocked'
  if (defence <= 0) return 'ko'
  const ratio = offence / defence
  if (ratio < 0.8) return 'blocked'
  if (ratio < 1.25) return 'clean'
  if (ratio < 1.8) return 'critical'
  if (ratio < 2.5) return 'knockdown'
  return 'ko'
}

function resultOf(exchange: Exchange, impact: Impact): ExchangeResult {
  const points = pointsFor(impact)
  return {
    attacker: { ...exchange.attacker, cooldown: exchange.technique === 'ko' ? 1.1 : 0.65 },
    defender: applyImpact(exchange.defender, impact),
    event: {
      at: exchange.clock,
      attacker: exchange.attackerSide,
      zone: exchange.zone,
      impact,
      points,
      technique: exchange.technique,
    },
  }
}

function applyImpact(fighter: FighterState, impact: Impact): FighterState {
  if (impact === 'ko') return { ...fighter, condition: 'ko', recovery: 0, movement: [0, 0] }
  if (impact === 'knockdown') {
    return { ...fighter, condition: 'down', recovery: 1.6, movement: [0, 0], ko: null }
  }
  if (impact === 'critical') return { ...fighter, condition: 'staggered', recovery: 0.55 }
  return fighter
}

function pointsFor(impact: Impact): number {
  if (impact === 'clean') return 1
  if (impact === 'critical') return 2
  if (impact === 'knockdown') return 3
  return 0
}
