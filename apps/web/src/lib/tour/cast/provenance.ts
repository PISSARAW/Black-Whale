/**
 * Aim at a silhouette, and be handed its proof.
 *
 * The walk already answers "why is *that* pillar there" — see `exhibit.ts`.
 * ADR-003 §2.1 asks for the same gesture over a person, and the answer is the
 * same kind of card because it is the same kind of claim: this body is here
 * because the catalogue puts them here, from this chapter, in this role. A
 * silhouette that could not answer that would be a figure the walk had put in a
 * corridor on its own authority, which is the thing the whole chantier exists
 * to avoid.
 *
 * The card is built here rather than in `exhibit.ts` for the reason ADR-002
 * gives — that file is the ship's evidence and this is the cast's — and it
 * answers the same `Exhibit` shape, so the overlay that draws one draws both.
 */
import type { Exhibit } from '../exhibit'
import { likenessSource } from '../humanProfiles'
import type { Post } from './types'

/** How a person's card is worded, in the language being read. */
export interface PersonWords {
  /** The provenance badge: the same four words the legend uses. */
  badge: (provenance: 'panel') => string
  /** "Here since ch. 358" */
  since: (chapter: string) => string
  /** "The catalogue puts nobody's arrival here on a chapter." */
  sinceUnknown: string
  /** What a named body standing in a room asserts about the ship. */
  claim: string
  /** "Stands in Room 1014" */
  standingIn: (room: string) => string
  /** The role, as the catalogue words it, under a heading of its own. */
  role: (role: string) => string
  /**
   * "Drawn from ch. 343, 358" — ADR-005 §6.
   *
   * Beside the chapters of the presence rather than instead of them, because
   * they are two different claims about the same body: one says the archive
   * puts them here, the other says the archive knows what they look like. A
   * card that ran the two together would let the second borrow the first's
   * evidence.
   */
  drawnFrom: (chapters: string, partial: boolean) => string
}

/**
 * The exhibit for one body in the walk.
 *
 * Ranked `panel` and not better: a position comes from a chapter of the manga,
 * which is what the badge means. The chapter itself is the source line, so a
 * reader can go and check it — the card claims nothing the catalogue does not
 * already hold.
 */
export function personExhibit(post: Post, roomName: string | null, words: PersonWords): Exhibit {
  const { member } = post
  const drawn = likenessSource(member.characterId)
  const position = member.since ? words.since(member.since.replace(/^ch-/, '')) : words.sinceUnknown
  return {
    id: `cast:${member.characterId}`,
    title: member.name,
    provenance: 'panel',
    badge: words.badge('panel'),
    source: drawn
      ? `${position} — ${words.drawnFrom(
          drawn.chapterIds.map((id) => id.replace(/^ch-/, '')).join(', '),
          drawn.status === 'partial',
        )}`
      : position,
    claim: `${words.claim} ${words.role(member.role)}`,
    // A person has no measured extent, and inventing one would be the walk
    // claiming a height off a panel that never gave one.
    measured: null,
    standingIn: roomName ? words.standingIn(roomName) : null,
  }
}

/** How far off the reticle a body may be and still be the one meant, in radians. */
const CONE = 0.35

/**
 * Which body is down the reticle, if any.
 *
 * The walk already has one raycaster and ADR-003 promised not to add a second,
 * so this is done in the plane: the nearest body in the room the visitor is in,
 * inside a narrow cone around where they are looking, within a few metres.
 * Pure, and testable without a canvas — which is the whole reason it is here
 * rather than in the scene.
 */
export function aimedPerson(
  posts: readonly Post[],
  aim: { from: readonly [number, number]; heading: number; spaceId: string | null },
  reach = 6,
): Post | null {
  if (!aim.spaceId) return null
  let best: Post | null = null
  let nearest = Infinity
  for (const post of posts) {
    if (post.spaceId !== aim.spaceId) continue
    const dx = post.at[0] - aim.from[0]
    const dz = post.at[1] - aim.from[1]
    const range = Math.hypot(dx, dz)
    if (range > reach || range < 0.01) continue
    // The scene's own convention: a heading is `atan2(dx, dz)`, and the
    // difference between two of them is wrapped before it is compared.
    const bearing = Math.atan2(dx, dz) - aim.heading
    const off = Math.atan2(Math.sin(bearing), Math.cos(bearing))
    if (Math.abs(off) > CONE) continue
    if (range >= nearest) continue
    nearest = range
    best = post
  }
  return best
}
