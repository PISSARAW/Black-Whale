import { performArsenalAction } from './arsenalExecution'
import { perceivedOpponentGap } from './opponentAwareness'
import { historicalWeaponReady } from './historicalWeapons'
import type { ArcadeFighter, FightState } from './types'
import type { AuraAttackOptions } from './auraAttackAction'

/** Draw the carried Ben knife through the player's interruptible equipment command. */
export function chrolloEquipmentAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const fighter = state.opponent
  if (!canDraw(fighter)) return null
  const gap = perceivedOpponentGap(state)
  if (gap < 12 || gap > 40 || !Number.isFinite(gap) || fighter.pressureRead?.move) return null
  const next = performArsenalAction(
    { state, side: 'opponent', command: { action: 'weapon-ready' } },
    perform,
  )
  return next === state ? null : next
}
function canDraw(fighter: ArcadeFighter): boolean {
  if (fighter.id !== 'chrollo' || fighter.historicalWeapon || !historicalWeaponReady(fighter))
    return false
  return !fighter.chrolloHistorical?.cloth && !fighter.chrolloHistorical?.touch
}
