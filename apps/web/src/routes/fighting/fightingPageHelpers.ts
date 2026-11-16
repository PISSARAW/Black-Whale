import { easterEggKeyCommand, type EasterEggPreferences } from '$lib/fighting/easterEggPreferences'
import type { FightSide } from '$lib/fighting/types'
import type { EasterEggSlot } from '$lib/fighting/easterEggCatalogue'
import type { FightInput, FightState } from '$lib/fighting/types'
import type { fightingCopy } from './fightingCopy'

export function winnerLabel(current: FightState, copy: ReturnType<typeof fightingCopy>): string {
  if (current.winner === 'draw') return copy.draw
  return current.winner === 'player' ? copy.victory : copy.defeat
}

export function finishLabel(current: FightState, language: 'fr' | 'en'): string {
  if (current.finishReason === 'expulsion') return language === 'fr' ? 'EXPULSION' : 'EXPELLED'
  if (current.finishReason === 'time') return 'TIME'
  if (current.finishReason === 'hits') return '10 PTS'
  if (current.finishReason === 'technical-knockout') return 'T.K.O.'
  return 'K.O.'
}

export function isDisplayInput(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'input, select, textarea, summary, [contenteditable="true"], [data-fight-scroll]',
      ),
    )
  )
}

export function canControlFight(state: FightState | null, paused: boolean): boolean {
  return !paused || state?.mode === 'training'
}

export function handleEasterKey(
  event: KeyboardEvent,
  options: {
    active: boolean
    state: FightState
    keys: EasterEggPreferences['keys']
    input: FightInput
    opponentInput: FightInput
  },
  play: (side: FightSide, slot: EasterEggSlot) => void,
): boolean {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const egg = easterEggKeyCommand(key, options)
  if (!egg) return false
  event.preventDefault()
  if (options.active && !event.repeat) play(egg.side, egg.slot)
  return true
}
