import type { FightInput, MoveAction } from '$lib/fighting/types'

const heldInputs: Record<string, keyof FightInput> = {
  playerLeft: 'left',
  playerRight: 'right',
  playerJump: 'jump',
  playerDown: 'down',
  playerGuard: 'guard',
  playerAura: 'aura',
  playerSpecial: 'hatsu',
  playerContext: 'context',
  playerBurst: 'burst',
  playerKameo: 'kameo',
  playerOn: 'onIntent',
  'nen:playerLight': 'en',
  'nen:playerHeavy': 'conceal',
  'nen:playerSpecial': 'shu',
  'nen:playerFinisher': 'gyo',
  'nen:playerKameo': 'focusHead',
  'nen:playerProjectile': 'focusTorso',
  'nen:playerThrow': 'focusHands',
  'nen:playerBurst': 'focusFeet',
  'nen:playerAura': 'zetsuIntent',
  'nen:playerContext': 'seiyakuIntent',
  'nen:playerOn': 'lowGyoIntent',
  'nen:playerLeft': 'call',
  'nen:playerRight': 'interact',
  'nen:playerJump': 'coverEars',
  'nen:playerDown': 'plugWounds',
}

const attacks: Record<string, MoveAction | 'ranged'> = {
  playerLight: 'light',
  playerHeavy: 'heavy',
  playerSpecial: 'special',
  playerThrow: 'throw',
  playerFinisher: 'finisher',
  playerProjectile: 'ranged',
}

export function dispatchDirectFightKey(
  event: KeyboardEvent,
  active: boolean,
  options: {
    control: (key: keyof FightInput, active: boolean) => void
    attack: (action: MoveAction | 'ranged') => void
  },
): boolean {
  if (!event.key.startsWith('direct:')) return false
  event.preventDefault()
  if (event.repeat) return true
  const command = event.key.slice('direct:'.length)
  const held = heldInputs[command]
  const attack = attacks[command]
  if (active && (held || attack)) options.control('directControls', true)
  if (held) options.control(held, active)
  if (active && attack) options.attack(attack)
  return true
}
