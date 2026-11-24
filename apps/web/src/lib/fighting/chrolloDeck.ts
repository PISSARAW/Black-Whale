import type { ArcadeFighter, FightState } from './types'
import type { ChrolloBookState, ChrolloPage } from './chrolloBook'

export type BookSlot = 0 | 1 | 2 | 3 | 'stolen'
export type ChrolloDeckPreset = 'heavens-arena' | 'yorknew' | 'black-whale'
export type ChrolloDeck = readonly [ChrolloPage, ChrolloPage, ChrolloPage, ChrolloPage]

export const CHROLLO_DECK_PRESETS: Readonly<Record<ChrolloDeckPreset, ChrolloDeck>> = {
  'heavens-arena': ['sun-and-moon', 'black-voice', 'order-stamp', 'convert-hands'],
  yorknew: ['indoor-fish', 'fun-fun-cloth', 'lovely-ghostwriter', 'chrollo-teleportation'],
  'black-whale': ['sun-and-moon', 'black-voice', 'indoor-fish', 'fun-fun-cloth'],
}

export function bookPagesFromDeck(
  deck: ChrolloDeck,
  stolenPage: ChrolloPage | null,
): ChrolloPage[] {
  return stolenPage ? [...deck, stolenPage] : [...deck]
}

export function pageAtSlot(
  book: ChrolloBookState,
  slot: BookSlot | null | undefined,
): ChrolloPage | null {
  if (slot === null || slot === undefined) return null
  if (slot === 'stolen') return book.stolenPage ?? null
  return book.deck?.[slot] ?? book.pages[slot] ?? null
}

export function slotForPage(book: ChrolloBookState, page: ChrolloPage | null): BookSlot | null {
  if (!page) return null
  if (book.stolenPage === page) return 'stolen'
  const index = (book.deck ?? book.pages).indexOf(page)
  if (index >= 0 && index <= 3) return index as 0 | 1 | 2 | 3
  return null
}

export function isSlotRevealed(book: ChrolloBookState, slot: BookSlot): boolean {
  return Boolean(book.revealedSlots?.includes(slot))
}

export function revealBookSlot(book: ChrolloBookState, slot: BookSlot | null): ChrolloBookState {
  if (slot === null || isSlotRevealed(book, slot)) return book
  return { ...book, revealedSlots: [...(book.revealedSlots ?? []), slot] }
}

/** Synchronizes legacy `pages`/`page`/`open`/`bookmark` fields with the 4+1 slot model. */
export function syncChrolloBook(book: ChrolloBookState): ChrolloBookState {
  const deck = book.deck ?? CHROLLO_DECK_PRESETS['heavens-arena']
  const stolenPage = book.stolenPage ?? null
  const pages = bookPagesFromDeck(deck, stolenPage)
  const openSlot =
    book.openSlot === undefined ? (book.open ? (book.page as BookSlot) : null) : book.openSlot
  const bookmarkSlot =
    book.bookmarkSlot === undefined ? slotForPage(book, book.bookmark) : book.bookmarkSlot
  const open = openSlot !== null
  const activePage = openSlot === 'stolen' ? pages.length - 1 : (openSlot ?? book.page)
  return {
    ...book,
    deck,
    stolenPage,
    pages,
    page: Math.max(0, Math.min(pages.length - 1, activePage)),
    open,
    openSlot,
    bookmarkSlot,
    bookmark: pageAtSlot({ ...book, deck, stolenPage, pages }, bookmarkSlot),
  }
}

export function selectChrolloSlot(book: ChrolloBookState, slot: BookSlot): ChrolloBookState {
  if (slot === 'stolen' && !book.stolenPage) return book
  return syncChrolloBook({ ...book, openSlot: slot, open: true, isFlipping: false })
}

export function chrolloRightHandOccupied(fighter: ArcadeFighter): boolean {
  return (fighter.nenOwner ?? fighter.id) === 'chrollo' && Boolean(fighter.chrolloBook?.open)
}

/** Full ocular Gyo reveals Chrollo's currently open page to the opponent. */
export function advanceChrolloBookIntel(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const other = side === 'player' ? 'opponent' : 'player'
    const chrollo = next[side]
    const viewer = next[other]
    const book = chrollo.chrolloBook
    if (!book?.open || book.openSlot === null || book.openSlot === undefined) continue
    if (!viewer.nen.gyo || viewer.gyoLow) continue
    const revealed = revealBookSlot(book, book.openSlot)
    if (revealed !== book) {
      next = { ...next, [side]: { ...chrollo, chrolloBook: revealed } }
    }
  }
  return next
}
