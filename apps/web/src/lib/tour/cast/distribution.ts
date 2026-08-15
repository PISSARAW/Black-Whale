/**
 * The distribution: the world state, laid over the ship's geometry.
 *
 * This is the whole of ADR-003's first principle in one file. It takes bodies
 * the canon puts aboard at one event — the same projection `/ship` draws its
 * markers from — and answers where each of them stands in the walkable
 * reconstruction. It invents nobody: the only way into the list is to be a
 * `characterId` the archive holds, and a corridor the canon does not people
 * comes back empty, the way a corridor with no luminaire comes back dark.
 *
 * Everything here is pure. It reads no canvas, no store, no clock, and it is
 * seeded on the character's own id, so the same event under the same cap draws
 * the same ship twice — which is what makes a screenshot at a fixed chapter a
 * test rather than a souvenir.
 */
import { floorOf } from '../blueprint'
import type { Ship } from '../blueprint'
import { AVATAR } from '../apparitions'
import type { Apparition } from '../apparitions'
import type { Space } from '../types'
import { drawable } from './presence'
import { interiorOf, roomWithin, standingIn, standingOutsideDoor } from './quarters'
import { spaceAmong } from './stations'
import type { CastMember, Costume, Post } from './types'
import { wardrobeFor } from './wardrobe'

/** How tall the walk draws a person: the shared one-metre figure's own unit. */
const HUMAN_SIZE = 0.42

/**
 * The spaces a catalogue location resolves to.
 *
 * Direct first, then the suffix match `lib/tour/blueprint.ts` already uses for
 * the handful of regions the deck plans and the catalogue spell differently.
 * Several spaces is not a failure: a sector is a legitimate answer, and
 * `spaceAmong` picks one of them deterministically.
 */
function spacesFor(ship: Ship, locations: readonly string[]): Space[] {
  const wanted = new Set(locations)
  const found = ship.blueprint.spaces.filter((space) => {
    // `outsideDoorOf` may name the precise reconstructed room whose threshold
    // is attested, rather than only its broader catalogue location. Beyond's
    // guards, for example, stand outside the cell itself but inside the holding
    // block, on the watch side of its bars.
    if (wanted.has(space.id)) return true
    if (!space.locationId) return false
    if (wanted.has(space.locationId)) return true
    return locations.some((location) => space.locationId!.endsWith(`-${location}`))
  })
  // Resolve the catalogued room on the deck first. `standings` then replaces
  // that envelope with its detailed interior when one exists. A catalogue
  // location that is itself a corridor never takes that second step.
  const onDeck = found.filter((space) => ship.plans.get(space.tierId)?.tier.kind === 'deck')
  return onDeck.length > 0 ? onDeck : found
}

/**
 * The spaces one catalogue location slug names, for whoever needs to name it
 * back.
 *
 * An interview reads a route out of `mapTrajectory`, and a route is a list of
 * these slugs. Resolving them here rather than in the page is what keeps the
 * answer honest: the route says "room 1003" only where the walk could take you
 * to room 1003, because it is the same lookup that decided where to stand the
 * body in the first place.
 */
export function spacesForLocation(ship: Ship, location: string): Space[] {
  return spacesFor(ship, [location])
}

/** How a posted body holds itself. Nothing here is a state of mind. */
function poseOf(role: Post['costume']['role']): NonNullable<Apparition['human']>['pose'] {
  if (role === 'guard' || role === 'nen-guard') return 'guard'
  return 'idle'
}

/**
 * Where everyone stands, on one level or across the whole ship.
 *
 * `tierId` is a rendering budget rather than a rule: the walk is on one deck at
 * a time and a body four decks down is a human rig nobody can see. Omit it and
 * the answer is the whole ship, which is what the tests read.
 */
export function distribute(
  ship: Ship,
  members: readonly CastMember[],
  options: { tierId?: string } = {},
): Post[] {
  const posts: Post[] = []
  for (const member of drawable(members)) {
    const costume = wardrobeFor(member.role)
    // No costume is a role the table has never been told about, which
    // `wardrobe.test.ts` makes a build failure. At runtime it is one body not
    // drawn, never a stranger in a corridor.
    if (!costume) continue
    const candidates = spacesFor(
      ship,
      member.outsideDoorOf ? [member.outsideDoorOf] : member.locations,
    )
    const space = spaceAmong(candidates, member.characterId)
    if (!space) continue
    for (const stood of standings(ship, space, { member, costume })) {
      if (options.tierId && stood.tierId !== options.tierId) continue
      posts.push(stood)
    }
  }
  return posts
}

/**
 * The one place a body stands, for the one room it is in.
 *
 * A prince's apartment exists as a box on the deck and as seven rooms on its
 * own level. The box is only the threshold used to enter with E; it is not a
 * second room in which the cast also stands. A body is therefore posted in the
 * detailed interior only. Someone explicitly catalogued in the outside
 * corridor still has that corridor as their location and never reaches here
 * through an apartment envelope.
 */
function standings(
  ship: Ship,
  space: Space,
  who: { member: CastMember; costume: Costume },
): Post[] {
  const { member, costume } = who
  const seed = member.characterId
  if (member.outsideDoorOf) {
    const outside = standingOutsideDoor(ship, space, seed)
    if (outside) {
      return [
        {
          member,
          spaceId: outside.space.id,
          tierId: outside.space.tierId,
          at: outside.at,
          heading: outside.heading,
          costume,
        },
      ]
    }
  }
  const onDeck: Post = {
    member,
    spaceId: space.id,
    tierId: space.tierId,
    ...standingIn(space, costume, seed),
    costume,
  }
  const within = roomWithin(interiorOf(ship, space), costume, seed, member.role)
  if (!within) return [onDeck]
  return [
    {
      member,
      spaceId: within.id,
      tierId: within.tierId,
      ...standingIn(within, costume, seed),
      costume,
      inside: true,
    },
  ]
}

/** How a body is drawn beyond its costume: the aura it carries, if any. */
export interface CastLook {
  aura?: NonNullable<Apparition['human']>['aura']
  nen?: NonNullable<Apparition['human']>['nen']
  alert?: boolean
}

/**
 * The posts, as things the scene can draw.
 *
 * One `avatar` apparition per body, with the character's own id as its stable
 * identity — which is what keeps a face from being redrawn between frames, and
 * what the five hatsu that act on people will aim at when their turn comes.
 * `look` is where the carried Nen enters, and it is a parameter rather than a
 * lookup so this module never has to know what an aura means.
 */
export function castApparitions(
  ship: Ship,
  posts: readonly Post[],
  look: (post: Post) => CastLook = () => ({}),
): Apparition[] {
  const found: Apparition[] = []
  for (const post of posts) {
    const plan = ship.plans.get(post.tierId)
    const space = ship.spaces.get(post.spaceId)
    if (!plan || !space) continue
    found.push({
      id: `cast:${post.member.characterId}`,
      kind: 'avatar',
      spaceId: post.spaceId,
      tierId: post.tierId,
      at: post.at,
      ...(post.heading === undefined ? {} : { heading: post.heading }),
      y: floorOf(space, plan.tier),
      size: HUMAN_SIZE,
      colour: AVATAR,
      stage: 0,
      hidden: false,
      human: drawnAs(post, look(post)),
    })
  }
  return found
}

/** How one body is drawn: its costume, its bearing, and the aura it carries. */
function drawnAs(post: Post, look: CastLook): NonNullable<Apparition['human']> {
  return {
    role: post.costume.role,
    ...(post.costume.dress ? { dress: post.costume.dress } : {}),
    pose: poseOf(post.costume.role),
    identity: post.member.characterId,
    ...(look.aura ? { aura: look.aura } : {}),
    ...(look.nen ? { nen: look.nen } : {}),
    ...(look.alert ? { alert: look.alert } : {}),
  }
}

/** Who is standing in one room, for the readouts and for the conduct. */
export function postsIn(posts: readonly Post[], spaceId: string | null): Post[] {
  if (!spaceId) return []
  return posts.filter((post) => post.spaceId === spaceId)
}
