import { beginFight, createFight, tickFight } from './engine'
import { createChrolloBook, toggleChrolloBookmark } from './chrolloBook'
import { performArsenalCommand } from './retrospectiveArsenal'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

export const FORTUNE_SHEET_ID = 'scenario:fortune-identity'
export function ghostwriterSetup(side: FightSide = 'player'): FightState {
  const base = beginFight(
    createFight(
      side === 'player' ? 'chrollo' : 'theta',
      side === 'opponent' ? 'chrollo' : 'theta',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          preparation: { mode: 'scenario', resources: ['fortunes', 'writing'], cohorts: [] },
        },
      },
    ),
  )
  const book = {
    ...base,
    [side]: {
      ...base[side],
      chrolloBook: toggleChrolloBookmark(
        createChrolloBook(['lovely-ghostwriter', 'order-stamp', 'sun-and-moon', 'black-voice']),
      ),
    },
  }
  const kit = performArsenalCommand(book, side, {
    action: 'writing-take',
    target: `${side}:writing-kit`,
  })
  return {
    ...kit,
    [side]: { ...kit[side], aura: 100, x: side === 'player' ? 46 : 54 },
    [side === 'player' ? 'opponent' : 'player']: {
      ...kit[side === 'player' ? 'opponent' : 'player'],
      x: side === 'player' ? 80 : 20,
    },
  }
}
export function fortuneFrames(state: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
export function fortuneSheet(state: FightState) {
  return state.battlefield!.entities.find((entry) => entry.id === FORTUNE_SHEET_ID)!
}
