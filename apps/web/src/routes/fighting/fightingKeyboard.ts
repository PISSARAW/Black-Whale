import { createCombatChordTracker } from '$lib/fighting/combatChords'
import type { FightInput, FightMode, MoveAction } from '$lib/fighting/types'
import { attackKeys, opponentAttackKeys, opponentMovementKeys } from './fightingKeys'
import { isDisplayInput } from './fightingPageHelpers'

const playerChords = createCombatChordTracker()
const opponentChords = createCombatChordTracker()

export function resetKeyboardChords(): void {
  playerChords.clear()
  opponentChords.clear()
}

export function ignoresFightKey(event: KeyboardEvent, active: boolean): boolean {
  return active && isDisplayInput(event.target)
}

interface SideAttackOptions {
  input: Pick<FightInput, 'guard'>
  control: (key: keyof FightInput, active: boolean) => void
  onMove: (action: MoveAction | 'ranged') => void
}

function handleOffensiveKey(
  tracker: ReturnType<typeof createCombatChordTracker>,
  action: 'light' | 'heavy' | 'special',
  options: SideAttackOptions & { active: boolean; repeat: boolean },
): void {
  if (!options.active) {
    if (action === 'special') options.control('hatsu', false)
    tracker.release(action)
    return
  }
  if (options.repeat) return
  const resolved = tracker.press(action, options.input)
  if (!resolved) return
  if (resolved.kind === 'burst') options.control('burst', true)
  else {
    if (action === 'special') options.control('hatsu', resolved.action === 'special')
    options.onMove(resolved.action)
  }
}

interface OpponentKeys {
  mode: FightMode
  input: FightInput
  control: (key: keyof FightInput, active: boolean) => void
  attack: (action: MoveAction | 'ranged') => void
}

export function dispatchOpponentKey(
  event: KeyboardEvent,
  active: boolean,
  options: OpponentKeys,
): boolean {
  if (options.mode === 'versus-ai') return false
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const movement = opponentMovementKeys[key]
  const action = opponentAttackKeys[key]
  if (!movement && !action) return false
  event.preventDefault()
  if (movement) options.control(movement, active)
  if (action) {
    handleOffensiveKey(opponentChords, action, {
      input: options.input,
      control: options.control,
      onMove: options.attack,
      active,
      repeat: event.repeat,
    })
  }
  return true
}

export function dispatchPlayerAttackKey(
  event: KeyboardEvent,
  active: boolean,
  options: SideAttackOptions,
): boolean {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const action = attackKeys[key]
  if (!action) return false
  event.preventDefault()
  handleOffensiveKey(playerChords, action, {
    ...options,
    active,
    repeat: event.repeat,
  })
  return true
}
