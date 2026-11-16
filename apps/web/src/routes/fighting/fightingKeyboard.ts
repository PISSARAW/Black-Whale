import type { AttackKind, FightInput, FightMode, MoveAction } from '$lib/fighting/types'
import { opponentAttackKeys, opponentMovementKeys } from './fightingKeys'
import { isDisplayInput } from './fightingPageHelpers'

export function ignoresFightKey(event: KeyboardEvent, active: boolean): boolean {
  return active && isDisplayInput(event.target)
}

export function dispatchOpponentKey(
  event: KeyboardEvent,
  active: boolean,
  options: {
    mode: FightMode
    control: (key: keyof FightInput, active: boolean) => void
    attack: (action: MoveAction | 'ranged') => void
  },
): boolean {
  if (options.mode === 'versus-ai') return false
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const movement = opponentMovementKeys[key]
  const action = opponentAttackKeys[key]
  if (!movement && !action) return false
  event.preventDefault()
  if (movement) options.control(movement, active)
  if (action && active && !event.repeat) options.attack(action)
  return true
}

export function dispatchHatsuKey(
  event: KeyboardEvent,
  active: boolean,
  options: {
    control: (key: keyof FightInput, active: boolean) => void
    attack: (kind: AttackKind) => void
  },
): boolean {
  if (event.key.toLowerCase() !== 'l') return false
  event.preventDefault()
  if (active && !event.repeat) options.control('hatsu', true)
  if (!active) {
    options.attack('special')
    options.control('hatsu', false)
  }
  return true
}
