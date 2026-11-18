import type { FightState } from '../types'
import { isKameoId } from './catalogue'
import type { KameoPicks } from './state'

const SIDES = new Set(['player', 'opponent'])

/**
 * Validates the kameos of a PvP setup from the wire: absent means none; otherwise only
 * `player` / `opponent` keys holding catalogue ids. Anything else rejects the setup.
 */
export function parseKameoPicks(value: unknown): KameoPicks | null {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value)
  if (!entries.every(([side, id]) => SIDES.has(side) && typeof id === 'string' && isKameoId(id)))
    return null
  return Object.fromEntries(entries) as KameoPicks
}

/** The setup field to send: omitted entirely when no camp has a kameo. */
export function kameoSetupField(picks: KameoPicks): { kameos?: KameoPicks } {
  const chosen = Object.fromEntries(Object.entries(picks).filter(([, id]) => id))
  return Object.keys(chosen).length ? { kameos: chosen as KameoPicks } : {}
}

/** The opposing kameo is redacted in a private view exactly like the opposing leader. */
export function opposingKameoBodies(view: FightState, other: 'player' | 'opponent') {
  const fighter = view.kameos?.[other]?.fighter
  return fighter ? [fighter] : []
}
