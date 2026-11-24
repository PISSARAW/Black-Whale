import { fightContactStyle } from '../fightContactStyle'
import type { FightSoundEvent } from './events'

export type CommentaryLine =
  | 'comment-parry'
  | 'comment-punish'
  | 'comment-counter'
  | 'comment-string'
  | 'comment-burst'
  | 'comment-assist'

/** Read public confirmed events only. Tactical outcomes take precedence over color. */
export function commentaryLine(events: readonly FightSoundEvent[]): CommentaryLine | undefined {
  const impacts = events.flatMap((event) => (event.impact ? [event.impact] : []))
  if (impacts.some((hit) => fightContactStyle(hit) === 'parry')) return 'comment-parry'
  if (events.some((event) => event.kind === 'burst')) return 'comment-burst'
  const landed = impacts.filter((hit) => fightContactStyle(hit) === 'hit' && hit.damage > 0)
  if (landed.some((hit) => hit.punish)) return 'comment-punish'
  if (landed.some((hit) => hit.counterHit)) return 'comment-counter'
  if (landed.some((hit) => hit.comboHits === 5)) return 'comment-string'
  if (events.some((event) => event.kind === 'assist-entry')) return 'comment-assist'
}
