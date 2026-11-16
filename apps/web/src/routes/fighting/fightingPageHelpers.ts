import type { FightInput, FightState, MoveAction } from '$lib/fighting/types'
import type { fightingCopy } from './fightingCopy'

export type DummyCommandData =
  | { type: 'input'; key: keyof FightInput; active: boolean }
  | { type: 'attack'; action: MoveAction | 'ranged' }
export type DummyCommand = DummyCommandData & { frame: number }

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
