/**
 * What a body on watch can tell about the visitor, without being told.
 *
 * Until this existed the cast only answered what the visitor *did*: a
 * technique raised in the room, or aura levelled at somebody. A guard's En was
 * drawn — three rings on the floor — and it found nobody, which made Zetsu a
 * pure cost: the visitor gave up their own reading and bought no discretion
 * with it, because nothing was looking. This is the looking.
 *
 * Three rules, each the engine's rather than this module's:
 *
 * - **En feels a body, not just an aura.** `detectWithEn` already separates the
 *   two: a visitor in Zetsu still displaces the sweep, but carries no aura
 *   signature. The guard turns to look (`body`); it does not raise its own Ren
 *   for something that is not a Nen user as far as it can tell.
 * - **In hides from sight, not from En.** A visitor under In who walks into a
 *   sweep is felt as an aura all the same; what In buys is a technique raised
 *   *outside* anyone's sweep going unnoticed by bodies that are not in Gyo.
 * - **Gyo sees through In.** A body that has sensed the visitor is looking, and
 *   a body that is looking sees what In hides — which is the escalation: get
 *   close in Ten, and your hidden technique stops being hidden.
 */
import { detectWithEn, type NenTechniqueState } from '@black-whale/nen-engine'
import type { Vec2 } from '../types'
import type { Post } from './types'

/** What one sweep returned: an aura, or only a body with nothing on it. */
export type Sense = 'aura' | 'body'

/** Who on this deck has the visitor inside their En, by character id. */
export type Senses = Readonly<Record<string, Sense>>

/** The visitor, as a sweep finds them. */
export interface Visitor {
  at: Vec2
  nen: NenTechniqueState
}

/** The part of a room's situation that is about the visitor in particular. */
export interface Contact {
  /** The room the visitor is in, if the walk has put them in one. */
  visitorIn: string | null
  /** Whether the visitor has aura up: a raised technique is felt, not seen. */
  visitorCasting: boolean
  /** Whether the visitor is holding In over what they raise. */
  visitorHidden: boolean
  /**
   * Who the visitor has their aura levelled at, personally (ADR-004).
   *
   * Being pointed at is not the same event as being nearby when something
   * happens. Only a raised aura carries — `readingIsFelt` decides that, not
   * this module — so looking hard at a guard through Gyo alarms nobody.
   */
  aimedAt: string | null
  /** Who has the visitor inside their En right now, and what they feel. */
  sensedBy: Senses
}

/**
 * Every body whose standing En has the visitor inside it.
 *
 * `nenOf` is the body's state *before* it has sensed anything — the conduct at
 * its post — because the radius of a sweep does not depend on what it finds.
 */
export function sensedBy(
  posts: readonly Post[],
  visitor: Visitor,
  nenOf: (post: Post) => NenTechniqueState | undefined,
): Senses {
  const senses: Record<string, Sense> = {}
  const presence = [{ id: 'visitor', at: visitor.at, nen: visitor.nen }]
  for (const post of posts) {
    const nen = nenOf(post)
    if (!nen?.en) continue
    const [hit] = detectWithEn({ at: post.at, nen }, presence)
    if (hit) senses[post.member.characterId] = hit.auraSignature ? 'aura' : 'body'
  }
  return senses
}

/**
 * The same answer as one string, so a reactive caller can stop at it.
 *
 * The visitor moves every frame and the answer changes a few times a minute;
 * a derived value that compares equal is one the figures are not rebuilt for.
 */
export function sensesKey(senses: Senses): string {
  return Object.entries(senses)
    .map(([id, sense]) => `${id}=${sense}`)
    .sort()
    .join('|')
}

export function sensesFromKey(key: string): Senses {
  if (!key) return {}
  return Object.fromEntries(key.split('|').map((entry) => entry.split('=') as [string, Sense]))
}

/**
 * How far the visitor has reached one body, given everything above.
 *
 * `felt` is aura at *you*: an aura in your sweep, a technique raised in your
 * room, or one levelled at you — the last two only if you can see them through
 * the visitor's In. `looking` adds a body in your sweep with nothing on it:
 * worth a Gyo, not worth a Ren.
 */
export function contactWith(post: Post, contact: Contact): { felt: boolean; looking: boolean } {
  const id = post.member.characterId
  const sense = contact.sensedBy[id]
  const sees = !contact.visitorHidden || sense !== undefined
  const aimed = contact.aimedAt === id
  const inRoom = contact.visitorCasting && contact.visitorIn === post.spaceId
  const felt = sense === 'aura' || (sees && (aimed || inRoom))
  return { felt, looking: felt || sense === 'body' }
}
