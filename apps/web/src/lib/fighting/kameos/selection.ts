import { get, writable } from 'svelte/store'
import type { FightState } from '../types'
import { isKameoId } from './catalogue'
import { withKameos } from './state'
import type { KameoPicks } from './state'

/** The kameos chosen on the setup screen; kept across rematches of the session. */
export const chosenKameos = writable<KameoPicks>({})

/** Parses a picker value: a catalogue id, or nothing for "no kameo". */
export function kameoPick(value: string): KameoPicks['player'] {
  return isKameoId(value) ? value : undefined
}

/** Attaches the chosen kameos to a match that has not started yet. */
export function withChosenKameos(state: FightState): FightState {
  return withKameos(state, get(chosenKameos))
}
