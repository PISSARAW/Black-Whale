import { get, writable } from 'svelte/store'
import type { HatsuInteractionKind, HatsuProfile } from './hatsuRegistry.js'

/**
 * All three keys live in sessionStorage so an activation and the penalties it
 * incurs share one lifetime. Keeping the active Hatsu in localStorage let a new
 * tab restore the technique while resetting its Emperor Time debt and its
 * forced Zetsu, which made the cost free.
 */
const ACTIVE_HATSU_KEY = 'black-whale:hatsu'
const EMPEROR_TIME_HOURS_KEY = 'black-whale:emperor-time-hours'
const FORCED_ZETSU_UNTIL_KEY = 'black-whale:forced-zetsu-until'

export const EMPEROR_TIME_LIFE_LIMIT_HOURS = 365 * 24
export const FORCED_ZETSU_DURATION_MS = 5 * 60 * 1000

export const activeHatsu = writable<HatsuProfile | null>(null)
export const hatsuPanelOpen = writable(false)
export const emperorTimeLifeHours = writable(0)
export const forcedZetsuUntil = writable(0)
export const parallelFutureVisible = writable(false)

/**
 * A room that only admits some techniques.
 *
 * Most of the site takes any aura: a technique that has nothing to say to a
 * page simply says nothing, and that is honest enough. A few places are not
 * like that — Morena's table is the first — because sitting down there is a
 * commitment, and offering the visitor eighty-odd techniques of which a
 * handful do anything is not a choice, it is a search.
 *
 * So a page may state which kinds still work while it is in charge. The dock
 * greys out the rest, `activateHatsu` refuses them, and the gate carries its
 * own sentence explaining why — the dock is site-wide and must not know what a
 * card table is.
 *
 * It gates *taking a technique up*, not the one already in hand. Walking into
 * a room does not strip a visitor of what they were carrying; it only stops
 * them shopping for something the room was never going to let them use.
 */
export interface HatsuGate {
  /** True when a technique of this kind still has something to do here. */
  admits: (kind: HatsuInteractionKind) => boolean
  /** Why the rest do not, in the reader's language, ready to be shown. */
  reason: string
}

export const hatsuGate = writable<HatsuGate | null>(null)

/** Whether the gate currently in force turns this profile away. */
export function hatsuIsBlocked(profile: HatsuProfile, gate: HatsuGate | null = get(hatsuGate)) {
  return gate !== null && !gate.admits(profile.kind)
}

/** Put a gate in force. A page holds one only while it is the page in charge. */
export function openHatsuGate(gate: HatsuGate) {
  hatsuGate.set(gate)
}

/** Take it away again, which every page that opens one owes on the way out. */
export function closeHatsuGate() {
  hatsuGate.set(null)
}

function readSessionNumber(key: string) {
  if (typeof sessionStorage === 'undefined') return 0
  const value = Number(sessionStorage.getItem(key))
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function hydrateHatsuSession() {
  const lifeHours = Math.min(
    readSessionNumber(EMPEROR_TIME_HOURS_KEY),
    EMPEROR_TIME_LIFE_LIMIT_HOURS - 1,
  )
  const zetsuUntil = readSessionNumber(FORCED_ZETSU_UNTIL_KEY)
  emperorTimeLifeHours.set(lifeHours)

  if (zetsuUntil > Date.now()) {
    forcedZetsuUntil.set(zetsuUntil)
    activeHatsu.set(null)
    hatsuPanelOpen.set(false)
    return
  }

  forcedZetsuUntil.set(0)
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(FORCED_ZETSU_UNTIL_KEY)
}

export function refreshForcedZetsu() {
  const until = get(forcedZetsuUntil)
  if (!until || until > Date.now()) return until
  forcedZetsuUntil.set(0)
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(FORCED_ZETSU_UNTIL_KEY)
  return 0
}

export function activateHatsu(profile: HatsuProfile) {
  if (refreshForcedZetsu() > Date.now()) {
    hatsuPanelOpen.set(false)
    return false
  }
  // A room that has said which techniques work in it is obeyed here rather
  // than only in the picker: the same activation arrives from a link, from the
  // `black-whale:activate-hatsu` event and from a remembered session, and a
  // rule enforced on one path out of three is not a rule.
  if (hatsuIsBlocked(profile)) return false
  parallelFutureVisible.set(profile.id === 'parallel-future')
  activeHatsu.set(profile)
  hatsuPanelOpen.set(false)
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(ACTIVE_HATSU_KEY, profile.id)
  return true
}

export function deactivateHatsu() {
  activeHatsu.set(null)
  parallelFutureVisible.set(false)
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(ACTIVE_HATSU_KEY)
}

export function consumeEmperorTimeHour() {
  const next = get(emperorTimeLifeHours) + 1
  if (next < EMPEROR_TIME_LIFE_LIMIT_HOURS) {
    emperorTimeLifeHours.set(next)
    if (typeof sessionStorage !== 'undefined')
      sessionStorage.setItem(EMPEROR_TIME_HOURS_KEY, String(next))
    return false
  }

  emperorTimeLifeHours.set(0)
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(EMPEROR_TIME_HOURS_KEY, '0')
  enterForcedZetsu()
  return true
}

export function enterForcedZetsu() {
  const until = Date.now() + FORCED_ZETSU_DURATION_MS
  forcedZetsuUntil.set(until)
  activeHatsu.set(null)
  parallelFutureVisible.set(false)
  hatsuPanelOpen.set(false)
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(ACTIVE_HATSU_KEY)
  if (typeof sessionStorage !== 'undefined')
    sessionStorage.setItem(FORCED_ZETSU_UNTIL_KEY, String(until))
}
