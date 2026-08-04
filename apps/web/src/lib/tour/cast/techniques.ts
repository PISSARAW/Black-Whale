import type { Ship,  } from "../blueprint";
import type { TourWorld, TourCastResult, Space, Vec2, HatsuKey, TourCastInput, HatsuInteractionKind, RoomCastContext,  TourBook,  } from "./types";
import { CLOSED_BOOK, EMPTY_WORLD } from "./types";
import { runCast,   worksInTour, aimsAtSolids, worksOnTheBody, holdsInWorld, without } from "../hatsu"; // We will fix these imports later
import type { HatsuProfile } from "$lib/nen/hatsuRegistry";
import { pointInPolygon } from "../geometry";
import { solidById } from "./solids";

// ── Order Stamp ───────────────────────────────────────────────────────────
//
// The one technique in the walk that keeps a crowd rather than a target, so
// its three pieces of bookkeeping live together here rather than inside the
// roster below.

/** How many heads the stamp can be on at once. */
export const STAMP_LIMIT = 20

/** Everything wearing the 人, whether or not it is being spoken to. */
export const stampedPuppets = (world: TourWorld): string[] =>
  Object.entries(world.solids)
    .filter(([, hold]) => hold.stamped && !hold.gone)
    .map(([id]) => id)

/** The puppets an order would actually reach. */
export const lockedPuppets = (world: TourWorld): string[] =>
  Object.entries(world.solids)
    .filter(([, hold]) => hold.stamped && hold.locked && !hold.gone)
    .map(([id]) => id)

/**
 * The order itself: one simple instruction, and it goes to the locked only.
 *
 * They are set down in a ring around the point that was pointed at, because
 * twenty puppets sent to one spot would be twenty puppets inside each other.
 * The stamp is not spent by being obeyed — they stay stamped and stay locked,
 * so the next order finds the same crowd.
 */
export function orderThePuppets(world: TourWorld, room: Space, to: Vec2): TourCastResult {
  const locked = lockedPuppets(world)
  if (!locked.length) {
    return { world, report: { kind: 'no-lock', stamped: stampedPuppets(world).length } }
  }

  const solids = { ...world.solids }
  locked.forEach((id, index) => {
    const angle = (index * Math.PI * 2) / locked.length
    const ring = locked.length > 1 ? 1.4 : 0
    const stood: Vec2 = [to[0] + Math.cos(angle) * ring, to[1] + Math.sin(angle) * ring]
    // A puppet told to go somewhere goes somewhere inside the room: a ring wide
    // enough to keep twenty apart is wide enough to put one through a bulkhead,
    // and a solid standing in the steel is a wall the visitor cannot get past.
    solids[id] = { ...solids[id], at: pointInPolygon(stood, room.footprint) ? stood : to }
  })

  return {
    world: {
      ...world,
      solids,
      // A puppet that walked into another room stands in that room now, the
      // same way a relay's cargo does.
      copies: world.copies.map((copy) =>
        locked.includes(copy.id) ? { ...copy, spaceId: room.id } : copy,
      ),
    },
    report: { kind: 'ordered', spaceId: room.id, puppets: locked.length },
  }
}

/**

// ── The book ──────────────────────────────────────────────────────────────
//
// Nothing new in the ship: what these six need is for the walk to be able to
// hold two techniques at once. What they take, they take off the ship — from
// whatever technique is currently holding a room, which is the only other Nen
// user the reconstruction has.

/**
 * The technique holding a room, if any.
 *
 * This is what Skill Hunter reads. It is deliberately the same list the panel
 * shows: a hold you can see listed is a hold you can steal, and one that is
 * not is not there to be taken.
 */
export function techniqueHolding(world: TourWorld, spaceId: string): HatsuInteractionKind | null {
  if (world.isolated?.spaceId === spaceId) return 'room-isolation'
  if (world.shut.includes(spaceId)) return 'chain-bind'
  if (world.devouring.includes(spaceId)) return 'devour'
  if (world.guarded.includes(spaceId)) return 'legal-defense'
  if (world.cards[spaceId]) return 'tribunal'
  if (world.doors.includes(spaceId)) return 'door-network'
  if (world.emptied.includes(spaceId)) return 'vacuum'
  if (world.eye === spaceId) return 'scout'
  if (world.watched.some((doll) => doll.spaceId === spaceId)) return 'paper-spy'
  if (world.double === spaceId) return 'guardian'
  if (world.owl === spaceId) return 'surveillance'
  if (world.worm?.a === spaceId || world.worm?.b === spaceId) return 'portal'
  if (world.trap === spaceId) return 'desire-trap'
  if (world.ninelives.includes(spaceId)) return 'resurrection'
  if (world.curse?.victim === spaceId) return 'curse'
  if (world.dial === spaceId) return 'divination'
  if (world.poem.includes(spaceId)) return 'poetry'
  if (world.droplets.some((drop) => drop.spaceId === spaceId)) return 'blood-search'
  if (world.verses.some((verse) => verse.spaceId === spaceId)) return 'prophecy'
  if (world.souls.some(([a, b]) => a === spaceId || b === spaceId)) return 'arrow'
  if (world.foreseen?.spaceId === spaceId) return 'future'
  if (world.dowsing === spaceId) return 'dowsing'
  return null
}

/**
 * Takes one hold off a room.
 *
 * A stolen ability cannot be used by its owner while it is held, so what the
 * book takes it also lets go of: the room comes back, and the technique is in
 * the book instead of on the ship.
 */
export function releaseHold(world: TourWorld, spaceId: string): TourWorld {
  return {
    ...world,
    isolated: world.isolated?.spaceId === spaceId ? null : world.isolated,
    shut: world.shut.filter((id) => id !== spaceId),
    devouring: world.devouring.filter((id) => id !== spaceId),
    guarded: world.guarded.filter((id) => id !== spaceId),
    cards: Object.fromEntries(Object.entries(world.cards).filter(([id]) => id !== spaceId)),
    doors: world.doors.filter((id) => id !== spaceId),
    emptied: world.emptied.filter((id) => id !== spaceId),
    eye: world.eye === spaceId ? null : world.eye,
    watched: world.watched.filter((doll) => doll.spaceId !== spaceId),
    double: world.double === spaceId ? null : world.double,
    owl: world.owl === spaceId ? null : world.owl,
    worm: world.worm?.a === spaceId || world.worm?.b === spaceId ? null : world.worm,
    trap: world.trap === spaceId ? null : world.trap,
    ninelives: world.ninelives.filter((id) => id !== spaceId),
    curse: world.curse?.victim === spaceId ? null : world.curse,
    dial: world.dial === spaceId ? null : world.dial,
    poem: world.poem.filter((id) => id !== spaceId),
    droplets: world.droplets.filter((drop) => drop.spaceId !== spaceId),
    verses: world.verses.filter((verse) => verse.spaceId !== spaceId),
    souls: world.souls.filter(([a, b]) => a !== spaceId && b !== spaceId),
    foreseen: world.foreseen?.spaceId === spaceId ? null : world.foreseen,
    dowsing: world.dowsing === spaceId ? null : world.dowsing,
  }
}

/**
 * What a page costs to use.
 *
 * A stolen page stays in the book and can be cast again; a Culdcept card is
 * spent by being played, and so is the dolphin's loan. Nothing else about the
 * cast changes, so this is applied after it rather than woven into it.
 */
export function spendPage(world: TourWorld, kind: HatsuInteractionKind): TourWorld {
  const book = world.book
  if (book.loan === kind) return { ...world, book: { ...book, loan: null } }
  const card = book.cards.indexOf(kind)
  if (card < 0) return world
  return {
    ...world,
    book: { ...book, cards: book.cards.filter((_, index) => index !== card) },
  }
}

/** The pages the visitor may actually cast from, in the order the panel lists them. */
export function castablePages(book: TourBook): HatsuInteractionKind[] {
  return [
    ...(book.open ? [book.open] : []),
    ...(book.bookmark && book.bookmark !== book.open ? [book.bookmark] : []),
    ...book.cards,
    ...(book.loan ? [book.loan] : []),
  ]
}

/**
 * What Chrollo has already stolen by the time the walk begins.
 *
 * Double Face is not a theft — it is the bookmark, and a bookmark is worthless
 * without two pages under it. The walk cannot make the visitor steal twice
 * before the ability does anything, so the book is handed over already holding
 * a pair, drawn from what the archive has Chrollo carrying. Every one of them
 * is a technique the walk can actually cast, because a page that turned out to
 * be inert would be half the ability doing nothing.
 */
export const DOUBLE_FACE_PAGES: readonly HatsuInteractionKind[] = [
  'devour',
  'pocket',
  'teleport',
  'polarity',
  'command',
  'identity-swap',
  'divination',
  'prophecy',
  'clone',
]

/**
 * A book with two of them in it: one on the open page, one under the bookmark.
 *
 * Which two is the walk's own roll rather than the archive's — Chrollo's book
 * held over a hundred, and the two he has to hand at any moment is exactly the
 * kind of thing no record of the Black Whale settles.
 */
export function openTheBook(random: () => number = Math.random): TourBook {
  const left = DOUBLE_FACE_PAGES[Math.floor(random() * DOUBLE_FACE_PAGES.length)]
  const rest = DOUBLE_FACE_PAGES.filter((page) => page !== left)
  const right = rest[Math.floor(random() * rest.length)]
  return { ...CLOSED_BOOK, pages: [left, right], open: left, bookmark: right }
}

/** The open page and the bookmarked one, in the order the two keys play them. */
export function twoPages(book: TourBook): [HatsuInteractionKind, HatsuInteractionKind] | null {
  if (!book.open || !book.bookmark || book.open === book.bookmark) return null
  return [book.open, book.bookmark]
}

/** The book with the ribbon moved to the other page, which swaps the two keys. */
export function turnTheBook(book: TourBook): TourBook {
  const pair = twoPages(book)
  return pair ? { ...book, open: pair[1], bookmark: pair[0] } : book
}

/**
 * The techniques cast with two hands rather than one.
 *
 * Genthru puts the sun on with one hand and the moon with the other, and the
 * walk has one key per technique to say it with. So the key alternates: the
 * first press is the sun, the next is the moon, and the pair the ability needs
 * is two presses of the same key rather than two keys the visitor has to be
 * told about. Nothing else in the roster casts twice like this yet — the set
 * is here so that when something does, the key already knows how.
 */
export const TWO_HANDED_KINDS = new Set<HatsuInteractionKind>(['polarity'])

/** The other hand. */
export const otherHand = (mark: 'sun' | 'moon'): 'sun' | 'moon' => (mark === 'sun' ? 'moon' : 'sun')

/**
 * The three techniques that are given an order rather than only cast.
 *
 * A double, a bird and an insect all keep doing something after the cast, and
 * what they are doing is a choice the visitor goes on making — so R walks each
 * of them on to its next watch instead of meaning what it means everywhere
 * else.
 */
export const TAKES_ORDERS = new Set<HatsuInteractionKind>(['guardian', 'surveillance', 'scout'])

/** What one key does under the technique in hand. */
export type HatsuKeyAction =
  | 'cast'
  | 'castSolid'
  | 'castSelf'
  | 'castOnSelfInstead'
  | 'sun'
  | 'moon'
  | 'alternate'
  | 'openPage'
  | 'markedPage'
  | 'airDance'
  | 'airBloom'
  | 'airScatter'
  | 'doubleWatch'
  | 'owlFlight'
  | 'insectOrders'

export interface HatsuKey {
  /** The key as it is printed on a keyboard. */
  key: 'F' | 'H 2' | 'H 3'
  action: HatsuKeyAction
  /** Whether a click does the same thing, which only the casting hand has. */
  click: boolean
}

/**
 * Every key the technique in hand answers to, and what each one does.
 *
 * A technique has one cast and, sometimes, a second or a third thing in it —
 * a page, an air, an order to a double, or the cast turned on the visitor
 * themselves. The first is F. The rest are held H, which opens the wheel, and
 * then the number of the one wanted: R and C are not free to be spent here,
 * because R is Ren and C is Ko everywhere in the ship and a key cannot mean
 * two things at once. A visitor who has just picked a technique out of the
 * dock has no way of knowing which of those they are holding, so the panel
 * says it, and this is the one place that decides. It mirrors the wheel in
 * `TourScene`, whose order is the same, and the tests hold the two together.
 */
export function hatsuKeys(profile: HatsuProfile | null, book: TourBook): HatsuKey[] {
  if (!worksInTour(profile)) return []
  // Double Face is not cast itself: the two keys play the two live pages, and
  // a page that is cast with two hands has to alternate on the key it was given.
  const pages = profile.kind === 'bookmark' ? twoPages(book) : null
  if (pages) {
    return [
      { key: 'F', action: pages[0] === 'polarity' ? 'alternate' : 'openPage', click: true },
      { key: 'H 2', action: pages[1] === 'polarity' ? 'alternate' : 'markedPage', click: false },
    ]
  }
  if (TWO_HANDED_KINDS.has(profile.kind)) {
    return [
      { key: 'F', action: 'sun', click: true },
      { key: 'H 2', action: 'moon', click: false },
    ]
  }
  // The one instrument aboard, and the only thing with three of anything: the
  // lively air is the cast, and the other two are the second and third of the
  // wheel. Which piece is played is still chosen at the moment of playing —
  // holding H is the breath before the note.
  if (profile.kind === 'melody') {
    return [
      { key: 'F', action: 'airDance', click: true },
      { key: 'H 2', action: 'airBloom', click: false },
      { key: 'H 3', action: 'airScatter', click: false },
    ]
  }
  const onSolids = aimsAtSolids(profile) || profile.kind === 'mimicry'
  const keys: HatsuKey[] = [
    {
      key: 'F',
      action: onSolids ? 'castSolid' : worksOnTheBody(profile) ? 'castSelf' : 'cast',
      click: true,
    },
  ]
  if (TAKES_ORDERS.has(profile.kind)) {
    keys.push({
      key: 'H 2',
      action:
        profile.kind === 'guardian'
          ? 'doubleWatch'
          : profile.kind === 'surveillance'
            ? 'owlFlight'
            : 'insectOrders',
      click: false,
    })
  } else if (worksOnTheBody(profile) && (aimsAtSolids(profile) || profile.kind === 'heart-vow')) {
    // The ones on both sides of the line, and Judgment Chain: the reticle
    // decides, and the second of the wheel is how the visitor says *me* rather
    // than what is in front. A vow on the self needs no solid to land on.
    keys.push({ key: 'H 2', action: 'castOnSelfInstead', click: false })
  }
  return keys
}

/**
 * One cast on the techniques rather than on the ship.
 */
export function castOnTechniques(
  world: TourWorld,
  kind: HatsuInteractionKind,
  target: Space,
): TourCastResult {
  const book = world.book
  const held = techniqueHolding(world, target.id)
  const withBook = (patch: Partial<TourBook>): TourWorld => ({
    ...world,
    book: { ...book, ...patch },
  })

  switch (kind) {
    // What is taken is let go of: the owner cannot use it while the book has it.
    case 'theft': {
      if (!held) return { world, report: { kind: 'nothing-to-steal', spaceId: target.id } }
      const pages = [...new Set([...book.pages, held])]
      return {
        world: { ...releaseHold(world, target.id), book: { ...book, pages, open: held } },
        report: { kind: 'taken-into-the-book', spaceId: target.id, technique: held },
      }
    }

    // The bookmark is what makes two at once possible at all.
    case 'bookmark': {
      if (book.pages.length < 2) return { world, report: { kind: 'needs-two-pages' } }
      const other = book.pages.find((page) => page !== book.open) ?? null
      return {
        world: withBook({ bookmark: other }),
        report: { kind: 'bookmarked', technique: other! },
      }
    }

    // Culdcept acquires without taking — and the arrow it cannot pierce is the
    // arrow that has already been through the room.
    case 'capture': {
      if (world.souls.some(([a, b]) => a === target.id || b === target.id)) {
        return { world, report: { kind: 'acquisition-failed', spaceId: target.id } }
      }
      if (!held) return { world, report: { kind: 'nothing-to-steal', spaceId: target.id } }
      return {
        world: withBook({ cards: [...book.cards, held] }),
        report: { kind: 'carded', spaceId: target.id, technique: held },
      }
    }

    // Only the dead pass anything on. A room that has been killed — emptied, or
    // chained shut — is the walk's only corpse, and what it hands over is
    // whatever killed it.
    case 'inherit': {
      const killed = world.emptied.includes(target.id)
        ? ('vacuum' as HatsuInteractionKind)
        : world.shut.includes(target.id)
          ? ('chain-bind' as HatsuInteractionKind)
          : null
      if (!killed) return { world, report: { kind: 'not-eligible', spaceId: target.id } }
      const pages = [...new Set([...book.pages, killed])]
      return {
        world: {
          ...withBook({ pages, open: book.open ?? killed }),
          // The star is what the baton leaves behind: the room it was taken
          // from wears it, so the inheritance is somewhere other than the book.
          stars: [...new Set([...world.stars, target.id])],
        },
        report: { kind: 'inherited', spaceId: target.id, technique: killed },
      }
    }

    // The chain drains as it takes: nothing reaches that room again until the
    // book gives it back.
    case 'chain-rule': {
      if (!held) return { world, report: { kind: 'nothing-to-steal', spaceId: target.id } }
      const pages = [...new Set([...book.pages, held])]
      return {
        world: {
          ...releaseHold(world, target.id),
          book: { ...book, pages, open: held, zetsu: [...new Set([...book.zetsu, target.id])] },
        },
        report: { kind: 'drained', spaceId: target.id, technique: held },
      }
    }

    // The dolphin only exists during Emperor Time, and what it does is explain
    // a captured ability and open it to someone who could not otherwise use it.
    case 'ability-loan': {
      if (!world.laidOpen) return { world, report: { kind: 'needs-emperor-time' } }
      const lent = book.open ?? book.pages[0]
      if (!lent) return { world, report: { kind: 'nothing-to-lend' } }
      return { world: withBook({ loan: lent }), report: { kind: 'lent', technique: lent } }
    }

    default:
      return { world, report: { kind: 'inert' } }
  }
}

export const BOOK_HATSU_KINDS = new Set<HatsuInteractionKind>([
  'theft',
  'bookmark',
  'capture',
  'inherit',
  'chain-rule',
  'ability-loan',
])

/** Whether a technique reads the book rather than the ship. */
export const worksOnTechniques = (profile: HatsuProfile | null) =>
  Boolean(profile) && BOOK_HATSU_KINDS.has(profile!.kind)

/**
 * Runs one cast against the world and returns the next one.
 *
 * Pure, and total: an unhandled kind reports `inert` rather than throwing, so a
 * technique picked from the dock can never break the walk.
 *
 * The cast itself is `runCast`; this is where Cat's Name gets to answer it,
 * because a counterattack is by definition something that happens *because* of
 * what another technique just did.
 */
export function castInTour(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult {
  return answerForTheCat(world, runCast(world, kind, input))
}

/**
 * A room under Cat's Name that is killed strikes back at whoever killed it.
 *
 * Only direct death counts: emptying a room or chaining it shut is a killing,
 * and everything short of that — moving what stands in it, watching it,
 * walking through its walls — passes the ability by, exactly as refusing to
 * kill does. What the counterattack takes is everything the aura was holding.
 */
export function answerForTheCat(before: TourWorld, result: TourCastResult): TourCastResult {
  const killed = before.ninelives.find(
    (id) =>
      (result.world.emptied.includes(id) && !before.emptied.includes(id)) ||
      (result.world.shut.includes(id) && !before.shut.includes(id)),
  )
  if (!killed) return result

  const released = holdsInWorld(before).length
  return {
    world: {
      ...EMPTY_WORLD,
      // What the walk remembers of itself is not a hold, and is not taken.
      trail: result.world.trail,
      cameFrom: result.world.cameFrom,
    },
    report: { kind: 'counterattack', spaceId: killed, released },
  }
}

/**
 * The sleeping body has to be somewhere the walk still leaves alone.
 *
 * Shut it, guard it or empty it and Hanzo is pulled back into it, whatever he
 * was in the middle of — so this is answered before the cast is even read.
 */
export function pullBackTheBody(world: TourWorld): TourCastResult | null {
  if (!world.body.projected) return null
  const where = world.body.projected.spaceId
  const disturbed =
    world.shut.includes(where) || world.guarded.includes(where) || world.emptied.includes(where)
  if (!disturbed) return null
  return {
    world: { ...world, body: { ...world.body, projected: null } },
    travelTo: where,
    report: { kind: 'body-disturbed', spaceId: where },
  }
}

/**
 * The four casts that need nothing to aim at.
 *
 * Emperor Time sweeps the whole ship, the monkeys work on the visitor's own
 * senses, phasing is a state rather than a place, and Chrollo's teleport draws
 * its destination rather than being pointed at one.
 */
export function castWithoutARoom(
  world: TourWorld,
  kind: HatsuInteractionKind,
  input: TourCastInput,
): TourCastResult | null {
  const { ship, standingIn } = input

  if (kind === 'scarlet') {
    return {
      world: { ...world, laidOpen: true },
      report: { kind: 'laid-open', spaces: ship.spaces.size, decks: ship.tiers.length },
    }
  }

  if (kind === 'senses') {
    const sealed = (world.sealed + 1) % 4
    return { world: { ...world, sealed }, report: { kind: 'sealed', stage: sealed } }
  }

  if (kind === 'spatial') {
    const phasing = !world.phasing
    return { world: { ...world, phasing }, report: { kind: 'phasing', on: phasing } }
  }

  if (kind === 'teleport') {
    const random = input.random ?? Math.random
    const elsewhere = [...ship.spaces.keys()].filter((id) => id !== standingIn)
    if (!elsewhere.length) return { world, report: { kind: 'no-target' } }
    const spaceId =
      elsewhere[Math.min(elsewhere.length - 1, Math.floor(random() * elsewhere.length))]
    return { world, report: { kind: 'teleported', spaceId }, travelTo: spaceId }
  }

  return null
}

/** Everything one cast against a room works with, gathered once by `runCast`. */
/**
 * Air Blow strips what another technique put on a room, from any distance, and
 * moves nothing: the room comes back as the blueprint has it.
 */
export function stripTheRoom({ world, ship, target }: RoomCastContext): TourCastResult {
  let count = 0
  const next = { ...world }
  if (next.isolated?.spaceId === target.id) {
    next.isolated = null
    count++
  }
  if (next.doors.includes(target.id)) {
    next.doors = without(next.doors, (id) => id === target.id)
    count++
  }
  if (next.emptied.includes(target.id)) {
    next.emptied = without(next.emptied, (id) => id === target.id)
    count++
  }
  if (next.watched.some((doll) => doll.spaceId === target.id)) {
    next.watched = without(next.watched, (doll) => doll.spaceId === target.id)
    count++
  }
  if (next.eye === target.id) {
    next.eye = null
    count++
  }
  if (next.dowsing === target.id) {
    next.dowsing = null
    count++
  }
  // What the later waves hung in a room is hung on it just as much as a doll
  // is: the bird is blown off its perch, the cards off the table, the star off
  // the ceiling, the double out of the corner, the mark off the victim and the
  // near mouth of the tunnel shut.
  if (next.owl === target.id) {
    next.owl = null
    count++
  }
  if (next.stars.includes(target.id)) {
    next.stars = without(next.stars, (id) => id === target.id)
    count++
  }
  if (next.cards[target.id]) {
    const cards = { ...next.cards }
    delete cards[target.id]
    next.cards = cards
    next.pinned = next.pinned === target.id ? null : next.pinned
    count++
  }
  if (next.double === target.id) {
    next.double = null
    count++
  }
  if (next.curse?.victim === target.id) {
    next.curse = null
    count++
  }
  if (next.worm && (next.worm.a === target.id || next.worm.b === target.id)) {
    next.worm = null
    count++
  }
  // And any Guardian Spirit Beast standing in it. A blast that put out a beast
  // and left the room floating would be a blast that had not finished: the
  // solids below are cleared wholesale, which takes the levitation and the melt
  // off with everything else.
  if (next.medusa === target.id) {
    next.medusa = null
    count++
  }
  if (next.chimera === target.id) {
    next.chimera = null
    count++
  }
  if (next.toad === target.id) {
    next.toad = null
    count++
  }
  if (next.centipede === target.id) {
    next.centipede = null
    count++
  }
  if (next.smoke?.spaceId === target.id) {
    next.smoke = null
    count++
  }
  if (next.cat === target.id) {
    next.cat = null
    count++
  }
  if (next.dragon === target.id) {
    next.dragon = null
    next.pinned = next.pinned === target.id ? null : next.pinned
    count++
  }
  if (next.menagerie.includes(target.id)) {
    next.menagerie = without(next.menagerie, (id) => id === target.id)
    count++
  }
  if (next.wheel?.spaceId === target.id) {
    next.wheel = null
    count++
  }
  if (next.lit.includes(target.id)) {
    next.lit = without(next.lit, (id) => id === target.id)
    count++
  }
  // And every solid in the room that another technique was holding: the
  // blast is what puts a crushed coffin or a bound bed back where it was.
  const inside = Object.keys(next.solids).filter(
    (id) => solidById(ship, next, id)?.spaceId === target.id,
  )
  if (inside.length) {
    const solids = { ...next.solids }
    for (const id of inside) delete solids[id]
    next.solids = solids
    next.hoover = next.hoover.filter((held) => !inside.includes(held))
    next.copies = next.copies.filter((copy) => !inside.includes(copy.id))
    count += inside.length
  }
  return { world: next, report: { kind: 'stripped', spaceId: target.id, count } }
}

/**
 * What each technique does to a room, one entry per kind.
 *
 * A table rather than one long switch: twenty-seven techniques that share a
 * target and nothing else. The order they are written in is the order the panel
 * lists them, which is the only order they have.
 */
