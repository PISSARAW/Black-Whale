import { writable } from 'svelte/store'

export const CLASH_TRACKS = {
  menu: ['Black Whale Clash', 'Black Whale Clash'],
  'whale-hold': ['Cale du Black Whale', 'Black Whale Hold'],
  'heavens-arena': ['Tour Céleste', 'Heavens Arena'],
  'vip-casino': ['Casino VIP', 'VIP Casino'],
  'banquet-hall': ['Salle du banquet', 'Banquet Hall'],
  'princes-burial-chamber': ['Chambre funéraire', 'Princes’ Burial Chamber'],
} as const

export type ClashTrack = keyof typeof CLASH_TRACKS
export type ClashTrackChoice = ClashTrack | 'auto' | 'off'
export const jukeboxPreview = writable<ClashTrack | null>(null)

export function readTrackChoice(value: unknown): ClashTrackChoice {
  if (value === 'off') return value
  return typeof value === 'string' && Object.hasOwn(CLASH_TRACKS, value)
    ? (value as ClashTrack)
    : 'auto'
}
