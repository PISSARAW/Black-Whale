/**
 * When a posted body uses what the canon gave it — and only when and where.
 *
 * This is the layer ADR-003 is most careful about, so it is worth saying what
 * it is *not*. It holds no cost, no condition and no rule of any technique:
 * not one line here knows what Order Stamp does. It decides two things — which
 * of the people standing in the ship acts this tick, and at what — and then
 * hands the decision to `castInTour`, the same door the visitor casts through,
 * with the same refusals coming back. Whatever the walk answers a visitor, it
 * answers a guard.
 *
 * Three properties make it something a test can hold on to:
 *
 * - **Closed.** A body may only cast a technique the catalogue gives it
 *   (`abilities.json`, by owner) whose kind the walk already carries
 *   (`TOUR_HATSU_KINDS`). Zero new techniques, zero new kinds — the freeze on
 *   ADR-001's third chantier is respected to the letter, because nothing here
 *   can add to either list.
 * - **Seeded.** Who acts is a function of `characterId × chapter × tick`. There
 *   is no `Math.random` in this file and there is not meant to be: the same
 *   walk replayed at the same cap has to produce the same ship.
 * - **Budgeted.** At most `BUDGET` effects live at once, and a body that has
 *   acted keeps quiet for `COOLDOWN` ticks. A corridor cannot become a light
 *   show while nobody is looking.
 *
 * The beasts are excluded outright: their kinds are listed below and never
 * chosen. A dormant beast is §2.4's decision, and the way to make one act is
 * the state machine in its own module, not an exception here.
 */
import { castInTour, type TourWorld } from '../hatsu'
import type { Ship } from '../blueprint'
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import { seedOf } from './stations'
import type { Post } from './types'

/** How many cast effects the ship carries from the distribution at once. */
export const BUDGET = 3

/** How many ticks a body keeps quiet after acting. */
export const COOLDOWN = 12

/**
 * The kinds a posted body never casts of its own accord.
 *
 * Every one of them is a Guardian Spirit Beast. They stay castable by the
 * visitor exactly as before — this is about what happens without anybody asking
 * — and §2.4 has already decided that a beast in a salon is present and
 * dormant. Listed rather than derived, so adding a beast kind to the walk does
 * not quietly enlist it.
 */
export const DORMANT_KINDS: ReadonlySet<string> = new Set([
  'coercive-beast',
  'coin-growth',
  'lie-marks',
  'drug-synthesis',
  'aura-levy',
  'diffusive-smoke',
  'solicitation',
  'room-isolation',
])

/** One turn of the walk's own clock, as the conduct sees it. */
export interface Tick {
  /** Which tick this is. The walk counts; this never keeps a clock of its own. */
  tick: number
  /** The chapter the walk is standing in, which seeds the whole marche. */
  chapter: number
  /** The room the visitor is in: nothing is cast where nobody could see it. */
  visitorIn: string | null
  /** How many effects the distribution already has standing. */
  standing: number
  /** The techniques the selected event explicitly shows active, by user. */
  eventHatsu: Readonly<Record<string, readonly string[]>>
}

/** What one body decided to do, before anything was cast. */
export interface Intent {
  characterId: string
  kind: HatsuInteractionKind
  /** The room it is aimed at: the caster's own, which is the room they hold. */
  targetId: string
  /** Where the cast comes from: the caster's post, never the visitor's. */
  from: Post
}

/**
 * Whether this body may act on this tick.
 *
 * A hash rather than a counter, because a counter would make the fifth body in
 * the payload act on the fifth tick — an order that is a query plan's, not the
 * ship's. Roughly one tick in `COOLDOWN` for any given person, and the same
 * ticks every replay.
 */
function actsOn(characterId: string, tick: Tick): boolean {
  const seed = seedOf(`${characterId}:${tick.chapter}:${Math.floor(tick.tick / COOLDOWN)}`)
  return seed % COOLDOWN === tick.tick % COOLDOWN
}

/** The techniques this body could use here, in a fixed order. */
function repertoire(post: Post, eventHatsu: Tick['eventHatsu']): HatsuInteractionKind[] {
  const attested = new Set(eventHatsu[post.member.characterId] ?? [])
  return [...post.member.hatsu]
    .filter((kind) => attested.has(kind) && !DORMANT_KINDS.has(kind))
    .sort()
    .map((kind) => kind as HatsuInteractionKind)
}

/**
 * Who acts, and with what.
 *
 * Only bodies in the room the visitor is standing in. Not a budget trick: a
 * technique cast four decks away is a change to a world state nobody is
 * watching, and the walk has spent its whole existence refusing to assert
 * things nobody can check. What happens in the room you are in, you can see
 * happen.
 */
export function intentsFor(posts: readonly Post[], tick: Tick): Intent[] {
  if (!tick.visitorIn) return []
  const room = posts.filter((post) => post.spaceId === tick.visitorIn)
  const found: Intent[] = []
  for (const post of room) {
    if (found.length + tick.standing >= BUDGET) break
    if (!post.member.nen) continue
    if (!actsOn(post.member.characterId, tick)) continue
    const kinds = repertoire(post, tick.eventHatsu)
    if (kinds.length === 0) continue
    const kind = kinds[seedOf(`${post.member.characterId}:${tick.chapter}`) % kinds.length]!
    found.push({ characterId: post.member.characterId, kind, targetId: post.spaceId, from: post })
  }
  return found
}

/** What a cast by somebody other than the visitor left behind. */
export interface CastByCharacter {
  characterId: string
  kind: HatsuInteractionKind
  world: TourWorld
  /** The engine's own account of what happened, refusals included. */
  report: ReturnType<typeof castInTour>['report']
}

/**
 * Run the intents through the engine, in order.
 *
 * `castInTour` is the whole of the interpretation: the origin is the caster's
 * post rather than the visitor's position, the target is their own room, and a
 * refusal — "inert", "no target" — comes back exactly as it does for the
 * visitor and is kept, because a technique that would not fire is a fact about
 * the technique.
 */
export function runConduct(
  ship: Ship,
  world: TourWorld,
  intents: readonly Intent[],
): { world: TourWorld; casts: CastByCharacter[] } {
  let current = world
  const casts: CastByCharacter[] = []
  for (const intent of intents) {
    const result = castInTour(current, intent.kind, {
      ship,
      targetId: intent.targetId,
      standingIn: intent.from.spaceId,
      at: intent.from.at,
      // Whose cast this is, which is not bookkeeping for every technique but is
      // for one: a Kurapika who goes scarlet in the Woble quarters under the
      // emotion of the moment is spending his own years, and the read-out has
      // to say so rather than charging the reader for them.
      caster: intent.characterId,
      ...(intent.from.heading === undefined ? {} : { heading: intent.from.heading }),
    })
    current = result.world
    casts.push({
      characterId: intent.characterId,
      kind: intent.kind,
      world: result.world,
      report: result.report,
    })
  }
  return { world: current, casts }
}
