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
 * - **Shu leaves aura where the visitor is not.** An object wrapped in Shu
 *   carries the visitor's aura for as long as they hold it there, so a sweep
 *   that reaches the object feels an aura even when the visitor is out of range.
 *   It never outlasts a Zetsu: the engine lets every Shu go with the aura.
 *   In does not cover it from En, for the same reason it does not cover the
 *   visitor: a sweep is not sight. Marking the room is a trace one leaves.
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
  /** Where the objects the visitor holds in Shu stand. Absent reads as none. */
  marks?: readonly Vec2[]
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
   * Whether what the visitor has raised is On.
   *
   * On is a Ren with intent in it, and a body that feels one is not being told
   * that somebody is casting nearby: it is being told what that somebody means.
   */
  visitorMenacing: boolean
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
  const presence = presencesOf(visitor)
  for (const post of posts) {
    const nen = nenOf(post)
    if (!nen?.en) continue
    const hits = detectWithEn({ at: post.at, nen }, presence)
    if (hits.length)
      senses[post.member.characterId] = hits.some((hit) => hit.auraSignature) ? 'aura' : 'body'
  }
  return senses
}

/** The visitor's body, and every object carrying their aura through Shu. */
function presencesOf(visitor: Visitor) {
  const held = visitor.nen.mode === 'zetsu' ? [] : (visitor.marks ?? [])
  const marks = held.map((at, index) => ({
    id: `shu:${index}`,
    at,
    nen: visitor.nen,
  }))
  return [{ id: 'visitor', at: visitor.at, nen: visitor.nen }, ...marks]
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
export function contactWith(post: Post, contact: Contact): ContactReach {
  const id = post.member.characterId
  const sense = contact.sensedBy[id]
  const sees = !contact.visitorHidden || sense !== undefined
  const aimed = contact.aimedAt === id
  const inRoom = contact.visitorCasting && contact.visitorIn === post.spaceId
  const felt = sense === 'aura' || (sees && (aimed || inRoom))
  return { felt, looking: felt || sense === 'body', menaced: felt && contact.visitorMenacing }
}

/** How far the visitor has reached one body. */
export interface ContactReach {
  /** Aura at this body: in its sweep, raised in its room, or levelled at it. */
  felt: boolean
  /** Worth a Gyo: felt, or a body in its sweep with nothing on it. */
  looking: boolean
  /** Felt, and the aura felt is On: a threat rather than a technique. */
  menaced: boolean
}
