import type { Doorway, Vec2 } from './types'

interface AudibleNeighbour {
  spaceId: string
  at: Vec2
}

interface RoomAudioBasis {
  spaceId: string
  doorways: readonly Pick<Doorway, 'a' | 'b' | 'start' | 'end'>[]
  namedOccupants?: Readonly<Record<string, number>>
}

const pointKey = ([x, y]: Vec2): string => `${x.toFixed(3)},${y.toFixed(3)}`

/**
 * Inputs that can change the audible room without moving the visitor across a threshold.
 *
 * Only adjacent rooms are included: a crowd changing three compartments away
 * cannot alter this room's bed, while a door opening beside it can.
 */
export function roomAudioBasisKey(options: RoomAudioBasis): string {
  const { spaceId, doorways, namedOccupants = {} } = options
  const doors = doorways.flatMap((doorway) => {
    const other = doorway.a === spaceId ? doorway.b : doorway.b === spaceId ? doorway.a : null
    if (!other) return []
    const ends = [pointKey(doorway.start), pointKey(doorway.end)].sort()
    return [`${other}:${namedOccupants[other] ?? 0}@${ends[0]}-${ends[1]}`]
  })
  doors.sort()
  return `${spaceId}:${namedOccupants[spaceId] ?? 0}|doors:${doors.join(';')}`
}

/** Full graph key, including the doorway source selected from those inputs. */
export function roomAudioKey(
  options: RoomAudioBasis & { neighbour: AudibleNeighbour | null },
): string {
  const heard = options.neighbour
    ? `${options.neighbour.spaceId}@${pointKey(options.neighbour.at)}`
    : '-'
  return `${roomAudioBasisKey(options)}|heard:${heard}`
}
