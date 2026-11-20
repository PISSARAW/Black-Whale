import { fightStage, type FightStageId, type FightStageKind } from './stages'
import type { FighterId, FightSide, FightState } from './types'
import type { DoorFrame, DoorFramePick, DoorSite } from './voconteDoorTypes'

/** Two existing physical frames are supplied by the duel, not an attested limit of Door. */
export const DOOR_FRAMES: readonly DoorFrame[] = [
  { id: 'A', x: 30, direction: 1, destination: 'B', arrivalFacing: 1 },
  { id: 'B', x: 70, direction: -1, destination: 'A', arrivalFacing: -1 },
]

/** Two linked frames this close would be one doorway, not a shortcut. */
export const DOOR_MIN_SPAN = 20

type SiteRow = readonly [id: string, x: number, labelFr: string, labelEn: string]
const site = ([id, x, labelFr, labelEn]: SiteRow): DoorSite => ({ id, x, labelFr, labelEn })

/**
 * Real doorframes already built into each kind of level. Door may only link two of these:
 * it never draws a portal on an arbitrary surface. `inner-*` keep the historic 30/70 pair.
 */
const DOOR_SITES: Record<FightStageKind, readonly DoorSite[]> = {
  hold: [
    site(['port-hatch', 10, 'Écoutille bâbord', 'Port hatch']),
    site(['inner-left', 30, 'Cloison de cale', 'Hold bulkhead']),
    site(['cargo-door', 50, 'Porte de soute', 'Cargo door']),
    site(['inner-right', 70, 'Sas de cale', 'Hold airlock']),
    site(['starboard-hatch', 90, 'Écoutille tribord', 'Starboard hatch']),
  ],
  'heavens-arena': [
    site(['west-gate', 12, 'Porte ouest du ring', 'Ring west gate']),
    site(['inner-left', 30, 'Entrée des lutteurs', 'Fighters’ entrance']),
    site(['inner-right', 70, 'Couloir des arbitres', 'Referees’ corridor']),
    site(['east-gate', 88, 'Porte est du ring', 'Ring east gate']),
  ],
  'ship-room': [
    site(['service-door', 12, 'Porte de service', 'Service door']),
    site(['inner-left', 30, 'Porte de la pièce', 'Room door']),
    site(['connecting-door', 50, 'Porte communicante', 'Connecting door']),
    site(['inner-right', 70, 'Porte du couloir', 'Corridor door']),
    site(['cabinet-door', 88, 'Porte de placard', 'Closet door']),
  ],
}

/** Seats that can bring Door into a round: its user, a Chrollo page, a Kurapika loan. */
export const DOOR_CAPABLE_FIGHTERS: readonly FighterId[] = ['voconte', 'chrollo', 'kurapika']

export const DEFAULT_DOOR_PICK: DoorFramePick = ['inner-left', 'inner-right']

export function doorSitesFor(stageId: FightStageId): readonly DoorSite[] {
  return DOOR_SITES[fightStage(stageId).kind]
}

/** Ids resolve against this stage's own catalogue; a pick from another level is refused. */
export function doorPickSites(stageId: FightStageId, pick: DoorFramePick): DoorSite[] | null {
  if (pick[0] === pick[1]) return null
  const sites = doorSitesFor(stageId)
  const chosen = pick.map((id) => sites.find((entry) => entry.id === id))
  if (!chosen[0] || !chosen[1]) return null
  const [left, right] = (chosen as DoorSite[]).sort((a, b) => a.x - b.x)
  return right.x - left.x >= DOOR_MIN_SPAN ? [left, right] : null
}

/** The left frame is always A (entered rightward), the right one B (entered leftward). */
export function doorFramesFromSites(sites: readonly DoorSite[]): readonly DoorFrame[] {
  const [left, right] = sites
  return [
    { ...DOOR_FRAMES[0], x: left.x },
    { ...DOOR_FRAMES[1], x: right.x },
  ]
}

/** Fixed for the whole round from the pre-round environment: the frames never move. */
export function doorFramesFor(state: FightState, side: FightSide): readonly DoorFrame[] {
  const pick = state.environment.doorFrames?.[side]
  const sites = pick ? doorPickSites(state.environment.stageId, pick) : null
  return sites ? doorFramesFromSites(sites) : DOOR_FRAMES
}

/** Shapes the untrusted wire value; the stage check happens on use via `doorPickSites`. */
export function parseDoorFramePicks(
  value: unknown,
): Partial<Record<FightSide, DoorFramePick>> | null | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const entries = Object.entries(value as Record<string, unknown>)
  const picks: Partial<Record<FightSide, DoorFramePick>> = {}
  for (const [side, pick] of entries) {
    if (side !== 'player' && side !== 'opponent') return null
    if (pick === undefined) continue
    if (!validPickShape(pick)) return null
    picks[side] = [pick[0], pick[1]]
  }
  return picks
}

function validPickShape(value: unknown): value is [string, string] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((id) => typeof id === 'string' && id.length <= 32)
  )
}
