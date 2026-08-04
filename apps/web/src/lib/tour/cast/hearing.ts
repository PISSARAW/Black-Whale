/**
 * What Melody hears in the room she is standing in, with the flute down.
 *
 * `reading.ts` is one body down the reticle; this is the room, and it is a
 * different sense. The walk has always been able to say what is *drawn* in a
 * room — the plan shows a cabin and the cast puts silhouettes in it — and it
 * has never been able to say what is *in* one. A body behind a bulkhead of
 * furniture, a body the projection places out of the line of sight, a body
 * standing perfectly still: all of them are on the deck and none of them is in
 * front of the reticle. Melody's ear is the one thing in the catalogue that
 * answers that question, and ch. 45 is explicit about how — she hears hearts.
 *
 * Three lines this module holds, and each is the same line `reading.ts` holds:
 *
 * - **A heart is not an identity.** The ear returns counts. Who they are is the
 *   interview's to say, and hearing somebody breathe has never told anybody a
 *   name.
 * - **Zetsu is still not distinguishable from no aura.** A heart is heard
 *   either way — that is the whole of what makes the ear worth having — but
 *   what the aura is doing reads as silence for both, exactly as it does down
 *   the reticle. An ear that reported concealment would be the detector
 *   `auraRefraction.ts` refused to build, arriving through a side door.
 * - **A flute covers it.** You cannot listen to a room and play into it at the
 *   same time, and the walk says so rather than handing the visitor both.
 *
 * Pure, and knows nothing of three.js, the page or the ship: it is handed the
 * bodies the projection placed and hands back what was audible.
 */
import type { Post } from './types'

/** One thing the ear picks up in the room, with the flute down. */
export type HearingTell =
  /** The flute is up. Playing into a room is not listening to it. */
  | 'playing'
  /** Nobody at all: the room is empty of bodies, whatever the plan shows. */
  | 'alone'
  /** Hearts, and how many. The one thing the map cannot show. */
  | 'hearts'
  /** At least one aura is up, and a raised aura is loud. */
  | 'ren'
  /** At least one is held in, which is quieter and still audible this close. */
  | 'ten'
  /** At least one body gives the ear nothing but its heart. */
  | 'still'

/** Everything the listening looks at. Nothing is fetched, nothing is global. */
export interface HearingInput {
  /** Everybody the projection put on this deck. */
  posts: readonly Post[]
  /** The room the visitor is standing in, or `null` between rooms. */
  spaceId: string | null
  /** The aura each body carries, as `cast/nen.ts` decided it. */
  auraFor: (post: Post) => 'ten' | 'ren' | 'zetsu' | null
  /** Whether the flute is at the lips. */
  playing: boolean
}

/** What the ear found, as counts and as tells over them. */
export interface Heard {
  /** How many hearts are in the room. Zero is an answer, not a failure. */
  hearts: number
  tells: HearingTell[]
}

/**
 * Listen to the room.
 *
 * Ordered coarsest first, the way `readBody` orders its own: that anybody is
 * there, then how many, then what their aura is doing. The list is never empty
 * — `playing` and `alone` are answers — because a sense that returned nothing
 * would be indistinguishable from a sense the walk forgot to consult.
 */
export function hearTheRoom(input: HearingInput): Heard {
  if (input.playing) return { hearts: 0, tells: ['playing'] }

  const here = input.spaceId ? input.posts.filter((post) => post.spaceId === input.spaceId) : []
  if (!here.length) return { hearts: 0, tells: ['alone'] }

  const auras = here.map((post) => input.auraFor(post))
  const tells: HearingTell[] = ['hearts']
  if (auras.includes('ren')) tells.push('ren')
  if (auras.includes('ten')) tells.push('ten')
  // Zetsu falls in here with no-aura on purpose: the heart above is what the
  // ear got out of both of them, and that is already more than the eye had.
  if (auras.some((aura) => aura !== 'ren' && aura !== 'ten')) tells.push('still')
  return { hearts: here.length, tells }
}
