import { fighterEvent, type FightSoundEvent } from './events'
import type { FightSide, FightState } from '../types'

export function battleMusicEvents(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightSoundEvent[] {
  // The articulated body has sustained voices; this cue belongs only to the existing Jupiter.
  const sounding = after.projectiles.some((shot) => shot.jupiter && shot.owner === side)
  if (!sounding || Math.floor(before.frame / 15) === Math.floor(after.frame / 15)) return []
  return [
    {
      ...fighterEvent(after[side], side, 'effect'),
      source: 'bonolenov',
      moveId: 'dance',
      value: after.frame % 60,
    },
  ]
}
