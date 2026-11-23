import type { ChrolloBookState, ChrolloPage } from '../chrolloBook'
import { HEAVENS_ARENA_PAGES } from '../rivalryRules'
import type { FightState } from '../types'

/** The death-match format id, held here so the scenario owns its own rules. */
export const DEATH_MATCH_FORMAT = 'heavens-death-match' as const

/**
 * Pages prepared before the death match, against any opponent (the Hisoka rivalry adds
 * the same ones). Double Face is not a page: it is the bookmark,
 * which lets a second page stay active once the book is closed.
 */
export const CANONICAL_DEATH_MATCH_PAGES: readonly ChrolloPage[] = HEAVENS_ARENA_PAGES

export function createDeathMatchChrolloBook(): ChrolloBookState {
  return { pages: CANONICAL_DEATH_MATCH_PAGES, page: 0, open: true, bookmark: null }
}

/** Installs the prepared book on every Chrollo of a death-match fight. */
export function prepareDeathMatchLoadout(state: FightState): FightState {
  if (state.formatId !== DEATH_MATCH_FORMAT) return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    if (next[side].id !== 'chrollo') continue
    next = { ...next, [side]: { ...next[side], chrolloBook: createDeathMatchChrolloBook() } }
  }
  return next
}
