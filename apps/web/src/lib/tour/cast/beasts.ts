/**
 * The Guardian Spirit Beasts, present and dormant.
 *
 * In the salon of every prince who has one, the animal is there. It never
 * activates its ability: it moves about the room, and it answers when the
 * visitor asks what it is. That is the whole of §2.4 of ADR-003, and the
 * restraint is the design — a beast that acted would be the walk deciding what
 * a technique does to a person, which is the module's business and nobody
 * else's.
 *
 * Nothing here knows which prince owns what. The list is `data/`'s, declared
 * per character and checked by the `guardian-beast` invariant, and this module
 * only turns a declaration into something standing in a room. A prince with no
 * declaration has no beast, exactly as a corridor with no luminaire is dark.
 *
 * "Dormant" is the engine's own word: these are the `DORMANT` state of
 * `EFFECT_STATE_CHANGED` (see `docs/hatsu-potentiel.md`). The day one of them
 * has to act, it is that primitive moving to `TRIGGERED` inside its module —
 * not a new rule here.
 */
import { floorOf } from '../blueprint'
import type { Ship } from '../blueprint'
import type { Apparition } from '../apparitions'
import { seedOf, stationIn } from './stations'
import type { CastBeast, Post, StandingBeast } from './types'

/** How far a posted beast wanders from its spot, in metres. */
const ROAMING = 1.6

/** How large the walk draws one. The silhouettes carry their own proportions. */
const BEAST_SIZE = 0.85

/** The colour a dormant beast is drawn in: the walk's own neutral aura grey. */
const DORMANT = 0x9aa6c4

/**
 * The beasts standing in the ship at this event.
 *
 * Two ways in, and both of them are the owner's position rather than the
 * beast's: an owner the walk has posted brings their own animal, and an owner
 * the archive never places — the real Woble — brings one to the body their
 * declaration names. Neither invents a room for an animal.
 */
export function beastApparitions(
  ship: Ship,
  posts: readonly Post[],
  standing: readonly StandingBeast[] = [],
): Apparition[] {
  const byCharacter = new Map(posts.map((post) => [post.member.characterId, post]))
  const placed: Array<{ beast: CastBeast; post: Post }> = []

  for (const post of posts) {
    if (post.member.beast) placed.push({ beast: post.member.beast, post })
  }
  for (const beast of standing) {
    const post = byCharacter.get(beast.standsWithId)
    if (post) placed.push({ beast, post })
  }

  return placed
    .map(({ beast, post }) => draw(ship, beast, post))
    .filter((apparition): apparition is Apparition => apparition !== null)
    .sort((left, right) => left.id.localeCompare(right.id))
}

/** One beast, in the room its prince is in. */
function draw(ship: Ship, beast: CastBeast, post: Post): Apparition | null {
  const plan = ship.plans.get(post.tierId)
  const space = ship.spaces.get(post.spaceId)
  if (!plan || !space) return null
  // Its own spot in the room, not its prince's: an animal standing in somebody
  // is not an animal in the room. Seeded on the owner, so it is the same corner
  // every time — a beast that had moved between two loads would be a beast
  // doing something, and this one is doing nothing.
  const { at } = stationIn(space, `beast:${beast.ownerId}`)
  return {
    // Keyed by level like its owner: a salon drawn at two scales is two things
    // for the scene to build, and one id cannot name both.
    id: post.inside ? `cast-beast:${beast.ownerId}:within` : `cast-beast:${beast.ownerId}`,
    kind: beast.silhouette,
    spaceId: post.spaceId,
    tierId: post.tierId,
    at,
    // Off the floor by a little, and by a little more for a beast whose number
    // says so: several of these hang under the deckhead in the panels, and the
    // silhouettes are drawn to be seen from below.
    y: floorOf(space, plan.tier) + 0.4 + ((seedOf(beast.ownerId) >>> 7) % 5) * 0.12,
    size: BEAST_SIZE,
    colour: DORMANT,
    stage: 0,
    hidden: false,
    // The deambulation, and the only thing it ever does. `spread` is the field
    // the fish and the free bird already move on, so the beast costs the scene
    // nothing it was not already paying.
    spread: ROAMING,
    // Aimed at, it answers. What it answers with is the viewfinder's business —
    // see `guardianVoice` — and it is a sound and a card, never an effect.
    pick: true,
  }
}

/** The four voices the walk already has, in `lib/audio/hatsuSounds.ts`. */
export type BeastVoice = 'hiss' | 'roar' | 'chirp' | 'crush'

/**
 * What a beast sounds like.
 *
 * Four voices for sixteen shapes, because four is what the walk has recorded
 * and inventing a fifth would be inventing a beast. Assigned by what the animal
 * is built like rather than by who owns it: the flock chirps, the heavy ones
 * land, the coiled ones hiss.
 */
const VOICES: Partial<Record<Apparition['kind'], BeastVoice>> = {
  dragon: 'roar',
  toad: 'roar',
  monster: 'roar',
  chimera: 'roar',
  sprite: 'chirp',
  owl: 'chirp',
  insect: 'chirp',
  fish: 'chirp',
  wog: 'chirp',
  cat: 'crush',
  wheel: 'crush',
  mouths: 'crush',
  'tyson-guardian': 'crush',
  centipede: 'hiss',
  medusa: 'hiss',
  ghost: 'hiss',
}

/** Which beast is under this apparition id, if it is one at all. */
export function beastBehind(
  id: string,
  posts: readonly Post[],
  standing: readonly StandingBeast[] = [],
): CastBeast | null {
  if (!id.startsWith('cast-beast:')) return null
  const ownerId = id.slice('cast-beast:'.length).replace(/:within$/, '')
  for (const post of posts) {
    if (post.member.beast?.ownerId === ownerId) return post.member.beast
  }
  return standing.find((beast) => beast.ownerId === ownerId) ?? null
}

/**
 * What a beast says when the visitor takes hold of it.
 *
 * A sound, and nothing else. It is the one interaction §2.4 allows, and the
 * restraint is the point: an animal that answered with an effect would be a
 * beast acting, which this walk has decided none of them does yet.
 */
export function guardianVoice(beast: CastBeast | null): BeastVoice | null {
  return beast ? (VOICES[beast.silhouette] ?? 'hiss') : null
}
