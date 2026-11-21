import type { Component } from 'svelte'
import type { FighterId } from '../../src/lib/fighting/types'
import type { Segment } from './reel'
import type { Shot } from './timeline'

export type BuiltSegment = Segment & { id: string }

/** Everything that changes from one character presentation to the next. */
export interface HeroConfig {
  id: FighterId
  first: string
  last: string
  kicker: string
  build: () => BuiltSegment[]
  /** The closing card's three lines, for videos that are not about one hero. */
  outro?: { kicker: string; word: string; tag: string }
  /** A video's own overlay (the per-hero intro one by default). */
  overlay?: Component<{
    shot: Shot
    mask: number
    hero: HeroConfig
    segment: BuiltSegment | undefined
  }>
}
