import { FIGHTING_ROSTER } from '$lib/fighting/roster'
import type { Ship } from './blueprint'
import type { CastMember, Post } from './cast/types'
import { BANQUET_SPACE } from './banquetView'

const AUDIENCE = FIGHTING_ROSTER.filter(({ modelId }) => modelId !== 'melody')
const CLASH_ACTORS = new Set(FIGHTING_ROSTER.map(({ modelId }) => `cast:${modelId}`))
export const isClashConcertActor = (id: string): boolean => CLASH_ACTORS.has(id)
const COLUMNS = 8
const X_SPACING = 3.25
const FIRST_ROW_Y = -10
const ROW_SPACING = 6.1

function audienceMember(
  fighter: (typeof AUDIENCE)[number],
  existing: CastMember | undefined,
): CastMember {
  return (
    existing ?? {
      characterId: fighter.modelId,
      name: fighter.name,
      locations: [BANQUET_SPACE],
      role: fighter.modelRole,
      since: 'ch-383',
      nen: null,
      factionId: null,
      hatsu: [],
      beast: null,
      approximate: true,
    }
  )
}

/** The complete Clash roster, arranged as Melody's banquet audience for the filmed concert. */
export function stageClashConcertAudience(posts: readonly Post[], ship: Ship): Post[] {
  const existing = new Map(posts.map((post) => [post.member.characterId, post.member]))
  const room = ship.spaces.get(BANQUET_SPACE)!
  return AUDIENCE.map((fighter, index): Post => {
    const row = Math.floor(index / COLUMNS)
    const column = index % COLUMNS
    const rowLength = Math.min(COLUMNS, AUDIENCE.length - row * COLUMNS)
    const x = (column - (rowLength - 1) / 2) * X_SPACING
    return {
      member: audienceMember(fighter, existing.get(fighter.modelId)),
      spaceId: room.id,
      tierId: room.tierId,
      at: [x, FIRST_ROW_Y + row * ROW_SPACING],
      heading: 0,
      pose: 'idle',
      costume: { role: fighter.modelRole },
    }
  })
}

export function requestedConcertAudience(
  posts: readonly Post[],
  ship: Ship,
  ensemble: 'clash' | undefined,
): Post[] {
  return ensemble === 'clash' ? stageClashConcertAudience(posts, ship) : [...posts]
}
