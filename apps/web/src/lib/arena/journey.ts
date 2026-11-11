import type { BodyZone, CombatAction, CombatState } from '../combat/types'
import { strikeTarget } from './controls'
import { STRIKE_RANGE } from '../combat/resolve'

export type ArenaJourneyControl =
  | 'desktop-strike'
  | 'mobile-strike'
  | 'desktop-guard'
  | 'mobile-guard'

type ArenaJourneyAction = Extract<CombatAction, { type: 'GUARD' | 'STRIKE' }>

/** Shared command contract exercised by both keyboard and touch journeys. */
export function actionForArenaControl(
  control: ArenaJourneyControl,
  state: CombatState,
  zone: BodyZone = 'head',
): ArenaJourneyAction {
  if (control.endsWith('guard')) return { type: 'GUARD', side: 'player' }
  return {
    type: 'STRIKE',
    side: 'player',
    zone,
    targetAt: strikeTarget(state.player.position, state.player.facing, STRIKE_RANGE),
  }
}
