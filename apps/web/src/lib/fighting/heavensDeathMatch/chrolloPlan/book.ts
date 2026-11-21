import {
  toggleChrolloBookmark,
  turnChrolloPage,
  type ChrolloBookState,
  type ChrolloPage,
} from '../../chrolloBook'
import { pageActive } from '../puppets/pipeline'

/** One visible gesture of the hand on the book. */
export type BookStep = 'turn' | 'bookmark' | 'open'

export function applyBookStep(book: ChrolloBookState, step: BookStep): ChrolloBookState {
  if (step === 'turn') return turnChrolloPage(book)
  if (step === 'open') return book.open ? book : { ...book, open: true }
  return toggleChrolloBookmark(book)
}

function turnsTo(book: ChrolloBookState, page: ChrolloPage): BookStep[] {
  const target = book.pages.indexOf(page)
  if (target < 0) return []
  const turns = (target - book.page + book.pages.length) % book.pages.length
  return Array.from({ length: turns }, () => 'turn' as const)
}

/**
 * The gestures that make `open` the open page and keep `held` under the bookmark
 * (Double Face): page → bookmark (which closes) → reopen → new page. Empty when the
 * book already serves both, or when a page is missing from it.
 */
export function bookStepsTo(
  book: ChrolloBookState,
  open: ChrolloPage,
  held?: ChrolloPage,
): BookStep[] {
  if (!book.pages.includes(open) || (held && !book.pages.includes(held))) return []
  const holdReady = !held || book.bookmark === held
  if (holdReady && book.open && book.pages[book.page] === open) return []
  const steps: BookStep[] = []
  let current = book
  const run = (step: BookStep) => {
    steps.push(step)
    current = applyBookStep(current, step)
  }
  if (!current.open) run('open')
  if (!holdReady) {
    turnsTo(current, held!).forEach(run)
    run('bookmark')
    run('open')
  }
  turnsTo(current, open).forEach(run)
  return steps
}

/** Pages the intent needs active at once: the first open, the second under the bookmark. */
export function pagesServed(book: ChrolloBookState, pages: readonly ChrolloPage[]): boolean {
  return pages.every((page) => pageActive(book, page))
}
