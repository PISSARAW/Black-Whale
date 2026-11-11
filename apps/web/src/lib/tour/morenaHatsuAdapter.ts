import type { Locale } from '$lib/i18n/config'
import { localizeHatsu } from '$lib/i18n/hatsu'
import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import {
  EMPEROR_TIME_LIFE_LIMIT_HOURS,
  closeHatsuGate,
  emperorTimeLifeHours,
  openHatsuGate,
  spendEmperorTimeHours,
} from '$lib/nen/hatsuState'
import { get } from 'svelte/store'
import {
  castsItself,
  livePages,
  moveFor,
  sheWillNotPlay,
  sitsAtTheTable,
  theEyesTakeYou,
  worksAtTheTable,
  type MorenaGame,
  type TableKind,
} from './morena'

export const MORENA_LIFE_PER_SECOND = 48
export const MORENA_REFUSAL_THRESHOLD = Math.round(EMPEROR_TIME_LIFE_LIMIT_HOURS / 3)

export function adaptMorenaHatsu(game: MorenaGame, carried: HatsuProfile | null, locale: Locale) {
  const tableKind = worksAtTheTable(carried?.kind) ? (carried!.kind as TableKind) : null
  const carryingBook = carried?.kind === 'bookmark'
  const seats = livePages(game).map((seat) => {
    const move = moveFor(seat.kind)
    const profile = HATSU_PROFILES.find((candidate) => candidate.id === move.hatsuId)
    return {
      ...seat,
      move,
      name: profile ? localizeHatsu(profile, locale).name : seat.kind,
      usedUp: seat.spent >= move.uses,
      unbidden: castsItself(seat.kind),
    }
  })
  const keyed = seats.filter((seat) => !seat.unbidden)
  return {
    tableKind,
    carryingBook,
    seats,
    keyed,
    hands: keyed.length === 2 ? { first: keyed[0].name, second: keyed[1].name } : null,
  }
}

/** Opens the site-wide picker gate only while a live hand owns the page. */
export function syncMorenaHatsuGate(active: boolean, reason: string) {
  if (!active) {
    closeHatsuGate()
    return
  }
  openHatsuGate({ admits: sitsAtTheTable, reason })
  return closeHatsuGate
}

/** Advances only the table's accelerated Emperor Time bill. */
export function advanceMorenaEmperorTime(game: MorenaGame): MorenaGame {
  if (spendEmperorTimeHours(MORENA_LIFE_PER_SECOND)) return theEyesTakeYou(game)
  if (get(emperorTimeLifeHours) >= MORENA_REFUSAL_THRESHOLD) return sheWillNotPlay(game)
  return game
}

export const morenaLifeScorch = (hours: number) =>
  Math.min(1, hours / EMPEROR_TIME_LIFE_LIMIT_HOURS)
