import type { BuiltSegment } from '../fighting-chrollo-intro/hero'

/** The four chapters of the explainer and the concept each scene illustrates. */
export const CHAPTERS = [
  { title: 'THE FOUR PRINCIPLES', items: ['TEN', 'ZETSU', 'REN', 'HATSU'] },
  {
    title: 'THE SIX TYPES',
    items: ['ENHANCER', 'TRANSMUTER', 'EMITTER', 'CONJURER', 'MANIPULATOR', 'SPECIALIST'],
  },
  { title: 'ADVANCED TECHNIQUES', items: ['IN', 'GYO', 'EN', 'SHU', 'KEN', 'KO', 'RYU'] },
  { title: 'VOWS AND BEYOND', items: ['VOW', 'POST-MORTEM', 'FULL POWER'] },
] as const

export interface NenTopic {
  chapter: number
  /** A video's own chapter (its title and items), instead of the explainer's. */
  section?: { title: string; items: readonly string[] }
  /** Live engine gauges drawn over the shot. */
  meters?: import('../fighting-clash-systems/meterKinds').MeterKind
  concept: string
  /** Who illustrates it, and with what. */
  example: string
}
export type NenSegment = BuiltSegment & Partial<NenTopic> & { chapterStart?: boolean }
