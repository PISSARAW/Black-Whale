import { commandMary, recallMary } from './bloodyMaryAction'
import { maryBusy, maryCommandReady, maryOwned, maryState } from './bloodyMary'
import { withDolphinIdentity } from './kurapikaDolphin'
import { applyAuraContext } from './nen'
import { holdMary, maryHeld } from './bloodyMary'
import { EMPTY_INPUT, type ArcadeFighter } from './types'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** A borrowed activation controls one deployed batch; it cannot spend a second batch. */
export function finishBorrowedMary(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const { state, side } = options
  const held = state[side].kurapika?.held
  if (held?.source !== 'zakuro') return null
  const command = state[side].bloodyMary?.command
  const slam =
    command === 'slam' ||
    (!command && state[side === 'player' ? 'opponent' : 'player'].maryCapture?.owner === side)
  if (!slam) return recallMary(state, side)
  return withDolphinIdentity(
    state,
    (borrowed) =>
      perform({
        ...options,
        state: {
          ...borrowed,
          [side]: {
            ...borrowed[side],
            bloodyMary: { ...maryState(borrowed[side]), command: 'slam' },
          },
        },
        moveId: held.moveId,
      }),
    'zakuro',
  )
}

export function maryAiAction(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  if (!maryOwned(state.opponent)) return null
  if (state.opponent.bloodyMary?.infusion) return state
  const command = chooseMaryAiCommand(state)
  if (command) return commandMary({ state, side: 'opponent', command }, perform)
  return maryBusy(state.opponent) ? state : null
}

function chooseMaryAiCommand(state: FightState): import('./bloodyMary').MaryCommand | null {
  if (state.player.maryCapture?.owner === 'opponent')
    return maryCommandReady(state, 'opponent', 'slam') ? 'slam' : null
  if (state.opponent.bloodyMary?.tendril?.phase === 'resting') return 'recall'
  const scouts = maryScoutingPlan(state)
  if (scouts !== undefined) return scouts
  for (const command of ['bleed', 'bind', 'infuse'] as const) {
    if (maryAiCanCommand(state, command)) return command
  }
  return null
}

function maryAiCanCommand(state: FightState, command: import('./bloodyMary').MaryCommand): boolean {
  return maryAiInRange(state, command) && maryCommandReady(state, 'opponent', command)
}

function maryScoutingPlan(
  state: FightState,
): import('./bloodyMary').MaryCommand | null | undefined {
  const gap = Math.abs(state.player.x - state.opponent.x)
  if (maryState(state.opponent).drops.length)
    return gap < 22 && maryCommandReady(state, 'opponent', 'recall') ? 'recall' : null
  return gap >= 22 && maryCommandReady(state, 'opponent', 'scout') ? 'scout' : undefined
}

export function maryAiBusy(fighter: ArcadeFighter): boolean {
  return maryHeld(fighter) || Boolean(fighter.bloodyMary?.infusion)
}

export function maryAiBody(fighter: ArcadeFighter): ArcadeFighter {
  return maryHeld(fighter)
    ? holdMary(applyAuraContext(fighter, { ...EMPTY_INPUT, aura: true, guard: true }))
    : { ...fighter, blocking: false, pose: 'idle' }
}

function maryAiInRange(state: FightState, command: import('./bloodyMary').MaryCommand): boolean {
  return command !== 'bind' || Math.abs(state.player.x - state.opponent.x) < 22
}
