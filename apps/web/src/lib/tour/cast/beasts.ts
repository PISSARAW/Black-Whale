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
import { ceilingOf, floorOf } from '../blueprint'
import type { Ship } from '../blueprint'
import type { Apparition } from '../apparitions'
import { stationIn } from './stations'
import { GUARDIAN_PRESENTATION, UNREVEALED_NEN_APPEARANCES } from '../nenAppearance'
import type { CastBeast, Post, StandingBeast } from './types'

/** The colour a dormant beast is drawn in: the walk's own neutral aura grey. */
const DORMANT = 0x9aa6c4

/**
 * The beasts standing in the ship at this event.
 *
 * Two ways in, and both of them are the owner's position rather than the
 * beast's: a posted owner brings their own known animal, while a separately
 * declared, attested animal may keep another body's position. An unknown
 * anatomy is never supplied by a placeholder ghost.
 */
export function beastApparitions(
  ship: Ship,
  posts: readonly Post[],
  {
    standing = [],
    chapter = null,
  }: { standing?: readonly StandingBeast[]; chapter?: number | null } = {},
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
    .map(({ beast, post }) => draw(ship, { beast, post }, chapter))
    .filter((apparition): apparition is Apparition => apparition !== null)
    .sort((left, right) => left.id.localeCompare(right.id))
}

/** One beast, in the room its prince is in. */
function draw(
  ship: Ship,
  { beast, post }: { beast: CastBeast; post: Post },
  chapter: number | null,
): Apparition | null {
  if (beast.ownerId in UNREVEALED_NEN_APPEARANCES) return null
  const plan = ship.plans.get(post.tierId)
  const space = ship.spaces.get(post.spaceId)
  if (!plan || !space) return null
  // Its own spot in the room, not its prince's: an animal standing in somebody
  // is not an animal in the room. Seeded on the owner, so it is the same corner
  // every time — a beast that had moved between two loads would be a beast
  // doing something, and this one is doing nothing.
  const presentation = GUARDIAN_PRESENTATION[beast.silhouette]
  if (!presentation) return null
  const shoulder = presentation.anchor === 'shoulders'
  const floor = floorOf(space, plan.tier)
  const clearance = ceilingOf(space, plan.tier)
  const anchor = shoulder
    ? Math.min(1.45, clearance * 0.4)
    : presentation.anchor === 'hover'
      ? 0.5
      : 0
  const size = Math.min(
    presentation.size,
    Math.max(0.1, (clearance - anchor - 0.2) / presentation.height),
  )
  const at = shoulder ? post.at : stationIn(space, `beast:${beast.ownerId}`).at
  const y = floor + anchor - presentation.bottom * size
  return {
    id: `cast-beast:${beast.ownerId}`,
    kind: beast.silhouette,
    spaceId: post.spaceId,
    tierId: post.tierId,
    at,
    // The anchor comes from this anatomy, fitted to the room’s headroom.
    y,
    size,
    colour: DORMANT,
    stage: 0,
    hidden: false,
    // A dormant guardian retains its pose rather than roaming at random.
    spread: 0,
    carried: false,
    heading: post.heading,
    ...(beast.silhouette === 'dragon' ? { variant: dragonForm(chapter) } : {}),

    // Aimed at, it answers. What it answers with is the viewfinder's business —
    // see `guardianVoice` — and it is a sound and a card, never an effect.
    pick: true,
  }
}

function dragonForm(chapter: number | null): Apparition['variant'] {
  if (chapter === null || chapter < 370) return 'slender'
  return chapter < 372 ? 'enlarged' : 'aggressive'
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
  'benjamin-guardian': 'roar',
  'halkenburg-guardian': 'roar',
  'nasubi-guardian': 'hiss',
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
