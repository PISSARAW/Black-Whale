import { blinkyAvailable, blinkyCommand, blinkyBloodReady, blinkyState } from './blinky'
import type { AuraAttackOptions } from './auraAttackAction'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter } from './types'

/** Check the actual command before either starting or buffering a copied/borrowed use. */
export function blinkyActionAllowed(options: AuraAttackOptions): boolean {
  if (options.kind !== 'special') return true
  const fighter = options.state[options.side]
  if (fighter.id === 'shizuku' && !blinkyAvailable(fighter)) return false
  const command = blinkyCommand(fighter, options.moveId)
  if (!command) return true
  if (!blinkyAvailable(fighter)) return false
  if (command === 'eject')
    return Boolean(blinkyState(fighter).lastObject || blinkyState(fighter).lastWasBlood)
  return command !== 'blood' || blinkyBloodReady(options.state, options.side)
}

export function blinkyAttackData(data: AttackFrameData, fighter: ArcadeFighter): AttackFrameData {
  if (fighter.attack?.kind !== 'special') return data
  const command = blinkyCommand(fighter)
  if (!command) return data
  const active = command === 'blood' ? 90 : command === 'eject' ? 1 : 30
  return {
    ...data,
    damage: 0,
    lunge: 0,
    knockback: 0,
    hitstun: 0,
    hitstop: 0,
    active,
    cancelEnd: data.startup + active + 6,
  }
}
