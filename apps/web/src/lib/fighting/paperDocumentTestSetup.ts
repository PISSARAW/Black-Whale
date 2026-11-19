import { beginFight, createFight, tickFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { EMPTY_INPUT, type FightSide, type FightState, type FighterId } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'
import { documentById } from './paperDocuments'

export function paperSetup(
  player: FighterId = 'hisoka',
  opponent: FighterId = 'hisoka',
): FightState {
  const state = beginFight(
    createFight(player, opponent, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: 'scenario', resources: ['documents', 'writing'], cohorts: [] },
      },
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 26, aura: 100 },
    opponent: { ...state.opponent, x: 32, aura: 100 },
  }
}
export function paperCommand(
  state: FightState,
  command: ArsenalCommand,
  side: FightSide = 'player',
) {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
export function paperFrames(state: FightState, count = 40): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
export const paperId = 'player:scenario-document'
export const note = (state: FightState) => documentById(state, paperId)!
export function preparePaper(state: FightState, text = 'Document 01 · 21:00'): FightState {
  state = paperCommand(state, { action: 'document-take', target: paperId })
  state = paperCommand(state, { action: 'texture-paper', target: paperId })
  return paperCommand(state, { action: 'texture-paper-text', target: text })
}
export function maskPaper(state: FightState, text?: string): FightState {
  state = preparePaper(state, text)
  return paperFrames(paperCommand(state, { action: 'texture-apply' }))
}
