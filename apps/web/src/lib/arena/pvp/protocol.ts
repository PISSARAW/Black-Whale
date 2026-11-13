import type { BodyZone, CombatSide } from '../../combat/types'
import type { Vec2 } from '../../tour/types'
import type { NetworkAction } from './serverMatch'

const ZONES: readonly BodyZone[] = ['head', 'torso', 'arms', 'legs']
const SIDES: readonly CombatSide[] = ['player', 'opponent']
type ActionRecord = Record<string, unknown>
type ActionParser = (value: ActionRecord, side: CombatSide) => NetworkAction | null

const PARSERS: Record<string, ActionParser> = {
  MOVE: (value, side) => movement('MOVE', value, side),
  EVADE: (value, side) => movement('EVADE', value, side),
  MODE: mode,
  RYU: ryu,
  GYO: (value, side) => toggle('GYO', value, side),
  IN: (value, side) => toggle('IN', value, side),
  KEN: (value, side) => toggle('KEN', value, side),
  GUARD: (_value, side) => ({ type: 'GUARD', side }),
  FEINT: (value, side) => targeted('FEINT', value, side),
  STRIKE: (value, side) => targeted('STRIKE', value, side),
  KO: (value, side) => targeted('KO', value, side),
}

/** Narrow the public PvP protocol to bounded, direct combat commands. */
export function parseNetworkAction(value: unknown): NetworkAction | null {
  if (!record(value) || !SIDES.includes(value.side as CombatSide)) return null
  const parser = PARSERS[String(value.type)]
  return parser?.(value, value.side as CombatSide) ?? null
}

function movement(
  type: 'MOVE' | 'EVADE',
  value: ActionRecord,
  side: CombatSide,
): NetworkAction | null {
  const vector = vec2(value.vector)
  return vector ? { type, side, vector } : null
}

function mode(value: ActionRecord, side: CombatSide): NetworkAction | null {
  return ['ten', 'ren', 'zetsu'].includes(String(value.mode))
    ? { type: 'MODE', side, mode: value.mode as 'ten' | 'ren' | 'zetsu' }
    : null
}

function ryu(value: ActionRecord, side: CombatSide): NetworkAction | null {
  const attackShare = value.attackShare
  const guard = zone(value.guard)
  if (attackShare !== undefined && (!finite(attackShare) || attackShare < 0 || attackShare > 1))
    return null
  if (value.guard !== undefined && !guard) return null
  return {
    type: 'RYU',
    side,
    ...(attackShare === undefined ? {} : { attackShare }),
    ...(guard ? { guard } : {}),
  }
}

function toggle(
  type: 'GYO' | 'IN' | 'KEN',
  value: ActionRecord,
  side: CombatSide,
): NetworkAction | null {
  return typeof value.on === 'boolean' ? { type, side, on: value.on } : null
}

function targeted(
  type: 'FEINT' | 'STRIKE' | 'KO',
  value: ActionRecord,
  side: CombatSide,
): NetworkAction | null {
  const target = zone(value.zone)
  return target ? { type, side, zone: target } : null
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function vec2(value: unknown): Vec2 | null {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(finite)) return null
  const vector: Vec2 = [value[0], value[1]]
  return Math.hypot(...vector) <= 1.001 ? vector : null
}

function zone(value: unknown): BodyZone | null {
  return ZONES.includes(value as BodyZone) ? (value as BodyZone) : null
}
