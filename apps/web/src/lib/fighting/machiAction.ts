import { releaseMachiThread } from './machiThread'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** U directs the same needle-and-thread marking action, never a detached aura bullet. */
export function performMachiAction(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (fighter.id !== 'machi') return null
  if (kind === 'ranged')
    return perform({ ...options, kind: 'special', moveId: 'machi:forwardSpecial' })
  if (kind !== 'special') return null
  if (!moveId) return perform({ ...options, moveId: 'machi:neutralSpecial' })
  if (moveId !== 'machi:backSpecial') return null
  const free =
    fighter.health > 0 && fighter.hitStun === 0 && fighter.knockdownFrames === 0 && !fighter.attack
  return free ? releaseMachiThread(state, side) : state
}
