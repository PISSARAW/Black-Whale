import type { TierPlan } from './blueprint'
import type { RoomCondition } from './roomCondition'
import { roomConditionOf } from './roomCondition'
import type { Space, Vec2 } from './types'

export type RoomSoundKind = 'none' | 'kitchen' | 'laundry' | 'casino' | 'medical' | 'recycling'

/** Numeric controls for the persistent, synthesised room graph. */
export interface RoomSoundProfile {
  kind: RoomSoundKind
  ventilation: { level: number; cutoff: number; resonance: number; wobble: number }
  crowd: { level: number; cutoff: number }
  accent: { level: number; frequency: number; rate: number; cutoff: number }
}

export interface HeardNeighbour {
  spaceId: string
  at: Vec2
  profile: RoomSoundProfile
}

const ACCENTS: Readonly<Record<RoomSoundKind, RoomSoundProfile['accent']>> = {
  none: { level: 0, frequency: 80, rate: 0.2, cutoff: 900 },
  kitchen: { level: 0.035, frequency: 176, rate: 0.7, cutoff: 1800 },
  laundry: { level: 0.055, frequency: 54, rate: 0.42, cutoff: 720 },
  casino: { level: 0.04, frequency: 248, rate: 1.2, cutoff: 2400 },
  medical: { level: 0.022, frequency: 880, rate: 0.34, cutoff: 3200 },
  recycling: { level: 0.065, frequency: 43, rate: 0.23, cutoff: 580 },
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** A function named by the blueprint itself, never inferred from atmosphere. */
export function roomSoundKindOf(
  space: Pick<Space, 'id' | 'category'>,
  finish: string,
): RoomSoundKind {
  if (/(?:^|-)kitchen(?:-|$)/.test(space.id)) return 'kitchen'
  if (/(?:^|-)laundry(?:-|$)/.test(space.id)) return 'laundry'
  if (finish === 'casino') return 'casino'
  if (space.category === 'medical' || finish === 'clinical' || finish === 'hold-clinic') {
    return 'medical'
  }
  if (finish === 'recycling' || /recycling|sewage/.test(space.id)) return 'recycling'
  return 'none'
}

/** The room's sound as continuous control values, with no Web Audio dependency. */
export function roomSoundProfileOf(space: Space, condition: RoomCondition): RoomSoundProfile {
  const instability = 1 - condition.ventilationStability
  const kind = roomSoundKindOf(space, condition.finish)
  return {
    kind,
    ventilation: {
      level: 0.018 + condition.airLoad * 0.055,
      cutoff: 1150 + condition.ventilationStability * 2450,
      resonance: 0.35 + instability * 2.4,
      wobble: instability,
    },
    crowd: {
      // This is the ADR-003 crowd channel: pressure without invented bodies or speech.
      level: Math.pow(clamp01(condition.humanDensity), 1.35) * 0.075,
      cutoff: 360 + condition.humanDensity * 720,
    },
    accent: ACCENTS[kind],
  }
}

export const soundEnergy = (profile: RoomSoundProfile): number =>
  profile.ventilation.level + profile.crowd.level + profile.accent.level

const midpoint = (start: Vec2, end: Vec2): Vec2 => [
  (start[0] + end[0]) / 2,
  (start[1] + end[1]) / 2,
]

/**
 * The strongest room audible through one of the active plan's actual doors.
 *
 * Reading `plan.doorways` rather than ship adjacency honours doors removed by
 * Nen and doors currently sealed by the walked plan.
 */
export function heardNeighbourOf(options: {
  plan: TierPlan
  space: Space
  at: Vec2
  namedOccupants?: Readonly<Record<string, number>>
}): HeardNeighbour | null {
  const { plan, space, at, namedOccupants = {} } = options
  const candidates: Array<HeardNeighbour & { score: number }> = []

  for (const doorway of plan.doorways) {
    const otherId = doorway.a === space.id ? doorway.b : doorway.b === space.id ? doorway.a : null
    if (!otherId) continue
    const other = plan.spaces.find((candidate) => candidate.id === otherId)
    if (!other) continue
    const condition = roomConditionOf({
      space: other,
      tier: plan.tier,
      namedOccupants: namedOccupants[other.id] ?? 0,
    })
    const profile = roomSoundProfileOf(other, condition)
    const doorAt = midpoint(doorway.start, doorway.end)
    const distance = Math.hypot(doorAt[0] - at[0], doorAt[1] - at[1])
    candidates.push({
      spaceId: other.id,
      at: doorAt,
      profile,
      score: soundEnergy(profile) / (1 + distance * 0.08),
    })
  }

  candidates.sort(
    (left, right) => right.score - left.score || left.spaceId.localeCompare(right.spaceId),
  )
  const heard = candidates[0]
  return heard ? { spaceId: heard.spaceId, at: heard.at, profile: heard.profile } : null
}
