import type { Locale } from '$lib/i18n/config'
import { localizeHatsu } from '$lib/i18n/hatsu'
import { HATSU_PROFILES, hatsuById } from '$lib/nen/hatsuRegistry'
import {
  EMPEROR_TIME_LIFE_LIMIT_HOURS,
  activateHatsu,
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
  TABLE_KINDS,
  type MorenaGame,
  type TableKind,
} from './morena'

export const MORENA_LIFE_PER_SECOND = 48
export const MORENA_REFUSAL_THRESHOLD = Math.round(EMPEROR_TIME_LIFE_LIMIT_HOURS / 3)

export const MORENA_ARCHETYPE_IDS = [
  'emperor-time',
  'dowsing-chain',
  'lovely-ghostwriter',
  'gallery-fake',
  'judgment-chain',
  'black-voice',
] as const

export interface MorenaLabTechnique {
  id: string
  kind: TableKind | 'bookmark'
  name: string
  owner: string
  color: string
  featured: boolean
}

export function morenaLabTechniques(locale: Locale): MorenaLabTechnique[] {
  const ids = [...TABLE_KINDS.map((kind) => moveFor(kind).hatsuId), 'double-face']
  return ids.flatMap((id) => {
    const profile = hatsuById(id)
    if (!profile) return []
    const localized = localizeHatsu(profile, locale)
    return [
      {
        id,
        kind: profile.kind as TableKind | 'bookmark',
        name: localized.name,
        owner: localized.owner,
        color: profile.color,
        featured: MORENA_ARCHETYPE_IDS.includes(id as (typeof MORENA_ARCHETYPE_IDS)[number]),
      },
    ]
  })
}

export function morenaLabLoadout(id: string | null) {
  if (id === 'double-face') return { tableKind: null, carryingBook: true }
  const profile = hatsuById(id)
  const tableKind =
    profile && TABLE_KINDS.includes(profile.kind as TableKind) ? (profile.kind as TableKind) : null
  return { tableKind, carryingBook: false }
}

export function activateMorenaLabHatsu(id: string | null) {
  const profile = hatsuById(id)
  return profile ? activateHatsu(profile) : false
}

export function adaptMorenaHatsu(game: MorenaGame, locale: Locale) {
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
    seats,
    keyed,
    hands: keyed.length === 2 ? { first: keyed[0].name, second: keyed[1].name } : null,
    auraColor: seats[0]
      ? (HATSU_PROFILES.find((profile) => profile.id === seats[0].move.hatsuId)?.color ?? null)
      : null,
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
