import { decodeFightSnapshot } from './fightReplaySnapshot'
import { applyPanelReplay } from './fightReplayPanels'
import { beginFight, createFight, nextRound, tickFight, type FightTickOptions } from './engine'
import { performTrainingAction } from './trainingAction'
import { toggleEmperorTime } from './kurapikaActions'
import { performEasterEgg } from './easterEggs'
import { unpackReplayInput } from './fightReplayInput'
import type { ReplayCommand, ReplayPacket, ReplaySetup } from './fightReplayTypes'
import type { FightState } from './types'

export function initialReplayState(setup: ReplaySetup): FightState {
  if (setup.initial) return decodeFightSnapshot(setup.initial, setup)
  const state = createFight(setup.player, setup.opponent, setup)
  return setup.seed === undefined ? state : { ...state, rng: setup.seed }
}
export function applyReplayCommand(state: FightState, command: ReplayCommand): FightState {
  switch (command.kind) {
    case 'panel':
      return applyPanelReplay(state, command)
    case 'start':
      return beginFight(state)
    case 'round':
      return beginFight(nextRound(state))
    case 'emperor':
      return toggleEmperorTime(state, command.side)
    case 'easter':
      return performEasterEgg(state, command.side, command.slot)
    case 'move':
      return performTrainingAction({
        state,
        side: command.side,
        action: command.action,
        input: unpackReplayInput(command.input),
      })
  }
}
export function executeReplayPacket(state: FightState, packet: ReplayPacket): FightState {
  return executeObservedReplayPacket(state, packet)
}
export function executeObservedReplayPacket(
  state: FightState,
  packet: ReplayPacket,
  observe: Pick<FightTickOptions, 'onFrame'> = {},
): FightState {
  const [dt, player, opponent, commands] = packet
  const next = commands.reduce(applyReplayCommand, state)
  return tickFight(next, unpackReplayInput(player), {
    dt,
    opponentInput: next.mode === 'versus-ai' ? undefined : unpackReplayInput(opponent),
    ai: next.mode === 'versus-ai',
    onFrame: observe.onFrame,
  })
}
