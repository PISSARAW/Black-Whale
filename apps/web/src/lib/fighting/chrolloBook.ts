import { voluntaryNenAvailable } from './nenAccess'
import { historicalChrolloPage, type HistoricalChrolloPage } from './chrolloHistoricalPages'
import {
  CHROLLO_DECK_PRESETS,
  selectChrolloSlot,
  slotForPage,
  syncChrolloBook,
  type BookSlot,
  type ChrolloDeck,
  type ChrolloDeckPreset,
} from './chrolloDeck'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

export type { BookSlot, ChrolloDeck, ChrolloDeckPreset } from './chrolloDeck'
export {
  CHROLLO_DECK_PRESETS,
  advanceChrolloBookIntel,
  chrolloRightHandOccupied,
  isSlotRevealed,
  pageAtSlot,
  revealBookSlot,
  selectChrolloSlot,
  slotForPage,
  syncChrolloBook,
} from './chrolloDeck'

export type ChrolloSourcePage = HistoricalChrolloPage | Exclude<FighterId, 'chrollo'>
export type ChrolloPage = ChrolloSourcePage | `${FighterId}:${MoveSlot}` | 'biscuit:cookie'

export interface ChrolloBookState {
  /** Presentation only: absent page details in an opponent view are not proof of an absent power. */
  pagesPrivate?: boolean
  pages: readonly ChrolloPage[]
  page: number
  open: boolean
  bookmark: ChrolloPage | null
  /** 4 prepared pages chosen before the match. */
  deck?: ChrolloDeck
  /** 5th slot filled only when Skill Hunter (6S) succeeds. */
  stolenPage?: ChrolloPage | null
  /** Active slot (0..3 or 'stolen'), null when the book is closed. */
  openSlot?: BookSlot | null
  /** Page marked by Double Face (2S). */
  bookmarkSlot?: BookSlot | null
  /** True while 4S is held to pick a deck slot directly. */
  isFlipping?: boolean
  /** Slots already revealed to the opponent (used or read with full Gyo). */
  revealedSlots?: readonly BookSlot[]
}

export const CHROLLO_USE = 'chrollo:neutralSpecial'
export const CHROLLO_STEAL = 'chrollo:forwardSpecial'
export const CHROLLO_BOOKMARK = 'chrollo:downSpecial'
export const CHROLLO_TURN = 'chrollo:backSpecial'
export const CHROLLO_SECONDARY = 'chrollo:finisher'

/** Creates Bandit's Secret with a 4-page prepared deck and an empty 5th stolen slot. */
export function createChrolloBook(
  presetOrDeck: ChrolloDeckPreset | ChrolloDeck = 'heavens-arena',
): ChrolloBookState {
  const deck = Array.isArray(presetOrDeck)
    ? (presetOrDeck as ChrolloDeck)
    : CHROLLO_DECK_PRESETS[presetOrDeck as ChrolloDeckPreset]
  return syncChrolloBook({
    deck,
    stolenPage: null,
    pages: [...deck],
    page: 0,
    open: true,
    openSlot: 0,
    bookmark: null,
    bookmarkSlot: null,
    isFlipping: false,
    revealedSlots: [],
  })
}

export function chrolloNenActive(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter)
}

export function chrolloRawPageForMove(
  fighter: ArcadeFighter,
  moveId = CHROLLO_USE,
): ChrolloPage | null {
  if (fighter.id !== 'chrollo' || !chrolloNenActive(fighter)) return null
  const book = fighter.chrolloBook
  if (!book) return null
  const copied = activeAttackPage(fighter, moveId)
  if (copied && chrolloHasActivePage(fighter, copied)) return copied
  if (moveId === CHROLLO_SECONDARY) return book.bookmark
  if (moveId !== CHROLLO_USE) return null
  return selectedBookPage(book)
}

export function chrolloPageForMove(
  fighter: ArcadeFighter,
  moveId = CHROLLO_USE,
): ChrolloSourcePage | null {
  const page = chrolloRawPageForMove(fighter, moveId)
  return page ? (page.split(':')[0] as ChrolloSourcePage) : null
}

export function chrolloCopiedMove(fighter: ArcadeFighter, moveId = CHROLLO_USE): string | null {
  const page = chrolloRawPageForMove(fighter, moveId)
  if (!page || historicalChrolloPage(page)) return null
  if (fighter.attack?.copiedPage && fighter.attack.moveId === moveId) return fighter.attack.moveId
  return page.includes(':') ? page : `${page}:neutralSpecial`
}

export function chrolloPageSource(page: ChrolloPage | null): FighterId | null {
  if (historicalChrolloPage(page)) return 'chrollo'
  return page ? (page.split(':')[0] as FighterId) : null
}

export function chrolloSourceFor(fighter: ArcadeFighter, moveId = CHROLLO_USE): FighterId | null {
  if (!chrolloNenActive(fighter)) return null
  if (moveId === CHROLLO_STEAL) return 'chrollo'
  return chrolloPageSource(chrolloPageForMove(fighter, moveId))
}

export function chrolloHasActivePage(fighter: ArcadeFighter, page: ChrolloPage): boolean {
  const book = fighter.chrolloBook
  if (!book || !chrolloNenActive(fighter)) return false
  const matches = (entry: ChrolloPage | null) => entry === page || entry?.split(':')[0] === page
  return matches(book.bookmark) || (book.open && matches(book.pages[book.page]))
}

export function chrolloBookMove(moveId?: string): boolean {
  return moveId === CHROLLO_TURN || moveId === CHROLLO_BOOKMARK
}

export function chrolloUtilityMove(fighter: ArcadeFighter): boolean {
  return fighter.id === 'chrollo' && chrolloBookMove(fighter.attack?.moveId)
}

export function chrolloMoveAvailable(fighter: ArcadeFighter, moveId = CHROLLO_USE): boolean {
  if (fighter.id !== 'chrollo' || !moveId.startsWith('chrollo:')) return true
  if (
    !['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'].some(
      (slot) => moveId === `chrollo:${slot}`,
    )
  )
    return true
  if (!fighter.chrolloBook || !chrolloNenActive(fighter)) return false
  if (chrolloBookMove(moveId) || moveId === CHROLLO_STEAL) return !projectionActive(fighter)
  return chrolloPageForMove(fighter, moveId) !== null
}

function projectionActive(fighter: ArcadeFighter): boolean {
  return 'hanzoProjection' in fighter && Boolean(fighter.hanzoProjection)
}

export function turnChrolloPage(book: ChrolloBookState): ChrolloBookState {
  const slots: BookSlot[] = book.stolenPage ? [0, 1, 2, 3, 'stolen'] : [0, 1, 2, 3]
  const currentSlot: BookSlot =
    book.page === 4 && book.stolenPage
      ? 'stolen'
      : ((Math.min(3, Math.max(0, book.page))) as 0 | 1 | 2 | 3)
  const currentIdx = slots.indexOf(currentSlot)
  const nextSlot = slots[(currentIdx + 1) % slots.length]
  return selectChrolloSlot(syncChrolloBook(book), nextSlot)
}

/** One bookmark: placing it replaces the old one and closes the book; reopening preserves it. */
export function toggleChrolloBookmark(book: ChrolloBookState): ChrolloBookState {
  const synced = syncChrolloBook(book)
  if (!synced.open) {
    const reopenSlot: BookSlot =
      synced.page === 4 && synced.stolenPage ? 'stolen' : ((Math.min(3, synced.page)) as 0 | 1 | 2 | 3)
    return syncChrolloBook({ ...synced, open: true, openSlot: reopenSlot, isFlipping: false })
  }
  const activeSlot = synced.openSlot ?? (synced.page as BookSlot)
  if (synced.bookmarkSlot === activeSlot) {
    return syncChrolloBook({ ...synced, bookmarkSlot: null, bookmark: null, isFlipping: false })
  }
  return syncChrolloBook({
    ...synced,
    bookmarkSlot: activeSlot,
    openSlot: null,
    open: false,
    isFlipping: false,
  })
}

export function addChrolloPage(book: ChrolloBookState, page: ChrolloPage): ChrolloBookState {
  const synced = syncChrolloBook(book)
  const existing = slotForPage(synced, page)
  if (existing !== null) return selectChrolloSlot(synced, existing)
  return syncChrolloBook({
    ...synced,
    stolenPage: page,
    openSlot: 'stolen',
    open: true,
    isFlipping: false,
  })
}

function activeAttackPage(fighter: ArcadeFighter, moveId: string): ChrolloPage | undefined {
  return fighter.attack?.moveId === moveId ? fighter.attack?.copiedPage : undefined
}
function selectedBookPage(book: ChrolloBookState): ChrolloPage | null {
  return book.open ? (book.pages[book.page] ?? null) : book.bookmark
}
