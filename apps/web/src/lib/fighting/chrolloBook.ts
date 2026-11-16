import { hatsuSealedByOn } from './onTechnique'
import type { ArcadeFighter, FighterId } from './types'

export type ChrolloPage = 'sun-and-moon' | 'black-voice' | Exclude<FighterId, 'chrollo'>

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
  return (
    fighter.health > 0 &&
    fighter.aura > 0 &&
    fighter.nen.mode !== 'zetsu' &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    !hatsuSealedByOn(fighter)
  )
}

export function chrolloPageForMove(
  fighter: ArcadeFighter,
  moveId = CHROLLO_USE,
): ChrolloPage | null {
  if (fighter.id !== 'chrollo' || !chrolloNenActive(fighter)) return null
  const book = fighter.chrolloBook
  if (!book) return null
  if (moveId === CHROLLO_SECONDARY) return book.bookmark
  if (moveId !== CHROLLO_USE) return null
  return book.open ? (book.pages[book.page] ?? null) : book.bookmark
}

export function chrolloPageSource(page: ChrolloPage | null): FighterId | null {
  if (page === 'sun-and-moon' || page === 'black-voice') return 'chrollo'
  return page
}

export function chrolloSourceFor(fighter: ArcadeFighter, moveId = CHROLLO_USE): FighterId | null {
  if (!chrolloNenActive(fighter)) return null
  if (moveId === CHROLLO_STEAL) return 'chrollo'
  return chrolloPageSource(chrolloPageForMove(fighter, moveId))
}

export function chrolloHasActivePage(fighter: ArcadeFighter, page: ChrolloPage): boolean {
  const book = fighter.chrolloBook
  if (!book || !chrolloNenActive(fighter)) return false
  return book.bookmark === page || (book.open && book.pages[book.page] === page)
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
