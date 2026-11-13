/**
 * Skill Hunter's pages and the controls that expose multi-action techniques.
 *
 * This is presentation-neutral state: a page can be spent by the walk, and a
 * key describes an action without knowing whether Svelte renders it as a
 * button, a wheel entry or a keyboard shortcut.
 */
import type { HatsuInteractionKind, HatsuProfile } from '$lib/nen/hatsuRegistry'
import { aimsAtSolids, worksInTour, worksOnTheBody } from './cast/kinds'
import { CLOSED_BOOK, type TourBook, type TourWorld } from './cast/types'

/** What a page costs to use. */
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

/** A book with two distinct pages, one open and one under the bookmark. */
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

/** Techniques whose two hands alternate on repeated casts. */
export const TWO_HANDED_KINDS = new Set<HatsuInteractionKind>(['polarity'])

/** The other hand. */
export const otherHand = (mark: 'sun' | 'moon'): 'sun' | 'moon' => (mark === 'sun' ? 'moon' : 'sun')

/** Techniques that keep answering orders after their first cast. */
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
  key: 'H' | 'H 2' | 'H 3'
  action: HatsuKeyAction
  /** Whether a click does the same thing, which only the casting hand has. */
  click: boolean
}

function pageKeys(book: TourBook): HatsuKey[] | null {
  const pages = twoPages(book)
  if (!pages) return null
  return [
    { key: 'H', action: pages[0] === 'polarity' ? 'alternate' : 'openPage', click: true },
    { key: 'H 2', action: pages[1] === 'polarity' ? 'alternate' : 'markedPage', click: false },
  ]
}

function orderedAction(kind: HatsuInteractionKind): HatsuKeyAction {
  if (kind === 'guardian') return 'doubleWatch'
  if (kind === 'surveillance') return 'owlFlight'
  return 'insectOrders'
}

function specialKeys(profile: HatsuProfile, book: TourBook): HatsuKey[] | null {
  if (profile.kind === 'bookmark') {
    const pages = pageKeys(book)
    if (pages) return pages
  }
  if (TWO_HANDED_KINDS.has(profile.kind)) {
    return [
      { key: 'H', action: 'sun', click: true },
      { key: 'H 2', action: 'moon', click: false },
    ]
  }
  if (profile.kind === 'melody') {
    return [
      { key: 'H', action: 'airDance', click: true },
      { key: 'H 2', action: 'airBloom', click: false },
      { key: 'H 3', action: 'airScatter', click: false },
    ]
  }
  return null
}

function primaryAction(profile: HatsuProfile): HatsuKeyAction {
  const onSolids = aimsAtSolids(profile) || profile.kind === 'mimicry'
  if (onSolids) return 'castSolid'
  return worksOnTheBody(profile) ? 'castSelf' : 'cast'
}

function secondaryKey(profile: HatsuProfile): HatsuKey | null {
  if (TAKES_ORDERS.has(profile.kind)) {
    return { key: 'H 2', action: orderedAction(profile.kind), click: false }
  }
  if (worksOnTheBody(profile) && (aimsAtSolids(profile) || profile.kind === 'heart-vow')) {
    return { key: 'H 2', action: 'castOnSelfInstead', click: false }
  }
  return null
}

/** Every key the technique in hand answers to, and what each one does. */
export function hatsuKeys(profile: HatsuProfile | null, book: TourBook): HatsuKey[] {
  if (!worksInTour(profile)) return []
  const special = specialKeys(profile, book)
  if (special) return special
  const keys: HatsuKey[] = [{ key: 'H', action: primaryAction(profile), click: true }]
  const second = secondaryKey(profile)
  if (second) keys.push(second)
  return keys
}
