import { voluntaryNenAvailable } from './nenAccess'
import { historicalChrolloPage, type HistoricalChrolloPage } from './chrolloHistoricalPages'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

export type ChrolloSourcePage = HistoricalChrolloPage | Exclude<FighterId, 'chrollo'>
export type ChrolloPage = ChrolloSourcePage | `${FighterId}:${MoveSlot}` | 'biscuit:cookie'

export interface ChrolloBookState {
  pages: readonly ChrolloPage[]
  page: number
  open: boolean
  bookmark: ChrolloPage | null
}

export const CHROLLO_USE = 'chrollo:neutralSpecial'
export const CHROLLO_STEAL = 'chrollo:forwardSpecial'
export const CHROLLO_BOOKMARK = 'chrollo:downSpecial'
export const CHROLLO_TURN = 'chrollo:backSpecial'
export const CHROLLO_SECONDARY = 'chrollo:finisher'

/** Heavens Arena loadout, before Shalnark's death; never a claim about his ship loadout. */
export function createChrolloBook(): ChrolloBookState {
  return { pages: ['sun-and-moon', 'black-voice'], page: 0, open: true, bookmark: null }
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
  return { ...book, page: (book.page + 1) % book.pages.length, open: true }
}

/** One bookmark: placing it replaces the old one; reopening preserves its page. */
export function toggleChrolloBookmark(book: ChrolloBookState): ChrolloBookState {
  if (!book.open) return { ...book, open: true }
  const page = book.pages[book.page]
  if (book.bookmark === page) return { ...book, bookmark: null }
  return { ...book, bookmark: page, open: false }
}

export function addChrolloPage(book: ChrolloBookState, page: ChrolloPage): ChrolloBookState {
  const pages = book.pages.includes(page) ? book.pages : [...book.pages, page]
  return { ...book, pages, page: pages.indexOf(page), open: true }
}

function activeAttackPage(fighter: ArcadeFighter, moveId: string): ChrolloPage | undefined {
  return fighter.attack?.moveId === moveId ? fighter.attack?.copiedPage : undefined
}
function selectedBookPage(book: ChrolloBookState): ChrolloPage | null {
  return book.open ? (book.pages[book.page] ?? null) : book.bookmark
}
