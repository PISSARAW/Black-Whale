import { performAuraAttack } from '../engine'
import { performArsenalAction } from '../arsenalExecution'
import { performTrainingAction } from '../trainingAction'
import { unpackReplayInput } from '../fightReplayInput'
import { fightAcceptsCommands } from '../fightOutcome'
import { toggleEmperorTime } from '../kurapikaActions'
import { performEasterEgg, runOutsideEasterEgg } from '../easterEggs'
import { callHanzoBody } from '../hanzoBodyCall'
import { speakBattleWords } from '../battleConversation'
import { designateBlinkyTarget, selectBlinkyCommand } from '../blinky'
import { paperAvailable, selectPaperCommand, selectPaperTarget } from '../kallutoPaper'
import { composeBashoPoem } from '../bashoAction'
import { commandMary } from '../bloodyMaryAction'
import { offerMoonlightContract, respondMoonlightContract } from '../moonlightContract'
import { askLynchQuestion } from '../lynchAction'
import { BATTLE_MOVES } from '../battleCantabileTypes'
import { observeFightCommand } from '../commandFeedback'
import type { FightSide, FightState } from '../types'
import type { PvpCommand } from './types'

export function applyPvpCommand(
  state: FightState,
  side: FightSide,
  command: PvpCommand,
): FightState {
  if (!fightAcceptsCommands(state) || state[side].blackVoiceControl?.active) return state
  const run = (current: FightState) =>
    runOutsideEasterEgg(current, side, (next) => execute(next, side, command))
  return command.kind === 'move'
    ? run(state)
    : observeFightCommand(state, { side, action: 'utility' }, run)
}
function execute(state: FightState, side: FightSide, command: PvpCommand): FightState {
  if (command.kind === 'arsenal') {
    return performArsenalAction(
      {
        state,
        side,
        command: {
          ...command.command,
          target: arsenalTarget(command.command.target, side),
        },
      },
      performAuraAttack,
    )
  }
  return executeTraditional(state, side, command)
}
function executeTraditional(
  state: FightState,
  side: FightSide,
  command: Exclude<PvpCommand, { kind: 'arsenal' }>,
): FightState {
  switch (command.kind) {
    case 'move':
      return performTrainingAction({
        state,
        side,
        action: command.action,
        input: unpackReplayInput(command.input),
      })
    case 'emperor':
      return toggleEmperorTime(state, side)
    case 'easter':
      return performEasterEgg(state, side, command.slot)
    case 'call':
      return callHanzoBody(state, side)
    case 'offer':
      return offerMoonlightContract({ state, side })
    case 'respond':
      return respondMoonlightContract({ state, side, accept: command.accept })
    case 'talk':
      return speakBattleWords(state, side, command.words)
    case 'poem':
      return composeBashoPoem({ state, side, text: command.text }, performAuraAttack)
    case 'mary':
      return commandMary({ state, side, command: command.command }, performAuraAttack)
    default:
      return selectOrUse(state, side, command)
  }
}
function selectOrUse(state: FightState, side: FightSide, command: PvpCommand): FightState {
  switch (command.kind) {
    case 'blinky-target':
      return designateBlinkyTarget(state, side, command.target)
    case 'blinky-command':
      return selectBlinkyCommand(state, side, command.command)
    case 'paper-target':
      return selectPaperTarget(state, side, command.zone)
    case 'paper-command':
      return selectPaperCommand(state, side, command.command)
    case 'question':
      return askLynchQuestion({ state, side, question: command.question }, performAuraAttack)
    case 'paper-use':
      return paperUse(state, side, command.command)
    case 'battle':
      return battle(state, side, command.moveId)
    default:
      return state
  }
}
function battle(state: FightState, side: FightSide, moveId: string): FightState {
  const allowed: readonly string[] = Object.values(BATTLE_MOVES)
  if (state[side].id !== 'bonolenov' || !allowed.includes(moveId)) return state
  return performAuraAttack({ state, side, moveId, kind: 'special', auraCharged: false })
}
function paperUse(state: FightState, side: FightSide, command: 'plant' | 'serpent' | 'doll') {
  if (!paperAvailable(state[side])) return state
  const slot = { plant: 'neutralSpecial', serpent: 'forwardSpecial', doll: 'backSpecial' }[command]
  return performAuraAttack({
    state,
    side,
    moveId: `kalluto:${slot}`,
    kind: 'special',
    auraCharged: false,
  })
}

function arsenalTarget(target: string | undefined, side: FightSide): string | undefined {
  if (target?.startsWith('reserve:') || target?.startsWith('body:'))
    return memberTarget(target, side)
  if (target === 'player') return side
  return target === 'opponent' ? (side === 'player' ? 'opponent' : 'player') : target
}

function memberTarget(target: string, side: FightSide): string {
  const match = /^(reserve|body):(player|opponent):([0-2])$/.exec(target)
  if (!match) return target
  const seat = match[2] === 'player' ? side : side === 'player' ? 'opponent' : 'player'
  return `${match[1]}:${seat}:${match[3]}`
}
