/** Remote passages and scouts that move through the reconstructed ship. */
import { ceilingOf, type Ship } from './blueprint'
import { OWL_FILM_SECONDS, OWL_SECONDS } from './cast/kinds'
import type { DoorOptions, Doors, TourCastResult, TourReport, TourWorld } from './cast/types'
import type { Space } from './types'

/** Eye height inside a room, for the remote eye's camera. */
export function eyeHeightIn(space: Space, ship: Ship): number {
  const tier = ship.tiers.find((candidate) => candidate.id === space.tierId)
  if (!tier) return 1.7
  return tier.elevation + Math.min(2.2, ceilingOf(space, tier) - 0.4)
}

/** Where Fugetsu's tunnel puts someone who steps into one of its two ends. */
export function wormExit(
  world: TourWorld,
  spaceId: string | null,
  arrivedFrom: string | null,
): { to: string; world: TourWorld; report: TourReport } | null {
  const worm = world.worm
  if (!worm?.b || !spaceId || spaceId === arrivedFrom) return null
  const to = spaceId === worm.a ? worm.b : spaceId === worm.b ? worm.a : null
  if (!to) return null

  const crossings = worm.crossings + 1
  if (crossings >= 3) {
    return { to, world: { ...world, worm: null }, report: { kind: 'worm-spent' } }
  }
  return {
    to,
    world: { ...world, worm: { ...worm, crossings } },
    report: { kind: 'worm-crossed', spaceId: to, crossings },
  }
}

/** Whether a stairwell may be taken from where the visitor stands. */
export const linkIsOpen = (world: TourWorld, spaceId: string | null): boolean =>
  !spaceId || (!world.shut.includes(spaceId) && world.pinned !== spaceId)

function pairedDoorExit(world: TourWorld, spaceId: string): string | null | undefined {
  if (world.doors.length !== 2) return undefined
  const [a, b] = world.doors
  if (spaceId === a) return b
  if (spaceId === b) return a
  return null
}

/** Where paired or ambient Hideout doors send someone. */
export function doorExit(world: TourWorld, through: Doors, options: DoorOptions = {}) {
  const { spaceId, arrivedFrom } = through
  const { ship, random = Math.random } = options
  if (!spaceId || spaceId === arrivedFrom) return null

  const paired = pairedDoorExit(world, spaceId)
  if (paired !== undefined) return paired
  if (world.holding !== 'door-network' || !ship) return null

  const elsewhere = [...ship.spaces.keys()].filter((id) => id !== spaceId)
  if (!elsewhere.length) return null
  return elsewhere[Math.min(elsewhere.length - 1, Math.floor(random() * elsewhere.length))]
}

/** One bite: the fish eat one thing in their sealed room. */
export function fishBite(
  world: TourWorld,
  ship: Ship,
  spaceId: string | null,
): TourCastResult | null {
  if (!spaceId || !world.devouring.includes(spaceId)) return null
  const eaten = [...ship.structures, ...world.copies].find(
    (solid) => solid.spaceId === spaceId && !world.solids[solid.id]?.gone,
  )
  if (!eaten) return null
  return {
    world: {
      ...world,
      solids: { ...world.solids, [eaten.id]: { ...world.solids[eaten.id], gone: true } },
    },
    report: { kind: 'fish-fed', spaceId, solidId: eaten.id },
  }
}

/** One frame of the insect feed: a room, and how much was standing in it. */
export function frameOf(
  ship: Ship,
  world: TourWorld,
  spaceId: string,
): { spaceId: string; seen: number } {
  if (world.emptied.includes(spaceId)) return { spaceId, seen: 0 }
  const seen = [...ship.structures, ...world.copies].filter(
    (solid) => solid.spaceId === spaceId && !world.solids[solid.id]?.gone,
  ).length
  return { spaceId, seen }
}

/** How many rooms the film covers, however many times it passed through them. */
export const roomsFilmed = (film: TourWorld['eyeFilm']): number =>
  new Set(film.map((frame) => frame.spaceId)).size

/** Add the room the bird has just reached to its flight film. */
export function filmOwlRoom(world: TourWorld, spaceId: string): TourWorld['owlFilm'] {
  const second = Math.max(0, OWL_SECONDS - world.owlLife)
  return [...world.owlFilm, { spaceId, second }]
}

/** The last ten seconds of a flight, rebased to start at zero. */
export function lastTenSeconds(film: TourWorld['owlFilm'], flown: number): TourWorld['owlFilm'] {
  const cut = Math.max(0, flown - OWL_FILM_SECONDS)
  const after = film.filter((frame) => frame.second >= cut)
  const running = [...film].reverse().find((frame) => frame.second < cut)
  const kept = running ? [{ spaceId: running.spaceId, second: cut }, ...after] : after
  return kept.map((frame) => ({ ...frame, second: frame.second - cut }))
}

/** One hop of the free bird through an open doorway. */
export function flyTheOwl(
  world: TourWorld,
  ship: Ship,
  random: () => number = Math.random,
): TourCastResult | null {
  if (!world.owl || world.owlMode !== 'wander') return null
  const ways = (ship.adjacency.get(world.owl) ?? []).filter(
    (id) => ship.spaces.has(id) && linkIsOpen(world, id),
  )
  if (!ways.length) return null
  const spaceId = ways[Math.min(ways.length - 1, Math.floor(random() * ways.length))]
  return {
    world: { ...world, owl: spaceId, owlFilm: filmOwlRoom(world, spaceId) },
    report: { kind: 'owl-flown', spaceId },
  }
}

/** One hop of the scouting insect through an open doorway. */
export function flyTheEye(
  world: TourWorld,
  ship: Ship,
  random: () => number = Math.random,
): TourCastResult | null {
  if (!world.eye || world.eyeMode !== 'scout') return null
  const ways = (ship.adjacency.get(world.eye) ?? []).filter(
    (id) => ship.spaces.has(id) && linkIsOpen(world, id),
  )
  if (!ways.length) return null
  const spaceId = ways[Math.min(ways.length - 1, Math.floor(random() * ways.length))]
  return {
    world: { ...world, eye: spaceId, eyeFilm: [...world.eyeFilm, frameOf(ship, world, spaceId)] },
    report: { kind: 'eye-flown', spaceId },
  }
}

/** One second of the owl's twenty-second life. */
export function ageTheOwl(
  world: TourWorld,
  seconds = 1,
): { world: TourWorld; report: TourReport | null } | null {
  if (!world.owl) return null
  const left = world.owlLife - seconds
  if (left > 0) return { world: { ...world, owlLife: left }, report: null }

  const film = lastTenSeconds(world.owlFilm, OWL_SECONDS)
  return {
    world: { ...world, owl: null, owlLife: 0, owlFilm: film },
    report: { kind: 'owl-expired', rooms: new Set(film.map((frame) => frame.spaceId)).size },
  }
}
